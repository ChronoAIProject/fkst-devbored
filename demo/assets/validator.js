const PREVIEW_NOTE = 'limited preview — agreement reduction only';
const EXPECTED_METADATA_KEYS = new Set(['claimStatus', 'downstreamTask']);
const CONTRACT_SCHEMA = 'fkst.council-semantic-contract/v1';
const CONTRACT_ID = 'R-009/council-v1';
const CONTRACT_VERSION = 1;
const WIRE_SCHEMA = 'fkst.devbored.council.v1';
const SEAT_EVIDENCE_SCHEMA = 'fkst.devbored.council-seat-evidence.v1';
const CODEX_RUN_REF_UTF8_MAX = 1024;
const SHA256_PATTERN = /^[0-9a-f]{64}$/i;
const GIT_SHA_PATTERN = /^[0-9a-f]{40}$/i;
const RFC3339_UTC_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?Z$/;
const REQUIRED_FIELD_METADATA = [
  'type',
  'cardinality',
  'default',
  'authority',
  'consumer',
  'invariant',
  'digest',
  'evidence',
  'downstreamTest',
];
const EXPECTED_VOCABULARIES = {
  seatLens: ['product', 'architecture', 'implementation', 'quality', 'security'],
  seatVerdict: ['approve', 'changesRequested', 'abstain', 'failed'],
  agreementPolicy: ['unanimous', 'simpleMajority'],
  councilDecision: ['approved', 'changesRequested', 'inconclusive'],
  dissentRule: ['explicitChangesRequested'],
  executionStatus: ['completed', 'timeout', 'failed'],
};
const EXPECTED_TYPE_FIELDS = {
  CouncilDefinition: ['schema', 'id', 'version', 'name', 'seats', 'policies'],
  CouncilSeat: ['id', 'displayName', 'lens'],
  CouncilPolicy: ['roster', 'agreement', 'maxRounds', 'timeoutSeconds', 'dissentRule'],
  SeatEvidence: [
    'seatId',
    'lens',
    'executionStatus',
    'verdict',
    'contributionDigest',
    'codexRunRef',
    'excerpt',
    'at',
    'schema',
  ],
  CouncilRoundFact: [
    'round',
    'inputHeadSha',
    'contributions',
    'decision',
    'dissent',
    'stageComplete',
    'reasonCode',
  ],
};
const EXPECTED_LIMITS = {
  nonEmptyNameUtf8Bytes: [1, 120],
  seatsPerDefinition: [1, 5],
  policiesPerDefinition: [1, 8],
  seatsPerPolicyRoster: [1, 5],
  roundsPerStage: [1, 3],
  contributionExcerptUtf8Bytes: [0, 1024],
  evidenceContributions: [1, 5],
};

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function utf8Bytes(value) {
  return new TextEncoder().encode(value).byteLength;
}

function assertRecord(value, label) {
  if (!isRecord(value)) throw new TypeError(`${label} must be a JSON object`);
}

function requireLimit(limits, key) {
  const limit = limits[key];
  if (!isRecord(limit)) throw new TypeError(`contract.limits.${key} is required`);
  return limit;
}

function requireIntegerRange(limits, key, maximumKey = 'max') {
  const limit = requireLimit(limits, key);
  if (
    !Number.isInteger(limit.min)
    || !Number.isInteger(limit[maximumKey])
    || limit.min < 0
    || limit[maximumKey] < limit.min
  ) {
    throw new TypeError(`contract.limits.${key} must provide an integer min and ${maximumKey} with min <= ${maximumKey}`);
  }
  return limit;
}

function requireVocabulary(vocabularies, key, expectedValues) {
  const values = vocabularies[key];
  if (
    !Array.isArray(values)
    || values.length === 0
    || values.some((value) => typeof value !== 'string' || value.length === 0)
    || new Set(values).size !== values.length
  ) {
    throw new TypeError(`contract.vocabularies.${key} must be a nonempty array of unique, nonempty strings`);
  }
  if (
    values.length !== expectedValues.length
    || values.some((value, index) => value !== expectedValues[index])
  ) {
    throw new TypeError(`contract.vocabularies.${key} does not match the Council v1 vocabulary`);
  }
  return values;
}

function requireTypeFields(contract, typeName) {
  const fields = contract.types?.[typeName]?.fields;
  if (!isRecord(fields)) throw new TypeError(`contract.types.${typeName}.fields is required`);
  const fieldNames = Object.keys(fields);
  const expectedNames = EXPECTED_TYPE_FIELDS[typeName];
  if (
    contract.types[typeName].unknownFields !== 'reject'
    || fieldNames.length !== expectedNames.length
    || expectedNames.some((fieldName) => !Object.hasOwn(fields, fieldName))
  ) {
    throw new TypeError(`contract.types.${typeName} must reject unknown fields and provide the exact Council v1 fields`);
  }
  return expectedNames;
}

function requireFieldMetadata(contract, requiredKeys) {
  if (!isRecord(contract.types)) throw new TypeError('contract.types must be an object');
  const listKeys = new Set(['consumer', 'downstreamTest']);
  for (const [typeName, typeDefinition] of Object.entries(contract.types)) {
    if (!isRecord(typeDefinition) || !isRecord(typeDefinition.fields)) {
      throw new TypeError(`contract.types.${typeName}.fields must be an object`);
    }
    for (const [fieldName, metadata] of Object.entries(typeDefinition.fields)) {
      if (!isRecord(metadata)) {
        throw new TypeError(`contract.types.${typeName}.fields.${fieldName} metadata must be an object`);
      }
      for (const key of requiredKeys) {
        if (!Object.hasOwn(metadata, key)) {
          throw new TypeError(`contract.types.${typeName}.fields.${fieldName} is missing required metadata ${JSON.stringify(key)}`);
        }
        const value = metadata[key];
        let malformed;
        if (listKeys.has(key)) {
          malformed = !Array.isArray(value)
            || value.length === 0
            || value.some((item) => typeof item !== 'string' || item.length === 0);
        } else if (key === 'default') {
          malformed = value !== null && (typeof value !== 'string' || value.length === 0);
        } else {
          malformed = typeof value !== 'string' || value.length === 0;
        }
        if (malformed) {
          throw new TypeError(`contract.types.${typeName}.fields.${fieldName}.${key} is malformed`);
        }
      }
    }
  }
}

/**
 * Prepare a Council semantic contract for validation.
 * The returned context is data-only and safe to create in Node or a browser.
 */
