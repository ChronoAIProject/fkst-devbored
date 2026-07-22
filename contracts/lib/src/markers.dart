import 'errors.dart';

const _markerPrefix = '<!-- fkst:devbored:';

const Map<String, int> stateStageRanks = {
  'thinking': 100,
  'ready': 500,
  'implementing': 600,
  'awaiting-pr': 625,
  'pr-open': 650,
  'reviewing': 675,
  'merge-ready': 690,
  'merging': 695,
  'fixing': 700,
  'impl-failed': 750,
  'blocked': 800,
  'merged': 900,
};

const _terminalStates = {'merged', 'impl-failed', 'blocked'};
const _consensusStages = {'design', 'review'};
const _consensusOutcomes = {'reached', 'converge', 'stalled'};
const _reviewDecisions = {'approve', 'reject'};
const _knownKinds = {'state', 'consensus', 'review', 'merge-ready', 'failure'};

sealed class MarkerParseResult {
  const MarkerParseResult();
}

sealed class DevboredMarker extends MarkerParseResult {
  const DevboredMarker();

  String build();
}

final class UnparseableMarker extends MarkerParseResult {
  const UnparseableMarker(this.reason);

  final String reason;

  @override
  bool operator ==(Object other) =>
      other is UnparseableMarker && other.reason == reason;

  @override
  int get hashCode => reason.hashCode;

  @override
  String toString() => 'UnparseableMarker($reason)';
}

final class StateMarker extends DevboredMarker {
  StateMarker({
    required this.workItem,
    required this.state,
    required this.version,
    required this.stageRank,
    this.why,
  }) {
    _validateState(this);
  }

  final String workItem;
  final String state;
  final int version;
  final int stageRank;
  final String? why;

  @override
  String build() {
    final whyAttribute = why == null ? '' : ' why="${_escapeAttribute(why!)}"';
    return '${_markerPrefix}state:v1 work_item="${_escapeAttribute(workItem)}" '
        'state="$state" version="$version" stage_rank="$stageRank"'
        '$whyAttribute -->';
  }

  @override
  bool operator ==(Object other) =>
      other is StateMarker &&
      other.workItem == workItem &&
      other.state == state &&
      other.version == version &&
      other.stageRank == stageRank &&
      other.why == why;

  @override
  int get hashCode => Object.hash(workItem, state, version, stageRank, why);
}

final class ConsensusMarker extends DevboredMarker {
  ConsensusMarker({
    required this.proposalId,
    required this.stage,
    required this.outcome,
    required this.round,
    required List<String> seats,
  }) : seats = List.unmodifiable(seats) {
    _validateConsensus(this);
  }

  final String proposalId;
  final String stage;
  final String outcome;
  final int round;
  final List<String> seats;

  @override
  String build() =>
      '${_markerPrefix}consensus:v1 proposal_id="${_escapeAttribute(proposalId)}" '
      'stage="$stage" outcome="$outcome" round="$round" '
      'seats="${seats.join(',')}" -->';

  @override
  bool operator ==(Object other) =>
      other is ConsensusMarker &&
      other.proposalId == proposalId &&
      other.stage == stage &&
      other.outcome == outcome &&
      other.round == round &&
      _listEquals(other.seats, seats);

  @override
  int get hashCode =>
      Object.hash(proposalId, stage, outcome, round, Object.hashAll(seats));
}

final class ReviewMarker extends DevboredMarker {
  ReviewMarker({
    required this.pullRequest,
    required this.headSha,
    required this.decision,
    required List<String> seats,
  }) : seats = List.unmodifiable(seats) {
    _validateReview(this);
  }

  final int pullRequest;
  final String headSha;
  final String decision;
  final List<String> seats;

  @override
  String build() =>
      '${_markerPrefix}review:v1 pr="$pullRequest" head_sha="$headSha" '
      'decision="$decision" seats="${seats.join(',')}" -->';

  @override
  bool operator ==(Object other) =>
      other is ReviewMarker &&
      other.pullRequest == pullRequest &&
      other.headSha == headSha &&
      other.decision == decision &&
      _listEquals(other.seats, seats);

  @override
  int get hashCode =>
      Object.hash(pullRequest, headSha, decision, Object.hashAll(seats));
}

final class MergeReadyMarker extends DevboredMarker {
  MergeReadyMarker({
    required this.pullRequest,
    required this.headSha,
    required this.version,
  }) {
    _validateMergeReady(this);
  }

