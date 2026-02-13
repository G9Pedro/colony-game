export const REPORT_KINDS = {
  baselineSuggestions: 'baseline-suggestions',
  scenarioTuningBaselineSuggestions: 'scenario-tuning-baseline-suggestions',
  scenarioTuningValidation: 'scenario-tuning-validation',
  scenarioTuningDashboard: 'scenario-tuning-dashboard',
  scenarioTuningTrend: 'scenario-tuning-trend',
  reportArtifactsValidation: 'report-artifacts-validation',
};

export const REPORT_SCHEMA_VERSIONS = {
  [REPORT_KINDS.baselineSuggestions]: 1,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: 1,
  [REPORT_KINDS.scenarioTuningValidation]: 1,
  [REPORT_KINDS.scenarioTuningDashboard]: 1,
  [REPORT_KINDS.scenarioTuningTrend]: 1,
  [REPORT_KINDS.reportArtifactsValidation]: 1,
};

function hasValidMeta(payload, expectedKind) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const version = REPORT_SCHEMA_VERSIONS[expectedKind];
  return (
    typeof payload.generatedAt === 'string' &&
    payload.meta &&
    payload.meta.kind === expectedKind &&
    payload.meta.schemaVersion === version &&
    typeof payload.meta.generatedAt === 'string' &&
    payload.meta.generatedAt === payload.generatedAt
  );
}

function isRecordOfNumbers(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  return Object.values(value).every((entry) => Number.isFinite(entry));
}

function isValidRecommendedActions(value) {
  if (!Array.isArray(value)) {
    return false;
  }
  return value.every(
    (entry) =>
      entry &&
      typeof entry === 'object' &&
      typeof entry.command === 'string' &&
      Array.isArray(entry.paths) &&
      entry.paths.every((path) => typeof path === 'string'),
  );
}

export function withReportMeta(kind, payload) {
  if (!(kind in REPORT_SCHEMA_VERSIONS)) {
    throw new Error(`Unknown report kind "${kind}".`);
  }

  const generatedAt = new Date().toISOString();
  return {
    ...(payload ?? {}),
    generatedAt,
    meta: {
      kind,
      schemaVersion: REPORT_SCHEMA_VERSIONS[kind],
      generatedAt,
    },
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
      Array.isArray(payload.intensityResults) &&
      payload.snippets &&
      typeof payload.snippets.scenarioTuningBaseline === 'string' &&
      typeof payload.snippets.scenarioTuningTotalAbsDeltaBaseline === 'string',
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

export function isValidReportArtifactsValidationPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.reportArtifactsValidation) &&
      typeof payload.overallPassed === 'boolean' &&
      typeof payload.failureCount === 'number' &&
      typeof payload.totalChecked === 'number' &&
      isRecordOfNumbers(payload.statusCounts) &&
      isValidRecommendedActions(payload.recommendedActions) &&
      Array.isArray(payload.results),
  );
}

function isKnownTrendComparisonSource(value) {
  return value === 'dashboard' || value === 'signature-baseline';
}

export function isValidScenarioTuningTrendPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningTrend) &&
      isKnownTrendComparisonSource(payload.comparisonSource) &&
      (typeof payload.baselineReference === 'string' || payload.baselineReference === null) &&
      typeof payload.hasBaselineDashboard === 'boolean' &&
      typeof payload.baselineScenarioCount === 'number' &&
      typeof payload.scenarioCount === 'number' &&
      typeof payload.changedCount === 'number' &&
      typeof payload.unchangedCount === 'number' &&
      typeof payload.hasChanges === 'boolean' &&
      Array.isArray(payload.scenarios) &&
      Array.isArray(payload.changedScenarioIds),
  );
}

export const REPORT_VALIDATORS = {
  [REPORT_KINDS.baselineSuggestions]: isValidBaselineSuggestionPayload,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: isValidScenarioTuningSuggestionPayload,
  [REPORT_KINDS.scenarioTuningValidation]: isValidScenarioTuningValidationPayload,
  [REPORT_KINDS.scenarioTuningDashboard]: isValidScenarioTuningDashboardPayload,
  [REPORT_KINDS.scenarioTuningTrend]: isValidScenarioTuningTrendPayload,
  [REPORT_KINDS.reportArtifactsValidation]: isValidReportArtifactsValidationPayload,
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