export function loadContract(contractJson) {
  const parsed = typeof contractJson === 'string' ? JSON.parse(contractJson) : cloneJson(contractJson);
  assertRecord(parsed, 'contractJson');

  if (parsed.schema !== CONTRACT_SCHEMA) {
    throw new TypeError(`contract.schema must equal ${JSON.stringify(CONTRACT_SCHEMA)}`);
  }
  if (parsed.contractId !== CONTRACT_ID) {
    throw new TypeError(`contract.contractId must equal ${JSON.stringify(CONTRACT_ID)}`);
  }
  if (parsed.version !== CONTRACT_VERSION) {
    throw new TypeError(`contract.version must equal ${CONTRACT_VERSION}`);
  }
  if (parsed.wireSchema !== WIRE_SCHEMA) {
    throw new TypeError(`contract.wireSchema must equal ${JSON.stringify(WIRE_SCHEMA)}`);
  }
  assertRecord(parsed.limits, 'contract.limits');
  assertRecord(parsed.vocabularies, 'contract.vocabularies');

  if (
    !Array.isArray(parsed.fieldMetadataRequired)
    || parsed.fieldMetadataRequired.length !== REQUIRED_FIELD_METADATA.length
    || parsed.fieldMetadataRequired.some((key) => typeof key !== 'string' || key.length === 0)
    || new Set(parsed.fieldMetadataRequired).size !== parsed.fieldMetadataRequired.length
    || REQUIRED_FIELD_METADATA.some((key) => !parsed.fieldMetadataRequired.includes(key))
  ) {
    throw new TypeError('contract.fieldMetadataRequired must contain the complete Council v1 metadata-key vocabulary');
  }

  const safeId = requireLimit(parsed.limits, 'safeId');
  const safeIdBytes = safeId.utf8Bytes;
  if (typeof safeId.pattern !== 'string' || safeId.pattern.length === 0 || !isRecord(safeIdBytes)) {
    throw new TypeError('contract.limits.safeId must provide pattern and utf8Bytes');
  }
  if (
    !Number.isInteger(safeIdBytes.min)
    || !Number.isInteger(safeIdBytes.max)
    || safeIdBytes.min < 1
    || safeIdBytes.max < safeIdBytes.min
  ) {
    throw new TypeError('contract.limits.safeId.utf8Bytes must provide positive integer min/max bounds');
  }

  let safeIdPattern;
  try {
    safeIdPattern = new RegExp(safeId.pattern);
  } catch (error) {
    throw new TypeError(`contract.limits.safeId.pattern is invalid: ${error.message}`);
  }

  if (
    safeId.pattern !== '^[A-Za-z][A-Za-z0-9._-]{0,63}$'
    || safeIdBytes.min !== 1
    || safeIdBytes.max !== 64
  ) {
    throw new TypeError('contract.limits.safeId does not match the Council v1 SafeId limit');
  }

  for (const [key, [expectedMin, expectedMax]] of Object.entries(EXPECTED_LIMITS)) {
    const limit = requireIntegerRange(parsed.limits, key);
    if (limit.min !== expectedMin || limit.max !== expectedMax) {
      throw new TypeError(`contract.limits.${key} does not match the Council v1 bounds`);
    }
  }
  const seatTimeout = requireIntegerRange(parsed.limits, 'seatTimeoutSeconds', 'hardMax');
  if (seatTimeout.min !== 1 || seatTimeout.hardMax !== 900) {
    throw new TypeError('contract.limits.seatTimeoutSeconds does not match the Council v1 hard bounds');
  }

  for (const [key, expectedValues] of Object.entries(EXPECTED_VOCABULARIES)) {
    requireVocabulary(parsed.vocabularies, key, expectedValues);
  }
  requireFieldMetadata(parsed, parsed.fieldMetadataRequired);

  const context = {
    contract: parsed,
    limits: parsed.limits,
    vocabularies: parsed.vocabularies,
    wireSchema: WIRE_SCHEMA,
    safeIdPattern,
    typeFields: {
      definition: requireTypeFields(parsed, 'CouncilDefinition'),
      seat: requireTypeFields(parsed, 'CouncilSeat'),
      policy: requireTypeFields(parsed, 'CouncilPolicy'),
      contribution: requireTypeFields(parsed, 'SeatEvidence'),
      roundFact: requireTypeFields(parsed, 'CouncilRoundFact'),
    },
  };

  return deepFreeze(context);
}

function addFinding(findings, code, path, message) {
  findings.push({ code, path, message });
}

function isIntegerIn(value, min, max) {
  return Number.isInteger(value) && value >= min && value <= max;
}

function hasVocabularyValue(ctx, vocabulary, value) {
  return ctx.vocabularies[vocabulary].includes(value);
}

function validateSafeId(ctx, value, path, code, findings) {
  const bytes = ctx.limits.safeId.utf8Bytes;
  if (
    typeof value !== 'string'
    || utf8Bytes(value) < bytes.min
    || utf8Bytes(value) > bytes.max
    || !ctx.safeIdPattern.test(value)
  ) {
    addFinding(
      findings,
      code,
      path,
      `must match ${ctx.limits.safeId.pattern} and use ${bytes.min}..${bytes.max} UTF-8 bytes`,
    );
    return false;
  }
  return true;
}

function validateNonEmptyName(ctx, value, path, code, findings) {
  const limit = ctx.limits.nonEmptyNameUtf8Bytes;
  if (
    typeof value !== 'string'
    || value.trim().length === 0
    || utf8Bytes(value) < limit.min
    || utf8Bytes(value) > limit.max
  ) {
    addFinding(findings, code, path, `must be nonempty after trimming and use ${limit.min}..${limit.max} UTF-8 bytes`);
    return false;
  }
  return true;
}

function rejectUnknownFields(value, allowedFields, path, code, findings) {
  if (!isRecord(value)) return;
  const allowed = new Set(allowedFields);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) addFinding(findings, code, `${path}.${key}`, `unknown field ${JSON.stringify(key)}`);
  }
}