  final int pullRequest;
  final String headSha;
  final int version;

  @override
  String build() =>
      '${_markerPrefix}merge-ready:v1 pr="$pullRequest" head_sha="$headSha" '
      'version="$version" -->';

  @override
  bool operator ==(Object other) =>
      other is MergeReadyMarker &&
      other.pullRequest == pullRequest &&
      other.headSha == headSha &&
      other.version == version;

  @override
  int get hashCode => Object.hash(pullRequest, headSha, version);
}

final class FailureMarker extends DevboredMarker {
  FailureMarker({
    required this.workItem,
    required this.errorClass,
    required this.fingerprint,
    required this.why,
  }) {
    _validateFailure(this);
  }

  final String workItem;
  final String errorClass;
  final String fingerprint;
  final String why;

  @override
  String build() =>
      '${_markerPrefix}failure:v1 work_item="${_escapeAttribute(workItem)}" '
      'error_class="$errorClass" fingerprint="$fingerprint" '
      'why="${_escapeAttribute(why)}" -->';

  @override
  bool operator ==(Object other) =>
      other is FailureMarker &&
      other.workItem == workItem &&
      other.errorClass == errorClass &&
      other.fingerprint == fingerprint &&
      other.why == why;

  @override
  int get hashCode => Object.hash(workItem, errorClass, fingerprint, why);
}

MarkerParseResult parseMarker(String commentBody) {
  try {
    final candidate = _extractMarker(commentBody);
    final header = RegExp(
      r'^<!-- fkst:devbored:([A-Za-z0-9_-]+):([A-Za-z0-9.-]+)(.*) -->$',
    ).firstMatch(candidate);
    if (header == null) {
      throw const MarkerBuildException('malformed marker header');
    }

    final kind = header.group(1)!;
    final schema = header.group(2)!;
    if (schema != 'v1') {
      throw MarkerBuildException('unknown schema $schema');
    }
    if (!_knownKinds.contains(kind)) {
      throw MarkerBuildException('unknown marker kind $kind');
    }

    final attributes = _parseAttributes(header.group(3)!);
    final marker = _markerFromAttributes(kind, attributes);
    if (marker.build() != candidate) {
      throw const MarkerBuildException('marker is not in canonical form');
    }
    return marker;
  } on MarkerBuildException catch (error) {
    return UnparseableMarker('devbored marker parse error: ${error.detail}');
  } on FormatException catch (error) {
    return UnparseableMarker('devbored marker parse error: ${error.message}');
  }
}

String _extractMarker(String body) {
  final prefixCount = _occurrenceCount(body, _markerPrefix);
  if (prefixCount == 0) {
    throw const MarkerBuildException('no devbored marker found');
  }

  final candidates = RegExp(r'<!--.*?-->', dotAll: true)
      .allMatches(body)
      .map((match) => match.group(0)!)
      .where((candidate) => candidate.startsWith(_markerPrefix))
      .toList(growable: false);
  if (prefixCount != candidates.length) {
    throw const MarkerBuildException('truncated or malformed marker');
  }
  if (candidates.length != 1) {
    throw const MarkerBuildException(
      'comment body must contain exactly one devbored marker',
    );
  }
  return candidates.single;
}

Map<String, String> _parseAttributes(String text) {
  final attributes = <String, String>{};
  var rest = text;
  final attributePattern = RegExp(r'^ ([A-Za-z0-9_-]+)="([^"]*)"');
  while (rest.isNotEmpty) {
    final match = attributePattern.firstMatch(rest);
    if (match == null) {
      throw const MarkerBuildException('malformed attribute list');
    }
    final name = match.group(1)!;
    if (attributes.containsKey(name)) {
      throw MarkerBuildException('duplicate attribute $name');
    }
    attributes[name] = _decodeAttribute(match.group(2)!);
    rest = rest.substring(match.end);
  }
  return attributes;
}

