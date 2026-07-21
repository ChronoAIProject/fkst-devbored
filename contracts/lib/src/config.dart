import 'dart:convert';

import 'errors.dart';

final class DevboredConfig {
  DevboredConfig._({
    required this.schema,
    required this.version,
    required this.labels,
    required this.intake,
    required this.stages,
  });

  factory DevboredConfig.parse(String source, {int? previousVersion}) {
    Object? decoded;
    try {
      decoded = jsonDecode(source);
    } on FormatException {
      throw ConfigException('invalid JSON', source: source);
    }
    if (decoded is! Map) {
      throw ConfigException('invalid JSON', source: source);
    }
    return DevboredConfig.fromJson(
      Map<String, Object?>.from(decoded),
      previousVersion: previousVersion,
    );
  }

  factory DevboredConfig.fromJson(
    Map<String, Object?> json, {
    int? previousVersion,
  }) {
    if (json['schema'] != 'devbored.config.v1') {
      throw ConfigException('expected schema devbored.config.v1', source: json);
    }
    final version = json['version'];
    if (!_isPositiveInteger(version)) {
      throw ConfigException('version must be a positive integer', source: json);
    }

    _rejectUnknownKeys(
        json,
        const {
          'schema',
          'version',
          'labels',
          'intake',
          'stages',
        },
        r'$');

    final stagesJson = _mapOrNull(json['stages']);
    final designJson = _mapOrNull(stagesJson?['design']);
    final reviewJson = _mapOrNull(stagesJson?['review']);
    if (!_isSeatArray(designJson?['seats'])) {
      throw ConfigException(
        'stages.design.seats must contain 1 to 4 distinct marker-safe names',
        source: json,
      );
    }
    if (!_isSeatArray(reviewJson?['seats'])) {
      throw ConfigException(
        'stages.review.seats must contain 1 to 4 distinct marker-safe names',
        source: json,
      );
    }

    if (previousVersion != null) {
      if (previousVersion < 1) {
        throw ConfigException(
          'previous version must be a positive integer',
          source: previousVersion,
        );
      }
      if ((version as int) < previousVersion) {
        throw ConfigException('version moved backward', source: json);
      }
    }

    final labelsJson = _mapOrNull(json['labels']);
    if (labelsJson == null ||
        !_isNonEmptyString(labelsJson['prefix']) ||
        !_isNonEmptyString(labelsJson['enabled']) ||
        !_isNonEmptyString(labelsJson['claimed']) ||
        !_isStringMap(labelsJson['state']) ||
        !_isStringMap(labelsJson['priorityClasses'])) {
      throw ConfigException('labels contract is invalid', source: json);
    }
    _rejectUnknownKeys(
        labelsJson,
        const {
          'prefix',
          'enabled',
          'claimed',
          'state',
          'priorityClasses',
        },
        r'$.labels');

    final stateLabels = _requiredMap(labelsJson['state']);
    final priorityClasses = _requiredMap(labelsJson['priorityClasses']);
    _rejectUnknownLeafValues(stateLabels, r'$.labels.state');
    _rejectUnknownLeafValues(priorityClasses, r'$.labels.priorityClasses');

    final intakeJson = _mapOrNull(json['intake']);
    if (intakeJson == null ||
        intakeJson['requireEnabledLabel'] is! bool ||
        !_isPositiveIntegerArray(intakeJson['milestones']) ||
        !const {
          'any',
          'collaborator',
          'member',
        }.contains(intakeJson['authorPolicy'])) {
      throw ConfigException('intake contract is invalid', source: json);
    }
    _rejectUnknownKeys(
        intakeJson,
        const {
          'requireEnabledLabel',
          'milestones',
          'authorPolicy',
        },
        r'$.intake');

    if (stagesJson == null ||
        designJson == null ||
        reviewJson == null ||
        !_isAgreement(designJson['agreement']) ||
        !_isBudgets(designJson['budgets']) ||
        !_isAgreement(reviewJson['agreement']) ||
        !_isBudgets(reviewJson['budgets'])) {
      throw ConfigException(
        'design or review stage contract is invalid',
        source: json,
      );
    }
    _rejectUnknownKeys(
        stagesJson,
        const {
          'design',
          'review',
          'implement',
          'merge',
        },
        r'$.stages');
    _rejectUnknownKeys(
        designJson,
        const {
          'seats',
          'agreement',
          'budgets',
        },
        r'$.stages.design');
    _rejectUnknownKeys(
        reviewJson,
        const {
          'seats',
          'agreement',
          'budgets',
        },
        r'$.stages.review');

    final designBudgetsJson = _requiredMap(designJson['budgets']);
    final reviewBudgetsJson = _requiredMap(reviewJson['budgets']);
    _rejectUnknownKeys(
        designBudgetsJson,
        const {
          'maxRounds',
          'timeoutSeconds',
        },
        r'$.stages.design.budgets');
    _rejectUnknownKeys(
        reviewBudgetsJson,
        const {
          'maxRounds',
          'timeoutSeconds',
        },
        r'$.stages.review.budgets');

    final implementJson = _mapOrNull(stagesJson['implement']);
    if (implementJson == null ||
        !_isNonEmptyString(implementJson['model']) ||
        !_isNonEmptyString(implementJson['effort']) ||
        !_isNonEmptyString(implementJson['localTestCommand'])) {
      throw ConfigException(
        'implement stage contract is invalid',
        source: json,
      );
    }
    _rejectUnknownKeys(
        implementJson,
        const {
          'model',
          'effort',
          'localTestCommand',
        },
        r'$.stages.implement');

    final mergeJson = _mapOrNull(stagesJson['merge']);
    if (mergeJson == null ||
        mergeJson['requireCiGreen'] is! bool ||
        mergeJson['requireHeadBoundApproval'] is! bool ||
        !_isNonEmptyString(mergeJson['targetBranch'])) {
      throw ConfigException('merge stage contract is invalid', source: json);
    }
    _rejectUnknownKeys(
        mergeJson,
        const {
          'requireCiGreen',
          'requireHeadBoundApproval',
          'targetBranch',
        },
        r'$.stages.merge');

    return DevboredConfig._(
      schema: 'devbored.config.v1',
      version: version as int,
      labels: DevboredLabels._(
        prefix: labelsJson['prefix'] as String,
        enabled: labelsJson['enabled'] as String,
        claimed: labelsJson['claimed'] as String,
        state: _immutableStringMap(stateLabels),
        priorityClasses: _immutableStringMap(priorityClasses),
      ),
      intake: DevboredIntake._(
        requireEnabledLabel: intakeJson['requireEnabledLabel'] as bool,
        milestones: List<int>.unmodifiable(intakeJson['milestones']! as List),
        authorPolicy: intakeJson['authorPolicy'] as String,
      ),
      stages: DevboredStages._(
        design: _consensusStage(designJson),
        review: _consensusStage(reviewJson),
        implement: ImplementStage._(
          model: implementJson['model'] as String,
          effort: implementJson['effort'] as String,
          localTestCommand: implementJson['localTestCommand'] as String,
        ),
        merge: MergeStage._(
          requireCiGreen: mergeJson['requireCiGreen'] as bool,
          requireHeadBoundApproval:
              mergeJson['requireHeadBoundApproval'] as bool,
          targetBranch: mergeJson['targetBranch'] as String,
        ),
      ),
    );
  }