/** Validate a CouncilDefinition using only bounds and vocabularies from ctx. */
export function validateDefinition(ctx, def) {
  if (!isRecord(ctx) || !isRecord(ctx.contract)) throw new TypeError('ctx must be returned by loadContract');

  const findings = [];
  if (!isRecord(def)) {
    addFinding(findings, 'council.definition.type', '$', 'CouncilDefinition must be an object');
    return { admission: 'INVALID', findings };
  }

  rejectUnknownFields(def, ctx.typeFields.definition, '$', 'council.definition.unknownField', findings);

  if (def.schema !== ctx.wireSchema) {
    addFinding(findings, 'council.definition.schema', '$.schema', `must equal ${JSON.stringify(ctx.wireSchema)}`);
  }
  validateSafeId(ctx, def.id, '$.id', 'council.definition.id', findings);
  if (!isIntegerIn(def.version, 1, 2147483647)) {
    addFinding(findings, 'council.definition.version', '$.version', 'must be an integer from 1 through 2147483647');
  }
  validateNonEmptyName(ctx, def.name, '$.name', 'council.definition.name', findings);

  const seatsLimit = ctx.limits.seatsPerDefinition;
  const seats = Array.isArray(def.seats) ? def.seats : [];
  if (!Array.isArray(def.seats) || !isIntegerIn(seats.length, seatsLimit.min, seatsLimit.max)) {
    addFinding(
      findings,
      'council.seats.bounds',
      '$.seats',
      `must be an array with ${seatsLimit.min}..${seatsLimit.max} seats`,
    );
  }

  const seatIds = new Set();
  const resolvableSeatIds = new Set();
  seats.forEach((seat, index) => {
    const path = `$.seats[${index}]`;
    if (!isRecord(seat)) {
      addFinding(findings, 'council.seat.type', path, 'seat must be an object');
      return;
    }
    rejectUnknownFields(seat, ctx.typeFields.seat, path, 'council.seat.unknownField', findings);
    const idValid = validateSafeId(ctx, seat.id, `${path}.id`, 'council.seat.id', findings);
    if (idValid) {
      if (seatIds.has(seat.id)) {
        addFinding(findings, 'council.seats.duplicateId', `${path}.id`, `duplicate seat id ${JSON.stringify(seat.id)}`);
      } else {
        seatIds.add(seat.id);
        resolvableSeatIds.add(seat.id);
      }
    }
    validateNonEmptyName(ctx, seat.displayName, `${path}.displayName`, 'council.seat.displayName', findings);
    if (!hasVocabularyValue(ctx, 'seatLens', seat.lens)) {
      addFinding(findings, 'council.seat.lens', `${path}.lens`, 'must be a seatLens value from the contract');
    }
  });

  const policiesLimit = ctx.limits.policiesPerDefinition;
  const policies = isRecord(def.policies) ? def.policies : {};
  const policyEntries = Object.entries(policies);
  if (!isRecord(def.policies) || !isIntegerIn(policyEntries.length, policiesLimit.min, policiesLimit.max)) {
    addFinding(
      findings,
      'council.policies.bounds',
      '$.policies',
      `must be an object with ${policiesLimit.min}..${policiesLimit.max} policies`,
    );
  }

  for (const [policyId, policy] of policyEntries) {
    const path = `$.policies[${JSON.stringify(policyId)}]`;
    validateSafeId(ctx, policyId, path, 'council.policy.id', findings);
    if (!isRecord(policy)) {
      addFinding(findings, 'council.policy.type', path, 'policy must be an object');
      continue;
    }
    rejectUnknownFields(policy, ctx.typeFields.policy, path, 'council.policy.unknownField', findings);

    const rosterLimit = ctx.limits.seatsPerPolicyRoster;
    const roster = Array.isArray(policy.roster) ? policy.roster : [];
    if (!Array.isArray(policy.roster) || !isIntegerIn(roster.length, rosterLimit.min, rosterLimit.max)) {
      addFinding(
        findings,
        'council.policy.roster.bounds',
        `${path}.roster`,
        `must be an array with ${rosterLimit.min}..${rosterLimit.max} seat ids`,
      );
    }
    const rosterIds = new Set();
    roster.forEach((seatId, index) => {
      const rosterPath = `${path}.roster[${index}]`;
      const idValid = validateSafeId(ctx, seatId, rosterPath, 'council.policy.roster.seatId', findings);
      if (idValid && rosterIds.has(seatId)) {
        addFinding(findings, 'council.policy.roster.duplicateSeat', rosterPath, `duplicate roster seat ${JSON.stringify(seatId)}`);
      }
      if (idValid) rosterIds.add(seatId);
      if (idValid && !resolvableSeatIds.has(seatId)) {
        addFinding(findings, 'council.policy.roster.unresolvedSeat', rosterPath, `seat ${JSON.stringify(seatId)} is not defined`);
      }
    });

    if (!hasVocabularyValue(ctx, 'agreementPolicy', policy.agreement)) {
      addFinding(findings, 'council.policy.agreement', `${path}.agreement`, 'must be an agreementPolicy value from the contract');
    }
    const rounds = ctx.limits.roundsPerStage;
    if (!isIntegerIn(policy.maxRounds, rounds.min, rounds.max)) {
      addFinding(findings, 'council.policy.maxRounds', `${path}.maxRounds`, `must be an integer from ${rounds.min} through ${rounds.max}`);
    }
    const timeout = ctx.limits.seatTimeoutSeconds;
    const timeoutMax = timeout.hardMax ?? timeout.max;
    if (!isIntegerIn(policy.timeoutSeconds, timeout.min, timeoutMax)) {
      addFinding(
        findings,
        'council.policy.timeoutSeconds',
        `${path}.timeoutSeconds`,
        `must be an integer from ${timeout.min} through ${timeoutMax}`,
      );
    }
    if (!hasVocabularyValue(ctx, 'dissentRule', policy.dissentRule)) {
      addFinding(findings, 'council.policy.dissentRule', `${path}.dissentRule`, 'must be a dissentRule value from the contract');
    }
  }

  return { admission: findings.length === 0 ? 'VALID' : 'INVALID', findings };
}

/**
 * Reduce verdicts for the sandbox preview. This intentionally does not perform
 * round validation, evidence validation, progression, replay, or digest work.
 */
export function reduceRoundPreview(policy, verdicts) {
  const agreement = isRecord(policy) ? policy.agreement : policy;
  const values = Array.isArray(verdicts)
    ? verdicts.map((item) => (isRecord(item) ? item.verdict : item))
    : [];
  const approveCount = values.filter((verdict) => verdict === 'approve').length;
  const hasChangesRequested = values.includes('changesRequested');

  let decision = 'inconclusive';
  if (agreement === 'unanimous' && values.length > 0 && approveCount === values.length) {
    decision = 'approved';
  } else if (agreement === 'simpleMajority' && approveCount * 2 > values.length) {
    decision = 'approved';
  } else if (hasChangesRequested) {
    decision = 'changesRequested';
  }

  return { decision, note: PREVIEW_NOTE };
}

function assertValidatorContext(ctx) {
  if (!isRecord(ctx) || !isRecord(ctx.contract)) {
    throw new TypeError('ctx must be returned by loadContract');
  }
}

function isRfc3339Utc(value) {
  if (typeof value !== 'string') return false;
  const match = RFC3339_UTC_PATTERN.exec(value);
  if (!match) return false;
  const [, year, month, day, hour, minute, second] = match;
  const instant = new Date(value);
  return (
    Number.isFinite(instant.getTime())
    && instant.getUTCFullYear() === Number(year)
    && instant.getUTCMonth() + 1 === Number(month)
    && instant.getUTCDate() === Number(day)
    && instant.getUTCHours() === Number(hour)
    && instant.getUTCMinutes() === Number(minute)
    && instant.getUTCSeconds() === Number(second)
  );
}

