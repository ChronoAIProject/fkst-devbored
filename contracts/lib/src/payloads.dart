import 'dart:convert';

import 'errors.dart';

final class SourceRef {
  SourceRef({required this.kind, required this.ref}) {
    _nonEmpty(kind, r'$.source_ref.kind');
    _nonEmpty(ref, r'$.source_ref.ref');
  }

  factory SourceRef.fromJson(Object? value) {
    final json = _object(value, r'$.source_ref');
    return SourceRef(
      kind: _string(json['kind'], r'$.source_ref.kind'),
      ref: _string(json['ref'], r'$.source_ref.ref'),
    );
  }

  final String kind;
  final String ref;

  Map<String, Object?> toJson() => {'kind': kind, 'ref': ref};

  @override
  bool operator ==(Object other) =>
      other is SourceRef && other.kind == kind && other.ref == ref;

  @override
  int get hashCode => Object.hash(kind, ref);
}

final class ConsensusProposal {
  ConsensusProposal._({
    required this.schema,
    required this.angles,
    required this.body,
    required this.dedupKey,
    required this.effectVersion,
    required this.proposalId,
    required this.sourceRef,
    required this.stage,
    required this.title,
    required this.verdictMode,
    required this.workItemId,
    required this.worktree,
  });

  factory ConsensusProposal.parse(String source) =>
      ConsensusProposal.fromJson(_decodeObject(source));

  factory ConsensusProposal.fromJson(Map<String, Object?> json) {
    const schema = 'consensus.proposal.v1';
    if (json['schema'] != schema) {
      throw ContractFormatException(
        r'$.schema must be consensus.proposal.v1',
        source: json,
      );
    }
    final angles = _stringList(json['angles'], r'$.angles');
    if (angles.isEmpty || angles.length > 4) {
      throw ContractFormatException(
        r'$.angles must contain 1 to 4 entries',
        source: json,
      );
    }
    for (final angle in angles) {
      if (angle.isEmpty || _containsControl(angle)) {
        throw ContractFormatException(
          r'$.angles entries must be non-empty single-line strings',
          source: json,
        );
      }
    }
    final stage = _string(json['stage'], r'$.stage');
    if (stage != 'design' && stage != 'review') {
      throw ContractFormatException(
        r'$.stage must be design or review',
        source: json,
      );
    }
    return ConsensusProposal._(
      schema: schema,
      angles: List.unmodifiable(angles),
      body: _string(json['body'], r'$.body'),
      dedupKey: _nonEmptyString(json['dedup_key'], r'$.dedup_key'),
      effectVersion: _decimalStringAsPositiveInt(
        json['effect_version'],
        r'$.effect_version',
      ),
      proposalId: _nonEmptyString(json['proposal_id'], r'$.proposal_id'),
      sourceRef: SourceRef.fromJson(json['source_ref']),
      stage: stage,
      title: _string(json['title'], r'$.title'),
      verdictMode: _nonEmptyString(json['verdict_mode'], r'$.verdict_mode'),
      workItemId: _nonEmptyString(json['work_item_id'], r'$.work_item_id'),
      worktree: _nonEmptyString(json['worktree'], r'$.worktree'),
    );
  }

  final String schema;
  final List<String> angles;
  final String body;
  final String dedupKey;
  final int effectVersion;
  final String proposalId;
  final SourceRef sourceRef;
  final String stage;
  final String title;
  final String verdictMode;
  final String workItemId;
  final String worktree;

  List<String> get seats => angles;

  Map<String, Object?> toJson() => {
        'angles': angles,
        'body': body,
        'dedup_key': dedupKey,
        'effect_version': effectVersion.toString(),
        'proposal_id': proposalId,
        'schema': schema,
        'source_ref': sourceRef.toJson(),
        'stage': stage,
        'title': title,
        'verdict_mode': verdictMode,
        'work_item_id': workItemId,
        'worktree': worktree,
      };
}

final class ConsensusResult {
  ConsensusResult._({
    required this.angleResults,
    required this.body,
    required this.decision,
    required this.dedupKey,
    required this.effectVersion,
    required this.proposalId,
    required this.schema,
    required this.sourceRef,
  });

  factory ConsensusResult.parse(String source) =>
      ConsensusResult.fromJson(_decodeObject(source));