DevboredMarker _markerFromAttributes(
  String kind,
  Map<String, String> attributes,
) {
  switch (kind) {
    case 'state':
      final state = _requiredAttribute(attributes, 'state');
      final terminal = _terminalStates.contains(state);
      _requireExactKeys(attributes, {
        'work_item',
        'state',
        'version',
        'stage_rank',
        if (terminal) 'why',
      });
      return StateMarker(
        workItem: _requiredAttribute(attributes, 'work_item'),
        state: state,
        version: _canonicalInteger(attributes, 'version'),
        stageRank: _canonicalInteger(attributes, 'stage_rank'),
        why: terminal ? _requiredAttribute(attributes, 'why') : null,
      );
    case 'consensus':
      _requireExactKeys(attributes, {
        'proposal_id',
        'stage',
        'outcome',
        'round',
        'seats',
      });
      return ConsensusMarker(
        proposalId: _requiredAttribute(attributes, 'proposal_id'),
        stage: _requiredAttribute(attributes, 'stage'),
        outcome: _requiredAttribute(attributes, 'outcome'),
        round: _canonicalInteger(attributes, 'round'),
        seats: _requiredAttribute(attributes, 'seats').split(','),
      );
    case 'review':
      _requireExactKeys(attributes, {'pr', 'head_sha', 'decision', 'seats'});
      return ReviewMarker(
        pullRequest: _canonicalInteger(attributes, 'pr'),
        headSha: _requiredAttribute(attributes, 'head_sha'),
        decision: _requiredAttribute(attributes, 'decision'),
        seats: _requiredAttribute(attributes, 'seats').split(','),
      );
    case 'merge-ready':
      _requireExactKeys(attributes, {'pr', 'head_sha', 'version'});
      return MergeReadyMarker(
        pullRequest: _canonicalInteger(attributes, 'pr'),
        headSha: _requiredAttribute(attributes, 'head_sha'),
        version: _canonicalInteger(attributes, 'version'),
      );
    case 'failure':
      _requireExactKeys(attributes, {
        'work_item',
        'error_class',
        'fingerprint',
        'why',
      });
      return FailureMarker(
        workItem: _requiredAttribute(attributes, 'work_item'),
        errorClass: _requiredAttribute(attributes, 'error_class'),
        fingerprint: _requiredAttribute(attributes, 'fingerprint'),
        why: _requiredAttribute(attributes, 'why'),
      );
  }
  throw MarkerBuildException('unknown marker kind $kind');
}

void _validateState(StateMarker marker) {
  _requireSafeString(marker.workItem, 'work_item');
  final expectedRank = stateStageRanks[marker.state];
  if (expectedRank == null) {
    throw MarkerBuildException('invalid state ${marker.state}');
  }
  _requireNonNegative(marker.version, 'version');
  _requireNonNegative(marker.stageRank, 'stage_rank');
  if (marker.stageRank != expectedRank) {
    throw MarkerBuildException(
      'stage_rank does not match state ${marker.state}',
    );
  }
  final terminal = _terminalStates.contains(marker.state);
  if (terminal && marker.why == null) {
    throw const MarkerBuildException('missing attribute why');
  }
  if (!terminal && marker.why != null) {
    throw const MarkerBuildException('unexpected attribute why');
  }
  if (marker.why != null) {
    _requireSafeString(marker.why!, 'why');
  }
}

void _validateConsensus(ConsensusMarker marker) {
  _requireSafeString(marker.proposalId, 'proposal_id');
  _requireEnum(marker.stage, 'stage', _consensusStages);
  _requireEnum(marker.outcome, 'outcome', _consensusOutcomes);
  _requirePositive(marker.round, 'round');
  _requireSeats(marker.seats);
}

void _validateReview(ReviewMarker marker) {
  _requirePositive(marker.pullRequest, 'pr');
  _requireHeadSha(marker.headSha);
  _requireEnum(marker.decision, 'decision', _reviewDecisions);
  _requireSeats(marker.seats);
}

void _validateMergeReady(MergeReadyMarker marker) {
  _requirePositive(marker.pullRequest, 'pr');
  _requireHeadSha(marker.headSha);
  _requireNonNegative(marker.version, 'version');
}

void _validateFailure(FailureMarker marker) {
  _requireSafeString(marker.workItem, 'work_item');
  _requireToken(marker.errorClass, 'error_class');
  _requireSafeString(marker.fingerprint, 'fingerprint');
  if (!RegExp(r'^[A-Za-z0-9._:/-]+$').hasMatch(marker.fingerprint)) {
    throw const MarkerBuildException(
      'fingerprint must be a stable marker-safe key',
    );
  }
  _requireSafeString(marker.why, 'why');
}