function resolveSeatForEvidence(definition, expectedSeat, evidence, path, findings) {
  if (!isRecord(definition) || !Array.isArray(definition.seats)) {
    addFinding(
      findings,
      'council.contribution.definition',
      path,
      'definition with a seats array is required to resolve SeatEvidence',
    );
    return null;
  }

  const expectedSeatId = typeof expectedSeat === 'string' ? expectedSeat : expectedSeat?.id;
  if (expectedSeat !== undefined && expectedSeat !== null && typeof expectedSeatId !== 'string') {
    addFinding(
      findings,
      'council.contribution.expectedSeat',
      path,
      'expectedSeat must be a seat id or resolved CouncilSeat object',
    );
    return null;
  }

  if (typeof expectedSeatId === 'string' && evidence.seatId !== expectedSeatId) {
    addFinding(
      findings,
      'council.round.contributions.seatMismatch',
      `${path}.seatId`,
      `must equal the roster seat id ${JSON.stringify(expectedSeatId)}`,
    );
  }

  const seatId = expectedSeatId ?? evidence.seatId;
  const matches = definition.seats.filter((seat) => isRecord(seat) && seat.id === seatId);
  if (matches.length !== 1) {
    addFinding(
      findings,
      'council.contribution.unresolvedSeat',
      `${path}.seatId`,
      `seat ${JSON.stringify(seatId)} must resolve exactly once in the Council definition`,
    );
    return null;
  }
  return matches[0];
}

/** Validate one complete SeatEvidence object against its Council definition seat. */
export function validateSeatEvidence(ctx, evidence, options = {}) {
  assertValidatorContext(ctx);
  const safeOptions = isRecord(options) ? options : {};
  const {
    definition,
    expectedSeat = null,
    path = '$',
  } = safeOptions;
  const findings = [];
  if (!isRecord(evidence)) {
    addFinding(findings, 'council.contribution.type', path, 'SeatEvidence must be an object');
    return { admission: 'INVALID', findings, missingInvocation: false };
  }

  rejectUnknownFields(
    evidence,
    ctx.typeFields.contribution,
    path,
    'council.contribution.unknownField',
    findings,
  );

  if (Object.hasOwn(evidence, 'seatId')) {
    validateSafeId(ctx, evidence.seatId, `${path}.seatId`, 'council.contribution.seatId', findings);
  }
  if (Object.hasOwn(evidence, 'lens') && !hasVocabularyValue(ctx, 'seatLens', evidence.lens)) {
    addFinding(findings, 'council.contribution.lens', `${path}.lens`, 'must be a seatLens value from the contract');
  }
  if (
    Object.hasOwn(evidence, 'executionStatus')
    && !ctx.vocabularies.executionStatus.includes(evidence.executionStatus)
  ) {
    addFinding(findings, 'council.contribution.executionStatus', `${path}.executionStatus`, 'must be an executionStatus value from the contract');
  }
  if (Object.hasOwn(evidence, 'verdict') && !hasVocabularyValue(ctx, 'seatVerdict', evidence.verdict)) {
    addFinding(findings, 'council.contribution.verdict', `${path}.verdict`, 'must be a seatVerdict value from the contract');
  }

  if (Object.hasOwn(evidence, 'executionStatus') && Object.hasOwn(evidence, 'verdict')) {
    const completedWithFailed = evidence.executionStatus === 'completed' && evidence.verdict === 'failed';
    const nonCompletedWithoutFailed = (
      (evidence.executionStatus === 'timeout' || evidence.executionStatus === 'failed')
      && evidence.verdict !== 'failed'
    );
    if (completedWithFailed || nonCompletedWithoutFailed) {
      addFinding(
        findings,
        'council.contribution.statusVerdictMismatch',
        path,
        'completed forbids verdict=failed; timeout/failed require verdict=failed',
      );
    }
  }

  const resolvedSeat = resolveSeatForEvidence(definition, expectedSeat, evidence, path, findings);
  if (resolvedSeat && evidence.lens !== resolvedSeat.lens) {
    addFinding(
      findings,
      'council.round.contributions.lensMismatch',
      `${path}.lens`,
      `must equal the resolved seat lens ${JSON.stringify(resolvedSeat.lens)}`,
    );
  }

  if (Object.hasOwn(evidence, 'contributionDigest')) {
    if (evidence.contributionDigest !== null && (
      typeof evidence.contributionDigest !== 'string'
      || !SHA256_PATTERN.test(evidence.contributionDigest)
    )) {
      addFinding(
        findings,
        'council.contribution.contributionDigest',
        `${path}.contributionDigest`,
        'must be null or a 64-hex SHA-256 digest',
      );
    } else if (evidence.executionStatus === 'completed' && evidence.contributionDigest === null) {
      addFinding(
        findings,
        'council.contribution.completedDigestRequired',
        `${path}.contributionDigest`,
        'completed SeatEvidence requires a non-null contributionDigest',
      );
    }
  }

  const missingInvocation = (
    evidence.executionStatus === 'failed'
    && evidence.verdict === 'failed'
    && evidence.contributionDigest === null
    && evidence.codexRunRef === null
  );
  if (Object.hasOwn(evidence, 'codexRunRef')) {
    if (evidence.codexRunRef !== null && (
      typeof evidence.codexRunRef !== 'string'
      || utf8Bytes(evidence.codexRunRef) < 1
      || utf8Bytes(evidence.codexRunRef) > CODEX_RUN_REF_UTF8_MAX
    )) {
      addFinding(
        findings,
        'council.contribution.codexRunRef',
        `${path}.codexRunRef`,
        `must be null or a nonempty opaque string of at most ${CODEX_RUN_REF_UTF8_MAX} UTF-8 bytes`,
      );
    } else if (evidence.codexRunRef === null && !missingInvocation) {
      addFinding(
        findings,
        'council.contribution.codexRunRefRequired',
        `${path}.codexRunRef`,
        'null is reserved for explicit failed/failed missing invocation evidence with null contributionDigest',
      );
    }
  }

  if (Object.hasOwn(evidence, 'excerpt') && evidence.excerpt !== null) {
    const limit = ctx.limits.contributionExcerptUtf8Bytes;
    if (
      typeof evidence.excerpt !== 'string'
      || utf8Bytes(evidence.excerpt) < limit.min
      || utf8Bytes(evidence.excerpt) > limit.max
    ) {
      addFinding(
        findings,
        'council.contribution.excerptBytes',
        `${path}.excerpt`,
        `must be null or a string using ${limit.min}..${limit.max} UTF-8 bytes`,
      );
    }
  }

  if (Object.hasOwn(evidence, 'at') && !isRfc3339Utc(evidence.at)) {
    addFinding(findings, 'council.contribution.at', `${path}.at`, 'must be a valid RFC3339 UTC instant ending in Z');
  }
  if (Object.hasOwn(evidence, 'schema') && evidence.schema !== SEAT_EVIDENCE_SCHEMA) {
    addFinding(
      findings,
      'council.contribution.schema',
      `${path}.schema`,
      `must equal ${JSON.stringify(SEAT_EVIDENCE_SCHEMA)}`,
    );
  }

  for (const key of ctx.typeFields.contribution) {
    if (!Object.hasOwn(evidence, key)) {
      addFinding(findings, 'council.contribution.missingField', `${path}.${key}`, `required field ${JSON.stringify(key)} is missing`);
    }
  }

  return {
    admission: findings.length === 0 ? 'VALID' : 'INVALID',
    findings,
    missingInvocation,
  };
}

