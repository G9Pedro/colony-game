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

function isCanonicalIsoTimestamp(value) {
  if (typeof value !== 'string') {
    return false;
  }
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) {
    return false;
  }
  return new Date(timestamp).toISOString() === value;
}

export function hasValidMeta(payload, expectedKind) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  if (!(expectedKind in REPORT_SCHEMA_VERSIONS)) {
    return false;
  }

  const version = REPORT_SCHEMA_VERSIONS[expectedKind];
  return (
    isCanonicalIsoTimestamp(payload.generatedAt) &&
    payload.meta &&
    payload.meta.kind === expectedKind &&
    payload.meta.schemaVersion === version &&
    isCanonicalIsoTimestamp(payload.meta.generatedAt) &&
    payload.meta.generatedAt === payload.generatedAt
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