  factory ConsensusResult.fromJson(Map<String, Object?> json) {
    const schema = 'consensus.consensus_reached.v1';
    if (json['schema'] != schema) {
      throw ContractFormatException(
        r'$.schema must be consensus.consensus_reached.v1',
        source: json,
      );
    }
    if (json['decision'] != 'approve') {
      throw ContractFormatException(
        r'$.decision must be approve for a reached result',
        source: json,
      );
    }
    final rawResults = json['angle_results'];
    if (rawResults is! List || rawResults.isEmpty || rawResults.length > 4) {
      throw ContractFormatException(
        r'$.angle_results must contain 1 to 4 entries',
        source: json,
      );
    }
    final results =
        rawResults.map(ConsensusAngleResult.fromJson).toList(growable: false);
    final angles = results.map((result) => result.angle).toSet();
    if (angles.length != results.length) {
      throw ContractFormatException(
        r'$.angle_results angles must be distinct',
        source: json,
      );
    }
    return ConsensusResult._(
      angleResults: List.unmodifiable(results),
      body: _string(json['body'], r'$.body'),
      decision: 'approve',
      dedupKey: _nonEmptyString(json['dedup_key'], r'$.dedup_key'),
      effectVersion: _decimalStringAsPositiveInt(
        json['effect_version'],
        r'$.effect_version',
      ),
      proposalId: _nonEmptyString(json['proposal_id'], r'$.proposal_id'),
      schema: schema,
      sourceRef: SourceRef.fromJson(json['source_ref']),
    );
  }

  final List<ConsensusAngleResult> angleResults;
  final String body;
  final String decision;
  final String dedupKey;
  final int effectVersion;
  final String proposalId;
  final String schema;
  final SourceRef sourceRef;

  List<String> get seats =>
      List.unmodifiable(angleResults.map((result) => result.angle));

  Map<String, Object?> toJson() => {
        'angle_results': angleResults.map((result) => result.toJson()).toList(),
        'body': body,
        'decision': decision,
        'dedup_key': dedupKey,
        'effect_version': effectVersion.toString(),
        'proposal_id': proposalId,
        'schema': schema,
        'source_ref': sourceRef.toJson(),
      };
}

final class ConsensusAngleResult {
  ConsensusAngleResult({required this.angle, required this.verdict}) {
    _nonEmpty(angle, r'$.angle_results[].angle');
    if (verdict != 'approve') {
      throw const ContractFormatException(
        r'$.angle_results[].verdict must be approve for a reached result',
      );
    }
  }

  factory ConsensusAngleResult.fromJson(Object? value) {
    final json = _object(value, r'$.angle_results[]');
    return ConsensusAngleResult(
      angle: _nonEmptyString(json['angle'], r'$.angle_results[].angle'),
      verdict: _string(json['verdict'], r'$.angle_results[].verdict'),
    );
  }

  final String angle;
  final String verdict;

  Map<String, Object?> toJson() => {'angle': angle, 'verdict': verdict};
}

Map<String, Object?> _decodeObject(String source) {
  Object? decoded;
  try {
    decoded = jsonDecode(source);
  } on FormatException catch (error) {
    throw ContractFormatException(
      'invalid JSON: ${error.message}',
      source: source,
    );
  }
  return _object(decoded, r'$');
}

Map<String, Object?> _object(Object? value, String path) {
  if (value is! Map) {
    throw ContractFormatException('$path must be an object', source: value);
  }
  return Map<String, Object?>.from(value);
}

String _string(Object? value, String path) {
  if (value is! String) {
    throw ContractFormatException('$path must be a string', source: value);
  }
  return value;
}

String _nonEmptyString(Object? value, String path) {
  final result = _string(value, path);
  _nonEmpty(result, path);
  return result;
}

void _nonEmpty(String value, String path) {
  if (value.isEmpty) {
    throw ContractFormatException('$path must be non-empty', source: value);
  }
}

List<String> _stringList(Object? value, String path) {
  if (value is! List || value.any((item) => item is! String)) {
    throw ContractFormatException(
      '$path must be an array of strings',
      source: value,
    );
  }
  return List<String>.from(value);
}

int _decimalStringAsPositiveInt(Object? value, String path) {
  final raw = _string(value, path);
  if (!RegExp(r'^[1-9][0-9]*$').hasMatch(raw)) {
    throw ContractFormatException(
      '$path must be a canonical positive decimal string',
      source: value,
    );
  }
  final parsed = int.tryParse(raw);
  if (parsed == null || parsed.toString() != raw) {
    throw ContractFormatException(
      '$path is outside the supported integer range',
      source: value,
    );
  }
  return parsed;
}

bool _containsControl(String value) =>
    value.codeUnits.any((unit) => unit < 32 || unit == 127);