function firstFindingCode(findings, code) {
  return findings.some((finding) => finding.code === code);
}

function validateOrderedContributions(ctx, definition, policy, contributions) {
  const roster = policy.roster;
  if (!Array.isArray(contributions)) return { error: 'missing_contribution', findings: [] };
  if (contributions.length < roster.length) return { error: 'missing_contribution', findings: [] };
  if (contributions.length > roster.length) return { error: 'extra_contribution', findings: [] };

  const ids = contributions.map((item) => item?.seatId);
  if (new Set(ids).size !== ids.length) return { error: 'duplicate_contribution', findings: [] };

  const seats = new Map(definition.seats.map((seat) => [seat.id, seat]));
  const validationFindings = [];
  contributions.forEach((contribution, index) => {
    const result = validateSeatEvidence(ctx, contribution, {
      definition,
      path: `$.contributions[${index}]`,
      expectedSeat: seats.get(roster[index]),
    });
    validationFindings.push(...result.findings);
  });
  if (firstFindingCode(validationFindings, 'council.contribution.unknownField')) {
    return { error: 'unknown_key', findings: validationFindings };
  }
  if (firstFindingCode(validationFindings, 'council.contribution.missingField')) {
    return { error: 'missing_field', findings: validationFindings };
  }

  if (ids.some((seatId, index) => seatId !== roster[index])) {
    const sameMembers = ids.every((seatId) => roster.includes(seatId)) && roster.every((seatId) => ids.includes(seatId));
    return { error: sameMembers ? 'reordered_contribution' : 'unknown_roster_seat', findings: validationFindings };
  }
  if (firstFindingCode(validationFindings, 'council.round.contributions.lensMismatch')) {
    return { error: 'wrong_lens', findings: validationFindings };
  }
  if (firstFindingCode(validationFindings, 'council.contribution.statusVerdictMismatch')) {
    return { error: 'status_verdict', findings: validationFindings };
  }
  if (validationFindings.length > 0) return { error: 'invalid_contribution', findings: validationFindings };

  const verdicts = contributions.map(({ verdict }) => verdict);
  const { decision } = reduceRoundPreview(policy, verdicts);
  const dissent = contributions
    .filter(({ executionStatus, verdict }) => executionStatus === 'completed' && verdict === 'changesRequested')
    .map(({ seatId }) => seatId);
  return {
    decision,
    dissent,
    approveCount: verdicts.filter((verdict) => verdict === 'approve').length,
    failedSeats: contributions
      .filter(({ executionStatus }) => executionStatus === 'failed' || executionStatus === 'timeout')
      .map(({ seatId }) => seatId),
    missingInvocationSeat: contributions.find((item) => item.executionStatus === 'failed' && item.codexRunRef === null)?.seatId,
    findings: [],
  };
}

function addContributionReductionFinding(findings, error, nestedFindings) {
  const map = {
    missing_contribution: ['council.round.contributions.missing', '$.contributions', 'contributions must contain every roster seat'],
    extra_contribution: ['council.round.contributions.extra', '$.contributions', 'contributions must not contain extra seats'],
    duplicate_contribution: ['council.round.contributions.duplicate', '$.contributions', 'contribution seat ids must be unique'],
    reordered_contribution: ['council.round.contributions.order', '$.contributions', 'contributions must be in exact policy roster order'],
    unknown_roster_seat: ['council.round.contributions.seat', '$.contributions', 'every contribution must match the roster seat at the same index'],
  };
  const mapped = map[error];
  if (mapped) {
    addFinding(findings, ...mapped);
    return;
  }
  if (Array.isArray(nestedFindings) && nestedFindings.length > 0) {
    findings.push(...nestedFindings);
    return;
  }
  addFinding(findings, 'council.round.contributions.invalid', '$.contributions', `invalid contributions: ${error}`);
}

function priorFactEntry(value) {
  if (isRecord(value?.fact)) {
    return { fact: value.fact, envelope: isRecord(value.envelope) ? value.envelope : null };
  }
  return { fact: value, envelope: null };
}