  final String schema;
  final int version;
  final DevboredLabels labels;
  final DevboredIntake intake;
  final DevboredStages stages;

  Map<String, Object?> toJson() => {
        'schema': schema,
        'version': version,
        'labels': labels.toJson(),
        'intake': intake.toJson(),
        'stages': stages.toJson(),
      };
}

final class DevboredLabels {
  const DevboredLabels._({
    required this.prefix,
    required this.enabled,
    required this.claimed,
    required this.state,
    required this.priorityClasses,
  });

  final String prefix;
  final String enabled;
  final String claimed;
  final Map<String, String> state;
  final Map<String, String> priorityClasses;

  Map<String, Object?> toJson() => {
        'prefix': prefix,
        'enabled': enabled,
        'claimed': claimed,
        'state': state,
        'priorityClasses': priorityClasses,
      };
}

final class DevboredIntake {
  const DevboredIntake._({
    required this.requireEnabledLabel,
    required this.milestones,
    required this.authorPolicy,
  });

  final bool requireEnabledLabel;
  final List<int> milestones;
  final String authorPolicy;

  Map<String, Object?> toJson() => {
        'requireEnabledLabel': requireEnabledLabel,
        'milestones': milestones,
        'authorPolicy': authorPolicy,
      };
}

final class DevboredStages {
  const DevboredStages._({
    required this.design,
    required this.review,
    required this.implement,
    required this.merge,
  });