void _requireExactKeys(Map<String, String> values, Set<String> expected) {
  for (final key in expected) {
    if (!values.containsKey(key)) {
      throw MarkerBuildException('missing attribute $key');
    }
  }
  for (final key in values.keys) {
    if (!expected.contains(key)) {
      throw MarkerBuildException('unexpected attribute $key');
    }
  }
}

String _requiredAttribute(Map<String, String> values, String name) {
  final value = values[name];
  if (value == null) {
    throw MarkerBuildException('missing attribute $name');
  }
  return value;
}

int _canonicalInteger(Map<String, String> values, String name) {
  final raw = _requiredAttribute(values, name);
  if (!RegExp(r'^(0|[1-9][0-9]*)$').hasMatch(raw)) {
    throw MarkerBuildException('$name must be a canonical integer');
  }
  final value = int.tryParse(raw);
  if (value == null || value.toString() != raw) {
    throw MarkerBuildException('$name must be a canonical integer');
  }
  return value;
}

void _requireSafeString(String value, String name) {
  if (value.isEmpty) {
    throw MarkerBuildException('$name must be a non-empty string');
  }
  if (value.codeUnits.any((unit) => unit < 32 || unit == 127)) {
    throw MarkerBuildException('$name must not contain control characters');
  }
  if (value.contains('--')) {
    throw MarkerBuildException(
      '$name must not contain an HTML comment terminator',
    );
  }
}

void _requireToken(String value, String name) {
  _requireSafeString(value, name);
  if (!RegExp(r'^[A-Za-z0-9._-]+$').hasMatch(value)) {
    throw MarkerBuildException('$name must be a marker-safe token');
  }
}

void _requireSeats(List<String> seats) {
  if (seats.isEmpty || seats.toSet().length != seats.length) {
    throw const MarkerBuildException(
      'seats must be a CSV of distinct marker-safe tokens',
    );
  }
  for (final seat in seats) {
    if (!RegExp(r'^[A-Za-z0-9._-]+$').hasMatch(seat)) {
      throw const MarkerBuildException(
        'seats must be a CSV of distinct marker-safe tokens',
      );
    }
  }
}

void _requireHeadSha(String value) {
  _requireSafeString(value, 'head_sha');
  if (!RegExp(r'^(?:[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})$').hasMatch(value)) {
    throw const MarkerBuildException(
      'head_sha must be a 40- or 64-character hexadecimal object ID',
    );
  }
}

void _requireEnum(String value, String name, Set<String> allowed) {
  _requireSafeString(value, name);
  if (!allowed.contains(value)) {
    throw MarkerBuildException('invalid $name $value');
  }
}

void _requirePositive(int value, String name) {
  if (value < 1) {
    throw MarkerBuildException('$name must be a positive integer');
  }
}

void _requireNonNegative(int value, String name) {
  if (value < 0) {
    throw MarkerBuildException('$name must be a non-negative integer');
  }
}

String _escapeAttribute(String value) => value
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

String _decodeAttribute(String value) {
  final buffer = StringBuffer();
  var cursor = 0;
  const entities = {'&amp;': '&', '&quot;': '"', '&lt;': '<', '&gt;': '>'};
  while (cursor < value.length) {
    final amp = value.indexOf('&', cursor);
    if (amp < 0) {
      buffer.write(value.substring(cursor));
      break;
    }
    buffer.write(value.substring(cursor, amp));
    MapEntry<String, String>? match;
    for (final entity in entities.entries) {
      if (value.startsWith(entity.key, amp)) {
        match = entity;
        break;
      }
    }
    if (match == null) {
      throw const MarkerBuildException('attribute contains an unknown entity');
    }
    buffer.write(match.value);
    cursor = amp + match.key.length;
  }
  final decoded = buffer.toString();
  if (_escapeAttribute(decoded) != value) {
    throw const MarkerBuildException('attribute encoding is not canonical');
  }
  return decoded;
}

int _occurrenceCount(String value, String pattern) {
  var count = 0;
  var cursor = 0;
  while (true) {
    final index = value.indexOf(pattern, cursor);
    if (index < 0) return count;
    count += 1;
    cursor = index + pattern.length;
  }
}

bool _listEquals<T>(List<T> left, List<T> right) {
  if (left.length != right.length) return false;
  for (var index = 0; index < left.length; index += 1) {
    if (left[index] != right[index]) return false;
  }
  return true;
}