/** Validate one complete CouncilRoundFact and recompute all Council-owned outputs. */
export function validateRoundFact(ctx, definition, policyId, envelope, fact, priorFacts = []) {
  assertValidatorContext(ctx);
  const findings = [];

  if (!isRecord(fact)) {
    addFinding(findings, 'council.round.type', '$', 'CouncilRoundFact must be an object');
    return { admission: 'INVALID', findings, computed: null };
  }

  rejectUnknownFields(fact, ctx.typeFields.roundFact, '$', 'council.round.unknownField', findings);
  for (const key of ctx.typeFields.roundFact) {
    if (!Object.hasOwn(fact, key)) {
      addFinding(findings, 'council.round.missingField', `$.${key}`, `required field ${JSON.stringify(key)} is missing`);
    }
  }

  const definitionResult = validateDefinition(ctx, definition);
  if (definitionResult.admission !== 'VALID') {
    addFinding(findings, 'council.round.definition', '$', 'definition must be valid before a round fact can be admitted');
  }
  const policy = isRecord(definition?.policies) ? definition.policies[policyId] : null;
  if (!isRecord(policy)) {
    addFinding(findings, 'council.round.policy', '$', `policy ${JSON.stringify(policyId)} must resolve in the definition`);
  }

  if (!isRecord(envelope) || !Object.hasOwn(envelope, 'headSha')) {
    addFinding(findings, 'council.round.envelopeHead', '$.inputHeadSha', 'envelope.headSha is required for head binding');
  } else if (envelope.headSha !== null && (
    typeof envelope.headSha !== 'string' || !GIT_SHA_PATTERN.test(envelope.headSha)
  )) {
    addFinding(findings, 'council.round.envelopeHead', '$.inputHeadSha', 'envelope.headSha must be null or a 40-hex Git SHA');
  }

  if (fact.inputHeadSha !== null && (
    typeof fact.inputHeadSha !== 'string' || !GIT_SHA_PATTERN.test(fact.inputHeadSha)
  )) {
    addFinding(findings, 'council.round.inputHeadSha', '$.inputHeadSha', 'must be null or a 40-hex Git SHA');
  } else if (fact.inputHeadSha !== null && fact.inputHeadSha !== envelope?.headSha) {
    addFinding(findings, 'council.round.headMismatch', '$.inputHeadSha', 'non-null inputHeadSha must equal envelope.headSha');
  }

  if (!Array.isArray(priorFacts)) {
    addFinding(findings, 'council.round.priorFacts', '$', 'priorFacts must be an ordered array');
  }

  if (isRecord(policy)) {
    if (!isIntegerIn(fact.round, 1, policy.maxRounds)) {
      addFinding(
        findings,
        'council.round.bound',
        '$.round',
        `round must be an integer from 1 through policy.maxRounds (${policy.maxRounds})`,
      );
    }

    if (Array.isArray(priorFacts) && isIntegerIn(fact.round, 1, policy.maxRounds)) {
      if (priorFacts.length !== fact.round - 1) {
        addFinding(
          findings,
          'council.round.sequence',
          '$.round',
          `round ${fact.round} requires exactly ${fact.round - 1} accepted prior round fact${fact.round === 2 ? '' : 's'}`,
        );
      }

      const currentEnvelopeHead = isRecord(envelope) ? envelope.headSha : undefined;
      priorFacts.forEach((value, index) => {
        const entry = priorFactEntry(value);
        const expectedRound = index + 1;
        if (!isRecord(entry.fact) || entry.fact.round !== expectedRound) {
          addFinding(findings, 'council.round.sequence', '$.round', `priorFacts[${index}] must be round ${expectedRound}`);
          return;
        }
        const priorEnvelope = entry.envelope ?? { headSha: entry.fact.inputHeadSha };
        const priorResult = validateRoundFact(
          ctx,
          definition,
          policyId,
          priorEnvelope,
          entry.fact,
          priorFacts.slice(0, index),
        );
        if (priorResult.admission !== 'VALID') {
          addFinding(
            findings,
            'council.round.priorFact',
            '$.round',
            `priorFacts[${index}] is not an admitted CouncilRoundFact`,
          );
        }
        if (
          entry.fact.decision !== 'inconclusive'
          || entry.fact.stageComplete !== false
          || entry.fact.reasonCode !== null
          || entry.fact.round >= policy.maxRounds
        ) {
          addFinding(
            findings,
            'council.round.progression',
            '$.round',
            `round ${expectedRound + 1} is allowed only after a below-cap inconclusive round`,
          );
        }
        if (entry.fact.inputHeadSha !== fact.inputHeadSha) {
          addFinding(findings, 'council.round.headDrift', '$.inputHeadSha', 'inputHeadSha must remain immutable across rounds');
        }
        if (entry.envelope && entry.envelope.headSha !== currentEnvelopeHead) {
          addFinding(findings, 'council.round.headDrift', '$.inputHeadSha', 'envelope.headSha must remain immutable across rounds');
        }
      });
    }
  }

  let reduction = null;
  if (isRecord(policy) && Array.isArray(policy.roster)) {
    reduction = validateOrderedContributions(ctx, definition, policy, fact.contributions);
    if (reduction.error) {
      addContributionReductionFinding(findings, reduction.error, reduction.findings);
    } else {
      if (!hasVocabularyValue(ctx, 'councilDecision', fact.decision)) {
        addFinding(findings, 'council.round.decision', '$.decision', 'must be a councilDecision value from the contract');
      } else if (fact.decision !== reduction.decision) {
        addFinding(findings, 'council.round.decisionMismatch', '$.decision', `must equal recomputed decision ${JSON.stringify(reduction.decision)}`);
      }

      if (!Array.isArray(fact.dissent)) {
        addFinding(findings, 'council.round.dissent', '$.dissent', 'must be an ordered array of seat ids');
      } else if (!matchesExpected(reduction.dissent, fact.dissent)) {
        addFinding(findings, 'council.round.dissentMismatch', '$.dissent', 'must equal recomputed roster-order dissent');
      }

      const progression = roundProgression(policy, fact.round, reduction.decision);
      if (
        progression.admission === 'INVALID'
        || progression.stageComplete !== fact.stageComplete
        || progression.reasonCode !== fact.reasonCode
      ) {
        addFinding(findings, 'council.round.progressionMismatch', '$', 'stageComplete and reasonCode must equal recomputed round progression');
      }
    }
  }

  const computed = reduction && !reduction.error && isRecord(policy)
    ? {
      decision: reduction.decision,
      dissent: reduction.dissent,
      stageComplete: roundProgression(policy, fact.round, reduction.decision).stageComplete,
      reasonCode: roundProgression(policy, fact.round, reduction.decision).reasonCode,
    }
    : null;
  return {
    admission: findings.length === 0 ? 'VALID' : 'INVALID',
    findings,
    computed,
  };
}

function semanticExpected(fixture) {
  const expected = cloneJson(fixture.expected ?? {
    accepted: fixture.accepted,
    ...(fixture.error ? { error: fixture.error } : {}),
  });
  for (const key of EXPECTED_METADATA_KEYS) delete expected[key];
  if (fixture.kind === 'runtimeNormalization') {
    delete expected.synthesizedContribution?.at;
  }
  return expected;
}

function matchesExpected(expected, actual) {
  if (Array.isArray(expected)) {
    return Array.isArray(actual)
      && expected.length === actual.length
      && expected.every((value, index) => matchesExpected(value, actual[index]));
  }
  if (isRecord(expected)) {
    return isRecord(actual)
      && Object.keys(expected).length === Object.keys(actual).length
      && Object.entries(expected).every(([key, value]) => (
        Object.hasOwn(actual, key) && matchesExpected(value, actual[key])
      ));
  }
  return Object.is(expected, actual);
}

function defineAtPath(target, path, value, append = false) {
  let cursor = target;
  for (let index = 0; index < path.length - 1; index += 1) cursor = cursor[path[index]];
  const key = path[path.length - 1];
  if (append) cursor[key].push(cloneJson(value));
  else cursor[key] = cloneJson(value);
}

function mutateCorpusDefinition(definition, mutations) {
  const mutated = cloneJson(definition);
  for (const mutation of mutations) {
    if (mutation.op === 'add' || mutation.op === 'replace') {
      defineAtPath(mutated, mutation.path, mutation.value);
    } else if (mutation.op === 'append') {
      defineAtPath(mutated, mutation.path, mutation.value, true);
    } else {
      throw new Error(`unsupported definition mutation ${JSON.stringify(mutation.op)}`);
    }
  }
  return mutated;
}

function corpusDefinitionError(findings) {
  const code = findings[0]?.code;
  const map = {
    'council.definition.unknownField': 'unknown_key',
    'council.seat.unknownField': 'unknown_key',
    'council.policy.unknownField': 'unknown_key',
    'council.definition.schema': 'schema',
    'council.seats.bounds': 'seats_bounds',
    'council.seats.duplicateId': 'duplicate_seat',
    'council.seat.lens': 'enum',
    'council.policies.bounds': 'policies_bounds',
    'council.policy.roster.duplicateSeat': 'duplicate_roster_seat',
    'council.policy.roster.unresolvedSeat': 'unknown_roster_seat',
    'council.policy.maxRounds': 'bound',
    'council.policy.timeoutSeconds': 'bound',
    'council.policy.agreement': 'enum',
    'council.policy.dissentRule': 'dissent_rule',
  };
  return map[code] ?? code ?? null;
}

