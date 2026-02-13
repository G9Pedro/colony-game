export const REPORT_KINDS = {
  baselineSuggestions: 'baseline-suggestions',
  scenarioTuningBaselineSuggestions: 'scenario-tuning-baseline-suggestions',
};

export const REPORT_SCHEMA_VERSIONS = {
  [REPORT_KINDS.baselineSuggestions]: 1,
  [REPORT_KINDS.scenarioTuningBaselineSuggestions]: 1,
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
