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
  return Object.values(value).every((entry) => Number.isInteger(entry) && entry >= 0);
}

function isPlainRecord(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function isNullableString(value) {
  return value === null || typeof value === 'string';
}

function isNullableFiniteNumber(value) {
  return value === null || Number.isFinite(value);
}

function isRecordOfNullableStrings(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => isNullableString(entry));
}

function isValidBoundsEntry(value) {
  return Boolean(
    isPlainRecord(value) &&
      Number.isFinite(value.min) &&
      Number.isFinite(value.max),
  );
}

function isNullableBoundsEntry(value) {
  return value === null || isValidBoundsEntry(value);
}

function isValidBoundsMap(value) {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.values(value).every((scenarioBounds) => {
    if (!isPlainRecord(scenarioBounds)) {
      return false;
    }
    return Object.values(scenarioBounds).every((metricBounds) => isValidBoundsEntry(metricBounds));
  });
}

function isValidAggregateDeltaMap(value) {
  if (!isPlainRecord(value)) {
    return false;
  }

  return Object.values(value).every((scenarioDelta) => {
    if (!isPlainRecord(scenarioDelta)) {
      return false;
    }
    return Object.values(scenarioDelta).every((metricDelta) => {
      if (!isPlainRecord(metricDelta) || typeof metricDelta.changed !== 'boolean') {
        return false;
      }

      const hasDeltaNumbers =
        Number.isFinite(metricDelta.minDelta) && Number.isFinite(metricDelta.maxDelta);
      const hasFromTo = 'from' in metricDelta || 'to' in metricDelta;
      if (!hasDeltaNumbers && !hasFromTo) {
        return false;
      }
      if (hasDeltaNumbers && metricDelta.changed !== (metricDelta.minDelta !== 0 || metricDelta.maxDelta !== 0)) {
        return false;
      }
      if (hasFromTo) {
        if (!isNullableBoundsEntry(metricDelta.from) || !isNullableBoundsEntry(metricDelta.to)) {
          return false;
        }
        if (!metricDelta.changed || metricDelta.from === metricDelta.to) {
          return false;
        }
      }
      return true;
    });
  });
}

function hasValidSnapshotDeltaConsistency(payload) {
  const currentSignatures = payload?.currentSnapshotSignatures ?? {};
  const suggestedSignatures = payload?.suggestedSnapshotSignatures ?? {};
  const snapshotDelta = payload?.snapshotDelta ?? [];

  const allKeys = new Set([
    ...Object.keys(currentSignatures),
    ...Object.keys(suggestedSignatures),
  ]);
  const seenKeys = new Set();

  for (const entry of snapshotDelta) {
    if (!entry || typeof entry !== 'object' || typeof entry.key !== 'string' || entry.key.length === 0) {
      return false;
    }
    if (seenKeys.has(entry.key)) {
      return false;
    }
    seenKeys.add(entry.key);

    const expectedFrom = currentSignatures[entry.key] ?? null;
    const expectedTo = suggestedSignatures[entry.key] ?? null;
    if (!isNullableString(entry.from) || !isNullableString(entry.to)) {
      return false;
    }
    if (entry.from !== expectedFrom || entry.to !== expectedTo) {
      return false;
    }
    if (typeof entry.changed !== 'boolean' || entry.changed !== (expectedFrom !== expectedTo)) {
      return false;
    }
  }

  return seenKeys.size === allKeys.size && snapshotDelta.length === allKeys.size;
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
      entry.command.length > 0 &&
      Array.isArray(entry.paths) &&
      entry.paths.every((path) => typeof path === 'string' && path.length > 0),
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
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.baselineSuggestions) &&
        isNonNegativeInteger(payload.driftRuns) &&
        isValidBoundsMap(payload.currentAggregateBounds) &&
        isValidBoundsMap(payload.suggestedAggregateBounds) &&
        isRecordOfNullableStrings(payload.currentSnapshotSignatures) &&
        isRecordOfNullableStrings(payload.suggestedSnapshotSignatures) &&
        isValidAggregateDeltaMap(payload.aggregateDelta) &&
        Array.isArray(payload.snapshotDelta) &&
        payload.snippets &&
        typeof payload.snippets.regressionBaseline === 'string' &&
        typeof payload.snippets.regressionSnapshots === 'string',
    )
  ) {
    return false;
  }

  return hasValidSnapshotDeltaConsistency(payload);
}

function isValidScenarioTuningSignatureResultEntry(entry) {
  return Boolean(
    entry &&
      typeof entry === 'object' &&
      typeof entry.scenarioId === 'string' &&
      isNullableString(entry.currentSignature) &&
      isNullableString(entry.expectedSignature) &&
      typeof entry.changed === 'boolean' &&
      isNullableString(entry.message) &&
      ((entry.changed && typeof entry.message === 'string') || (!entry.changed && entry.message === null)),
  );
}

function isValidScenarioTuningIntensityResultEntry(entry) {
  return Boolean(
    entry &&
      typeof entry === 'object' &&
      typeof entry.scenarioId === 'string' &&
      isNullableFiniteNumber(entry.currentTotalAbsDeltaPercent) &&
      isNullableFiniteNumber(entry.expectedTotalAbsDeltaPercent) &&
      typeof entry.changed === 'boolean' &&
      isNullableString(entry.message) &&
      ((entry.changed && typeof entry.message === 'string') || (!entry.changed && entry.message === null)),
  );
}