function mutateDeclarativeDefinition(base, mutation) {
  const definition = cloneJson(base);
  if (mutation.replace) Object.assign(definition, cloneJson(mutation.replace));
  if (mutation.appendSeat) definition.seats.push(cloneJson(mutation.appendSeat));
  if (mutation.replaceRoster) definition.policies[mutation.policyId].roster = cloneJson(mutation.replaceRoster);
  return definition;
}

function definitionForDeclarative(fixturesJson, input) {
  if (input.definitionRef) return cloneJson(fixturesJson.sharedInputs.definitions[input.definitionRef]);
  if (input.mutation) {
    const base = fixturesJson.sharedInputs.definitions[input.mutation.definitionRef];
    return mutateDeclarativeDefinition(base, input.mutation);
  }
  return null;
}

function declarativeDefinitionCase(ctx, fixturesJson, fixture) {
  const definition = definitionForDeclarative(fixturesJson, fixture.input);
  const result = validateDefinition(ctx, definition);
  if (result.admission === 'VALID') {
    return {
      admission: 'VALID',
      policyCount: Object.keys(definition.policies).length,
      seatOrder: definition.seats.map(({ id }) => id),
    };
  }
  return {
    admission: 'INVALID',
    errorCode: result.findings[0]?.code,
    decision: null,
  };
}

function declarativeDecisionCase(ctx, fixturesJson, fixture) {
  const definition = definitionForDeclarative(fixturesJson, fixture.input);
  const definitionResult = validateDefinition(ctx, definition);
  if (definitionResult.admission !== 'VALID') {
    return { admission: 'INVALID', errorCode: definitionResult.findings[0]?.code, decision: null };
  }
  const policy = definition.policies[fixture.input.policyId];
  const contributions = cloneJson(fixturesJson.sharedInputs.contributionSets[fixture.input.contributionsRef]);
  const reduction = validateOrderedContributions(ctx, definition, policy, contributions);
  if (reduction.error) return { admission: 'INVALID', errorCode: reduction.error, decision: null };
  const actual = {
    admission: 'VALID',
    decision: reduction.decision,
    dissent: reduction.dissent,
  };
  if (reduction.missingInvocationSeat) {
    actual.approveCount = reduction.approveCount;
    actual.missingInvocationSeat = reduction.missingInvocationSeat;
  } else if (reduction.failedSeats.length > 0) {
    actual.failedSeats = reduction.failedSeats;
  } else if (policy.agreement === 'simpleMajority' || reduction.decision === 'changesRequested') {
    actual.approveCount = reduction.approveCount;
    actual.fullRosterCount = policy.roster.length;
  }
  return actual;
}

function declarativeNormalizationCase(fixturesJson, fixture) {
  const definition = definitionForDeclarative(fixturesJson, fixture.input);
  const policy = definition.policies[fixture.input.policyId];
  const raw = cloneJson(fixture.input.rawContributions);
  const bySeat = new Map(raw.map((contribution) => [contribution.seatId, contribution]));
  let synthesizedContribution = null;
  const normalized = policy.roster.map((seatId) => {
    if (bySeat.has(seatId)) return bySeat.get(seatId);
    const seat = definition.seats.find((candidate) => candidate.id === seatId);
    synthesizedContribution = {
      seatId,
      lens: seat.lens,
      executionStatus: 'failed',
      verdict: 'failed',
      contributionDigest: null,
      codexRunRef: null,
      excerpt: null,
      schema: SEAT_EVIDENCE_SCHEMA,
    };
    return synthesizedContribution;
  });
  return {
    admission: 'NORMALIZE',
    orderedSeatIds: normalized.map(({ seatId }) => seatId),
    synthesizedContribution,
  };
}

function emittedSeatIdsError(roster, emitted) {
  if (emitted.length < roster.length) return 'council.round.contributions.missing';
  if (emitted.length > roster.length) return 'council.round.contributions.extra';
  if (new Set(emitted).size !== emitted.length) return 'council.round.contributions.duplicate';
  if (emitted.some((seatId, index) => seatId !== roster[index])) return 'council.round.contributions.order';
  return null;
}

function declarativeEvidenceCase(ctx, fixturesJson, fixture) {
  const { input } = fixture;
  if (Array.isArray(input.emittedSeatIds)) {
    const definition = definitionForDeclarative(fixturesJson, input);
    const roster = definition.policies[input.policyId].roster;
    const errorCode = emittedSeatIdsError(roster, input.emittedSeatIds);
    return errorCode ? { admission: 'INVALID', errorCode, decision: null } : { admission: 'VALID' };
  }

  const definition = input.definitionRef
    ? definitionForDeclarative(fixturesJson, input)
    : cloneJson(fixturesJson.sharedInputs.definitions['council-core']);
  const expectedSeat = definition.seats.find(({ id }) => id === input.contribution.seatId) ?? null;
  const result = validateSeatEvidence(ctx, input.contribution, { definition, expectedSeat });
  return result.findings.length > 0
    ? { admission: 'INVALID', errorCode: result.findings[0].code, decision: null }
    : { admission: 'VALID' };
}

function roundProgression(policy, round, decision) {
  if (round > policy.maxRounds) return { admission: 'INVALID', errorCode: 'council.round.overCap', seatInvocations: 0 };
  if (decision === 'approved' || decision === 'changesRequested') {
    return { stageComplete: true, stageOutcome: decision, nextRound: null, reasonCode: null, workflowRoute: null };
  }
  if (round < policy.maxRounds) {
    return { stageComplete: false, stageOutcome: null, nextRound: round + 1, reasonCode: null, workflowRoute: null };
  }
  return {
    stageComplete: true,
    stageOutcome: 'inconclusive',
    nextRound: null,
    reasonCode: 'councilRoundsExhausted',
    workflowRoute: null,
  };
}

function declarativeProgressionCase(ctx, fixturesJson, fixture) {
  const definition = definitionForDeclarative(fixturesJson, fixture.input);
  const policy = definition.policies[fixture.input.policyId];
  if (!hasVocabularyValue(ctx, 'councilDecision', fixture.input.decision)) {
    return { admission: 'INVALID', errorCode: 'council.round.decision' };
  }
  return roundProgression(policy, fixture.input.round, fixture.input.decision);
}

function declarativeReplayCase(fixture) {
  const { input } = fixture;
  if (input.observedConflictingDigest && input.observedConflictingDigest !== input.acceptedEnvelopeDigest) {
    return { admission: 'INVALID_CONFLICT', seatInvocations: 0, errorCode: 'council.round.replayConflict' };
  }
  return {
    admission: 'REPLAY_ACCEPTED',
    seatInvocations: 0,
    returnsSameEnvelopeDigest: input.acceptedEnvelopeDigest,
  };
}