  final ConsensusStage design;
  final ConsensusStage review;
  final ImplementStage implement;
  final MergeStage merge;

  Map<String, Object?> toJson() => {
        'design': design.toJson(),
        'review': review.toJson(),
        'implement': implement.toJson(),
        'merge': merge.toJson(),
      };
}

final class ConsensusStage {
  const ConsensusStage._({
    required this.seats,
    required this.agreement,
    required this.budgets,
  });

  final List<String> seats;
  final String agreement;
  final StageBudgets budgets;

  Map<String, Object?> toJson() => {
        'seats': seats,
        'agreement': agreement,
        'budgets': budgets.toJson(),
      };
}

final class StageBudgets {
  const StageBudgets._({required this.maxRounds, required this.timeoutSeconds});

  final int maxRounds;
  final int timeoutSeconds;

  Map<String, Object?> toJson() => {
        'maxRounds': maxRounds,
        'timeoutSeconds': timeoutSeconds,
      };
}

final class ImplementStage {
  const ImplementStage._({
    required this.model,
    required this.effort,
    required this.localTestCommand,
  });

  final String model;
  final String effort;
  final String localTestCommand;

  Map<String, Object?> toJson() => {
        'model': model,
        'effort': effort,
        'localTestCommand': localTestCommand,
      };
}

final class MergeStage {
  const MergeStage._({
    required this.requireCiGreen,
    required this.requireHeadBoundApproval,
    required this.targetBranch,
  });

  final bool requireCiGreen;
  final bool requireHeadBoundApproval;
  final String targetBranch;

  Map<String, Object?> toJson() => {
        'requireCiGreen': requireCiGreen,
        'requireHeadBoundApproval': requireHeadBoundApproval,
        'targetBranch': targetBranch,
      };
}

ConsensusStage _consensusStage(Map<String, Object?> json) {
  final budgets = _requiredMap(json['budgets']);
  return ConsensusStage._(
    seats: List<String>.unmodifiable(json['seats']! as List),
    agreement: json['agreement'] as String,
    budgets: StageBudgets._(
      maxRounds: budgets['maxRounds'] as int,
      timeoutSeconds: budgets['timeoutSeconds'] as int,
    ),
  );
}

Map<String, Object?>? _mapOrNull(Object? value) =>
    value is Map ? Map<String, Object?>.from(value) : null;

Map<String, Object?> _requiredMap(Object? value) =>
    Map<String, Object?>.from(value! as Map);

bool _isPositiveInteger(Object? value) => value is int && value >= 1;

bool _isNonEmptyString(Object? value) => value is String && value.isNotEmpty;

bool _isStringMap(Object? value) {
  final map = _mapOrNull(value);
  return map != null &&
      map.isNotEmpty &&
      map.entries.every(
        (entry) => entry.key.isNotEmpty && _isNonEmptyString(entry.value),
      );
}

bool _isPositiveIntegerArray(Object? value) =>
    value is List && value.every(_isPositiveInteger);

bool _isSeatArray(Object? value) {
  if (value is! List || value.isEmpty || value.length > 4) return false;
  final seats = <String>{};
  for (final item in value) {
    if (item is! String ||
        !RegExp(r'^[A-Za-z0-9._-]+$').hasMatch(item) ||
        !seats.add(item)) {
      return false;
    }
  }
  return true;
}

bool _isAgreement(Object? value) => value == 'unanimous' || value == 'majority';

bool _isBudgets(Object? value) {
  final budgets = _mapOrNull(value);
  return budgets != null &&
      _isPositiveInteger(budgets['maxRounds']) &&
      _isPositiveInteger(budgets['timeoutSeconds']);
}

void _rejectUnknownKeys(
  Map<String, Object?> json,
  Set<String> allowed,
  String path,
) {
  for (final key in json.keys) {
    if (!allowed.contains(key)) {
      throw ConfigException('unknown field $path.$key', source: json);
    }
  }
}

void _rejectUnknownLeafValues(Map<String, Object?> json, String path) {
  for (final entry in json.entries) {
    if (entry.value is! String) {
      throw ConfigException(
        'invalid string map value $path.${entry.key}',
        source: json,
      );
    }
  }
}

Map<String, String> _immutableStringMap(Map<String, Object?> json) =>
    Map<String, String>.unmodifiable(
      json.map((key, value) => MapEntry(key, value! as String)),
    );