export function isValidScenarioTuningSuggestionPayload(payload) {
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.scenarioTuningBaselineSuggestions) &&
        isNonNegativeInteger(payload.changedCount) &&
        isNonNegativeInteger(payload.intensityChangedCount) &&
        typeof payload.overallPassed === 'boolean' &&
        Array.isArray(payload.results) &&
        Array.isArray(payload.intensityResults) &&
        isPlainRecord(payload.currentSignatures) &&
        isPlainRecord(payload.expectedSignatures) &&
        isPlainRecord(payload.currentTotalAbsDelta) &&
        isPlainRecord(payload.expectedTotalAbsDelta) &&
        typeof payload.strictIntensityRecommended === 'boolean' &&
        typeof payload.strictIntensityCommand === 'string' &&
        payload.strictIntensityCommand.length > 0 &&
        payload.snippets &&
        typeof payload.snippets.scenarioTuningBaseline === 'string' &&
        typeof payload.snippets.scenarioTuningTotalAbsDeltaBaseline === 'string',
    )
  ) {
    return false;
  }

  if (
    !payload.results.every(isValidScenarioTuningSignatureResultEntry) ||
    !payload.intensityResults.every(isValidScenarioTuningIntensityResultEntry)
  ) {
    return false;
  }

  const changedCount = payload.results.filter((result) => result.changed).length;
  const intensityChangedCount = payload.intensityResults.filter((result) => result.changed).length;
  return Boolean(
    payload.changedCount === changedCount &&
      payload.intensityChangedCount === intensityChangedCount &&
      payload.overallPassed === (changedCount === 0 && intensityChangedCount === 0) &&
      payload.strictIntensityRecommended === (intensityChangedCount > 0),
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
  const results = Array.isArray(payload?.results) ? payload.results : [];
  const hasValidStatusCounts = isRecordOfNumbers(payload?.statusCounts);
  const hasValidActions = isValidRecommendedActions(payload?.recommendedActions);
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.reportArtifactsValidation) &&
        typeof payload.overallPassed === 'boolean' &&
        Number.isInteger(payload.failureCount) &&
        payload.failureCount >= 0 &&
        Number.isInteger(payload.totalChecked) &&
        payload.totalChecked >= 0 &&
        hasValidStatusCounts &&
        hasValidActions &&
        Array.isArray(payload.results),
    )
  ) {
    return false;
  }

  const validResults = results.every(
    (result) =>
      result &&
      typeof result === 'object' &&
      typeof result.path === 'string' &&
      result.path.length > 0 &&
      typeof result.kind === 'string' &&
      result.kind.length > 0 &&
      typeof result.status === 'string' &&
      typeof result.ok === 'boolean' &&
      (result.message === null || typeof result.message === 'string') &&
      (result.recommendedCommand === null || typeof result.recommendedCommand === 'string'),
  );
  if (!validResults) {
    return false;
  }

  const failureCount = results.filter((result) => !result.ok).length;
  const computedStatusCounts = results.reduce((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  const computedStatusTotal = Object.values(computedStatusCounts).reduce((sum, value) => sum + value, 0);
  const reportedStatusTotal = Object.values(payload.statusCounts).reduce((sum, value) => sum + value, 0);
  const statusCountsMatch = Object.keys(computedStatusCounts).every(
    (status) => payload.statusCounts[status] === computedStatusCounts[status],
  );

  return Boolean(
    payload.totalChecked === results.length &&
      payload.failureCount === failureCount &&
      payload.overallPassed === (failureCount === 0) &&
      reportedStatusTotal === payload.totalChecked &&
      computedStatusTotal === payload.totalChecked &&
      statusCountsMatch,
  );
}

function isKnownTrendComparisonSource(value) {
  return value === 'dashboard' || value === 'signature-baseline';
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function isValidTrendStatusCounts(value) {
  if (!isRecordOfNumbers(value)) {
    return false;
  }
  return ['added', 'changed', 'removed', 'unchanged'].every((key) =>
    isNonNegativeInteger(value[key]),
  );
}

function hasValidTrendCountConsistency(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const addedCount = payload.statusCounts?.added ?? 0;
  const changedStatusCount = payload.statusCounts?.changed ?? 0;
  const removedCount = payload.statusCounts?.removed ?? 0;
  const unchangedStatusCount = payload.statusCounts?.unchanged ?? 0;
  const changedByStatus = addedCount + changedStatusCount + removedCount;
  const totalByStatus = changedByStatus + unchangedStatusCount;

  return (
    payload.scenarioCount === payload.changedCount + payload.unchangedCount &&
    payload.changedCount === changedByStatus &&
    payload.unchangedCount === unchangedStatusCount &&
    payload.scenarioCount === totalByStatus &&
    payload.hasChanges === payload.changedCount > 0 &&
    payload.scenarioCount === payload.scenarios.length &&
    payload.changedCount === payload.changedScenarioIds.length
  );
}

export function isValidScenarioTuningTrendPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningTrend) &&
      isKnownTrendComparisonSource(payload.comparisonSource) &&
      (typeof payload.baselineReference === 'string' || payload.baselineReference === null) &&
      typeof payload.hasBaselineDashboard === 'boolean' &&
      isNonNegativeInteger(payload.baselineScenarioCount) &&
      isNonNegativeInteger(payload.scenarioCount) &&
      isNonNegativeInteger(payload.changedCount) &&
      isNonNegativeInteger(payload.unchangedCount) &&
      typeof payload.hasChanges === 'boolean' &&
      isValidTrendStatusCounts(payload.statusCounts) &&
      Array.isArray(payload.scenarios) &&
      Array.isArray(payload.changedScenarioIds) &&
      payload.changedScenarioIds.every((scenarioId) => typeof scenarioId === 'string') &&
      hasValidTrendCountConsistency(payload),
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