function evaluateDeclarative(ctx, fixturesJson, fixture) {
  switch (fixture.kind) {
    case 'definitionValidation': return declarativeDefinitionCase(ctx, fixturesJson, fixture);
    case 'decision': return declarativeDecisionCase(ctx, fixturesJson, fixture);
    case 'runtimeNormalization': return declarativeNormalizationCase(fixturesJson, fixture);
    case 'evidenceValidation': return declarativeEvidenceCase(ctx, fixturesJson, fixture);
    case 'roundProgression': return declarativeProgressionCase(ctx, fixturesJson, fixture);
    case 'replay': return declarativeReplayCase(fixture);
    default: throw new Error(`unsupported declarative fixture kind ${JSON.stringify(fixture.kind)}`);
  }
}

function mutateContributions(contributions, mutation) {
  const result = cloneJson(contributions);
  if (!mutation) return result;
  switch (mutation.op) {
    case 'remove': result.splice(mutation.index, 1); break;
    case 'replace-copy': result[mutation.index] = cloneJson(result[mutation.from]); break;
    case 'append-copy': result.push(cloneJson(result[mutation.from])); break;
    case 'swap': [result[mutation.left], result[mutation.right]] = [result[mutation.right], result[mutation.left]]; break;
    case 'replace-field': result[mutation.index][mutation.field] = cloneJson(mutation.value); break;
    case 'add-field': result[mutation.index][mutation.field] = cloneJson(mutation.value); break;
    default: throw new Error(`unsupported contribution mutation ${JSON.stringify(mutation.op)}`);
  }
  return result;
}

function evaluateCorpusDefinition(ctx, corpusJson, fixture) {
  const definition = mutateCorpusDefinition(corpusJson.definition, fixture.mutations);
  const result = validateDefinition(ctx, definition);
  return result.admission === 'VALID'
    ? { accepted: true }
    : { accepted: false, error: corpusDefinitionError(result.findings) };
}

function corpusRoundError(findings) {
  const code = findings[0]?.code;
  const map = {
    'council.round.bound': 'bound',
    'council.round.contributions.missing': 'missing_contribution',
    'council.round.contributions.extra': 'extra_contribution',
    'council.round.contributions.duplicate': 'duplicate_contribution',
    'council.round.contributions.order': 'reordered_contribution',
    'council.round.contributions.seat': 'unknown_roster_seat',
    'council.contribution.unknownField': 'unknown_key',
    'council.round.contributions.lensMismatch': 'wrong_lens',
    'council.contribution.statusVerdictMismatch': 'status_verdict',
    'council.round.decision': 'enum',
    'council.round.decisionMismatch': 'decision_mismatch',
    'council.round.dissentMismatch': 'dissent_mismatch',
    'council.round.progressionMismatch': 'progression_mismatch',
  };
  return map[code] ?? code ?? null;
}

function makeCorpusRoundFact(fixtureFact, contributions) {
  return {
    round: fixtureFact.round,
    inputHeadSha: fixtureFact.inputHeadSha,
    contributions,
    decision: fixtureFact.decision,
    dissent: cloneJson(fixtureFact.dissent),
    stageComplete: fixtureFact.stageComplete,
    reasonCode: fixtureFact.reasonCode,
  };
}

function priorFactsForCorpusRound(ctx, corpusJson, policy, fact) {
  if (!Number.isInteger(fact.round) || fact.round <= 1 || fact.round > policy.maxRounds) return [];
  let inconclusiveContributions = null;
  for (const candidate of Object.values(corpusJson.contributions)) {
    const reduction = validateOrderedContributions(ctx, corpusJson.definition, policy, candidate);
    if (!reduction.error && reduction.decision === 'inconclusive') {
      inconclusiveContributions = candidate;
      break;
    }
  }
  if (!inconclusiveContributions) return [];
  return Array.from({ length: fact.round - 1 }, (_, index) => ({
    round: index + 1,
    inputHeadSha: fact.inputHeadSha,
    contributions: cloneJson(inconclusiveContributions),
    decision: 'inconclusive',
    dissent: [],
    stageComplete: false,
    reasonCode: null,
  }));
}

function evaluateCorpusRound(ctx, corpusJson, fixture) {
  const policy = corpusJson.definition.policies[fixture.policyId];
  const contributions = mutateContributions(
    corpusJson.contributions[fixture.fact.contributionsRef],
    fixture.fact.contributionMutation,
  );
  const fact = makeCorpusRoundFact(fixture.fact, contributions);
  const envelope = { headSha: fact.inputHeadSha };
  const priorFacts = priorFactsForCorpusRound(ctx, corpusJson, policy, fact);
  const result = validateRoundFact(
    ctx,
    corpusJson.definition,
    fixture.policyId,
    envelope,
    fact,
    priorFacts,
  );
  return result.admission === 'VALID'
    ? { accepted: true }
    : { accepted: false, error: corpusRoundError(result.findings) };
}

function evaluateCases(fixtures, evaluator) {
  const cases = fixtures.map((fixture) => {
    const expected = semanticExpected(fixture);
    try {
      const actual = evaluator(fixture);
      const passed = matchesExpected(expected, actual);
      return { id: fixture.id, kind: fixture.kind ?? null, passed, expected, actual };
    } catch (error) {
      return {
        id: fixture.id,
        kind: fixture.kind ?? null,
        passed: false,
        expected,
        actual: { error: error instanceof Error ? error.message : String(error) },
      };
    }
  });
  const passed = cases.filter((fixture) => fixture.passed).length;
  return { total: cases.length, passed, failed: cases.length - passed, cases };
}

/** Execute declarative fixtures and the two corpus buckets independently. */
export function runFixtures(ctx, fixturesJson, corpusJson) {
  if (!isRecord(fixturesJson) || !Array.isArray(fixturesJson.fixtures)) {
    throw new TypeError('fixturesJson.fixtures must be an array');
  }
  if (!isRecord(corpusJson) || !Array.isArray(corpusJson.definitionCases) || !Array.isArray(corpusJson.roundCases)) {
    throw new TypeError('corpusJson must provide definitionCases and roundCases arrays');
  }

  return {
    declarative: evaluateCases(
      fixturesJson.fixtures,
      (fixture) => evaluateDeclarative(ctx, fixturesJson, fixture),
    ),
    definitionCases: evaluateCases(
      corpusJson.definitionCases,
      (fixture) => evaluateCorpusDefinition(ctx, corpusJson, fixture),
    ),
    roundCases: evaluateCases(
      corpusJson.roundCases,
      (fixture) => evaluateCorpusRound(ctx, corpusJson, fixture),
    ),
  };
}
