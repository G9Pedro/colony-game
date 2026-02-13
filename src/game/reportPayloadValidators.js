export const REPORT_KINDS = {
  baselineSuggestions: 'baseline-suggestions',
  scenarioTuningBaselineSuggestions: 'scenario-tuning-baseline-suggestions',
  scenarioTuningValidation: 'scenario-tuning-validation',
  scenarioTuningDashboard: 'scenario-tuning-dashboard',
};

export const REPORT_SCHEMA_VERSIONS = {
  [REPORT_KINDS.baselineSuggestions]: 1,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: 1,
  [REPORT_KINDS.scenarioTuningValidation]: 1,
  [REPORT_KINDS.scenarioTuningDashboard]: 1,
};

function hasValidMeta(payload, expectedKind) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const version = REPORT_SCHEMA_VERSIONS[expectedKind];
  return (
    payload.meta &&
    payload.meta.kind === expectedKind &&
    payload.meta.schemaVersion === version &&
    typeof payload.meta.generatedAt === 'string'
  );
}

export function withReportMeta(kind, payload) {
  if (!(kind in REPORT_SCHEMA_VERSIONS)) {
    throw new Error(`Unknown report kind "${kind}".`);
  }

  const generatedAt = new Date().toISOString();
  return {
    generatedAt,
    meta: {
      kind,
      schemaVersion: REPORT_SCHEMA_VERSIONS[kind],
      generatedAt,
    },
    ...payload,
  };
}

export function isValidBaselineSuggestionPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.baselineSuggestions) &&
      payload.aggregateDelta &&
      typeof payload.aggregateDelta === 'object' &&
      Array.isArray(payload.snapshotDelta) &&
      payload.snippets &&
      typeof payload.snippets.regressionBaseline === 'string' &&
      typeof payload.snippets.regressionSnapshots === 'string',
  );
}

export function isValidScenarioTuningSuggestionPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningBaselineSuggestions) &&
      Array.isArray(payload.results) &&
      payload.snippets &&
      typeof payload.snippets.scenarioTuningBaseline === 'string',
  );
}

export function isValidScenarioTuningValidationPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningValidation) &&
      typeof payload.ok === 'boolean' &&
      Array.isArray(payload.errors) &&
      Array.isArray(payload.warnings) &&
      typeof payload.issueCount === 'number' &&
      typeof payload.checkedScenarioCount === 'number',
  );
}

export function isValidScenarioTuningDashboardPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningDashboard) &&
      typeof payload.scenarioCount === 'number' &&
      typeof payload.activeScenarioCount === 'number' &&
      Array.isArray(payload.scenarios) &&
      Array.isArray(payload.ranking) &&
      payload.signatureMap &&
      typeof payload.signatureMap === 'object',
  );
}

export const REPORT_VALIDATORS = {
  [REPORT_KINDS.baselineSuggestions]: isValidBaselineSuggestionPayload,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: isValidScenarioTuningSuggestionPayload,
  [REPORT_KINDS.scenarioTuningValidation]: isValidScenarioTuningValidationPayload,
  [REPORT_KINDS.scenarioTuningDashboard]: isValidScenarioTuningDashboardPayload,
};

export function isKnownReportKind(kind) {
  return Boolean(REPORT_VALIDATORS[kind]);
}

export function validateReportPayloadByKind(kind, payload) {
  const validator = REPORT_VALIDATORS[kind];
  if (!validator) {
    return {
      ok: false,
      reason: `Unknown report kind "${kind}".`,
    };
  }
  const ok = Boolean(validator(payload));
  return {
    ok,
    reason: ok ? null : `Payload failed validation for kind "${kind}".`,
  };
}
