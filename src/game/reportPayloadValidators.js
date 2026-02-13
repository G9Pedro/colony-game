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

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

function roundToFour(value) {
  return Number(value.toFixed(4));
}

function normalizeJsonValue(value) {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeJsonValue(item));
  }
  if (!isPlainRecord(value)) {
    return value;
  }
  return Object.fromEntries(
    Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .map((key) => [key, normalizeJsonValue(value[key])]),
  );
}

function areNormalizedJsonValuesEqual(left, right) {
  return JSON.stringify(normalizeJsonValue(left)) === JSON.stringify(normalizeJsonValue(right));
}

function parseExportedConstSnippetObject(snippet, constName) {
  if (typeof snippet !== 'string' || snippet.length === 0) {
    return { ok: false, value: null };
  }

  const escapedConstName = constName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `^\\s*export\\s+const\\s+${escapedConstName}\\s*=\\s*([\\s\\S]+?)\\s*;\\s*$`,
  );
  const match = snippet.match(pattern);
  if (!match) {
    return { ok: false, value: null };
  }

  try {
    const value = JSON.parse(match[1]);
    if (!isPlainRecord(value)) {
      return { ok: false, value: null };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, value: null };
  }
}

function isSnippetObjectParityValid({ snippet, constName, expectedValue }) {
  const parsed = parseExportedConstSnippetObject(snippet, constName);
  if (!parsed.ok) {
    return false;
  }
  return areNormalizedJsonValuesEqual(parsed.value, expectedValue);
}

function isRecordOfNullableStrings(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => isNullableString(entry));
}

function isRecordOfStrings(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => typeof entry === 'string' && entry.length > 0);
}

function isRecordOfNonNegativeFiniteNumbers(value) {
  if (!isPlainRecord(value)) {
    return false;
  }
  return Object.values(value).every((entry) => Number.isFinite(entry) && entry >= 0);
}

function isValidBoundsEntry(value) {
  return Boolean(
    isPlainRecord(value) &&
      Number.isFinite(value.min) &&
      Number.isFinite(value.max) &&
      value.min <= value.max,
  );
}

function isNullableBoundsEntry(value) {
  return value === null || isValidBoundsEntry(value);
}

function areBoundsEqual(left, right) {
  if (left === null || right === null) {
    return left === right;
  }
  if (!isValidBoundsEntry(left) || !isValidBoundsEntry(right)) {
    return false;
  }
  return roundToFour(left.min) === roundToFour(right.min) && roundToFour(left.max) === roundToFour(right.max);
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

function hasValidAggregateDeltaConsistency(payload) {
  const currentBounds = payload?.currentAggregateBounds ?? {};
  const suggestedBounds = payload?.suggestedAggregateBounds ?? {};
  const aggregateDelta = payload?.aggregateDelta ?? {};

  const expectedScenarioIds = new Set([
    ...Object.keys(currentBounds),
    ...Object.keys(suggestedBounds),
  ]);
  const actualScenarioIds = Object.keys(aggregateDelta);
  if (actualScenarioIds.length !== expectedScenarioIds.size) {
    return false;
  }

  for (const scenarioId of actualScenarioIds) {
    if (!expectedScenarioIds.has(scenarioId)) {
      return false;
    }

    const currentScenarioBounds = currentBounds[scenarioId] ?? {};
    const suggestedScenarioBounds = suggestedBounds[scenarioId] ?? {};
    const scenarioDelta = aggregateDelta[scenarioId];
    if (!isPlainRecord(scenarioDelta)) {
      return false;
    }

    const expectedMetricKeys = new Set([
      ...Object.keys(currentScenarioBounds),
      ...Object.keys(suggestedScenarioBounds),
    ]);
    const actualMetricKeys = Object.keys(scenarioDelta);
    if (actualMetricKeys.length !== expectedMetricKeys.size) {
      return false;
    }

    for (const metricKey of actualMetricKeys) {
      if (!expectedMetricKeys.has(metricKey)) {
        return false;
      }

      const entry = scenarioDelta[metricKey];
      const currentMetric = currentScenarioBounds[metricKey] ?? null;
      const suggestedMetric = suggestedScenarioBounds[metricKey] ?? null;

      if (!currentMetric || !suggestedMetric) {
        if (!Boolean(entry && typeof entry === 'object' && entry.changed === true)) {
          return false;
        }
        if (
          !isNullableBoundsEntry(entry.from ?? null) ||
          !isNullableBoundsEntry(entry.to ?? null) ||
          !areBoundsEqual(entry.from ?? null, currentMetric) ||
          !areBoundsEqual(entry.to ?? null, suggestedMetric)
        ) {
          return false;
        }
        continue;
      }

      const expectedMinDelta = roundToFour(suggestedMetric.min - currentMetric.min);
      const expectedMaxDelta = roundToFour(suggestedMetric.max - currentMetric.max);
      if (
        !Boolean(
          entry &&
            typeof entry === 'object' &&
            Number.isFinite(entry.minDelta) &&
            Number.isFinite(entry.maxDelta) &&
            entry.minDelta === expectedMinDelta &&
            entry.maxDelta === expectedMaxDelta &&
            entry.changed === (expectedMinDelta !== 0 || expectedMaxDelta !== 0),
        )
      ) {
        return false;
      }
    }
  }

  return true;
}

function isValidDashboardDeltaEntry(entry) {
  return Boolean(
    entry &&
      typeof entry === 'object' &&
      typeof entry.key === 'string' &&
      entry.key.length > 0 &&
      Number.isFinite(entry.multiplier) &&
      entry.multiplier > 0 &&
      Number.isFinite(entry.deltaPercent) &&
      Number.isFinite(entry.absDeltaPercent) &&
      entry.absDeltaPercent >= 0 &&
      roundToTwo(Math.abs(entry.deltaPercent)) === roundToTwo(entry.absDeltaPercent),
  );
}

function isValidDashboardSummary(summary, entries) {
  if (
    !Boolean(
      summary &&
        typeof summary === 'object' &&
        isNonNegativeInteger(summary.count) &&
        Number.isFinite(summary.meanAbsDeltaPercent) &&
        summary.meanAbsDeltaPercent >= 0 &&
        Number.isFinite(summary.maxAbsDeltaPercent) &&
        summary.maxAbsDeltaPercent >= 0,
    )
  ) {
    return false;
  }

  const count = entries.length;
  if (summary.count !== count) {
    return false;
  }

  if (count === 0) {
    return summary.meanAbsDeltaPercent === 0 && summary.maxAbsDeltaPercent === 0;
  }

  const totalAbsDelta = entries.reduce((sum, entry) => sum + entry.absDeltaPercent, 0);
  const maxAbsDelta = entries.reduce((max, entry) => Math.max(max, entry.absDeltaPercent), 0);
  return (
    roundToTwo(summary.meanAbsDeltaPercent) === roundToTwo(totalAbsDelta / count) &&
    roundToTwo(summary.maxAbsDeltaPercent) === roundToTwo(maxAbsDelta)
  );
}

function isValidScenarioDashboardEntry(entry) {
  if (
    !Boolean(
      entry &&
        typeof entry === 'object' &&
        typeof entry.id === 'string' &&
        entry.id.length > 0 &&
        typeof entry.name === 'string' &&
        entry.name.length > 0 &&
        typeof entry.description === 'string' &&
        typeof entry.signature === 'string' &&
        entry.signature.length > 0 &&
        Array.isArray(entry.resourceOutputDeltas) &&
        Array.isArray(entry.jobOutputDeltas) &&
        Array.isArray(entry.jobPriorityDeltas) &&
        Number.isFinite(entry.totalAbsDeltaPercent) &&
        entry.totalAbsDeltaPercent >= 0 &&
        typeof entry.isNeutral === 'boolean',
    )
  ) {
    return false;
  }

  const allDeltas = [...entry.resourceOutputDeltas, ...entry.jobOutputDeltas, ...entry.jobPriorityDeltas];
  if (!allDeltas.every(isValidDashboardDeltaEntry)) {
    return false;
  }
  if (
    !isValidDashboardSummary(entry.resourceOutputSummary, entry.resourceOutputDeltas) ||
    !isValidDashboardSummary(entry.jobOutputSummary, entry.jobOutputDeltas) ||
    !isValidDashboardSummary(entry.jobPrioritySummary, entry.jobPriorityDeltas)
  ) {
    return false;
  }

  const computedTotalAbs = roundToTwo(
    allDeltas.reduce((sum, deltaEntry) => sum + deltaEntry.absDeltaPercent, 0),
  );
  if (roundToTwo(entry.totalAbsDeltaPercent) !== computedTotalAbs) {
    return false;
  }
  return entry.isNeutral === (allDeltas.length === 0);
}

function hasValidDashboardSignatureMap(scenarios, signatureMap) {
  if (!isPlainRecord(signatureMap)) {
    return false;
  }
  const scenarioIds = scenarios.map((scenario) => scenario.id);
  const sortedScenarioIds = [...scenarioIds].sort((a, b) => a.localeCompare(b));
  const signatureMapKeys = Object.keys(signatureMap).sort((a, b) => a.localeCompare(b));
  if (sortedScenarioIds.length !== signatureMapKeys.length) {
    return false;
  }
  for (let index = 0; index < sortedScenarioIds.length; index += 1) {
    if (sortedScenarioIds[index] !== signatureMapKeys[index]) {
      return false;
    }
  }
  return scenarios.every((scenario) => signatureMap[scenario.id] === scenario.signature);
}

function hasValidDashboardRanking(scenarios, ranking) {
  if (!Array.isArray(ranking) || ranking.length !== scenarios.length) {
    return false;
  }

  const scenarioById = new Map(scenarios.map((scenario) => [scenario.id, scenario]));
  const expectedOrder = [...scenarios]
    .sort(
      (a, b) =>
        b.totalAbsDeltaPercent - a.totalAbsDeltaPercent ||
        a.id.localeCompare(b.id),
    )
    .map((scenario) => scenario.id);

  const rankedScenarioIds = [];
  for (let index = 0; index < ranking.length; index += 1) {
    const entry = ranking[index];
    if (
      !Boolean(
        entry &&
          typeof entry === 'object' &&
          isNonNegativeInteger(entry.rank) &&
          entry.rank === index + 1 &&
          typeof entry.scenarioId === 'string' &&
          Number.isFinite(entry.totalAbsDeltaPercent),
      )
    ) {
      return false;
    }
    const scenario = scenarioById.get(entry.scenarioId);
    if (!scenario) {
      return false;
    }
    if (roundToTwo(entry.totalAbsDeltaPercent) !== roundToTwo(scenario.totalAbsDeltaPercent)) {
      return false;
    }
    rankedScenarioIds.push(entry.scenarioId);
  }

  return rankedScenarioIds.every((scenarioId, index) => scenarioId === expectedOrder[index]);
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

const KNOWN_REPORT_ARTIFACT_STATUSES = new Set(['ok', 'error', 'invalid', 'invalid-json']);

function isValidReportArtifactResultEntry(result) {
  if (
    !Boolean(
      result &&
        typeof result === 'object' &&
        typeof result.path === 'string' &&
        result.path.length > 0 &&
        typeof result.kind === 'string' &&
        result.kind.length > 0 &&
        typeof result.status === 'string' &&
        KNOWN_REPORT_ARTIFACT_STATUSES.has(result.status) &&
        typeof result.ok === 'boolean' &&
        (result.message === null || typeof result.message === 'string') &&
        (result.recommendedCommand === null || typeof result.recommendedCommand === 'string'),
    )
  ) {
    return false;
  }

  if (result.ok) {
    return result.status === 'ok' && result.message === null && result.recommendedCommand === null;
  }

  return (
    result.status !== 'ok' &&
    typeof result.message === 'string' &&
    result.message.length > 0 &&
    typeof result.recommendedCommand === 'string' &&
    result.recommendedCommand.length > 0
  );
}

function buildRecommendedActionsFromResults(results) {
  const byCommand = new Map();
  for (const result of results ?? []) {
    if (result.ok) {
      continue;
    }
    const command = result.recommendedCommand;
    if (!byCommand.has(command)) {
      byCommand.set(command, new Set());
    }
    byCommand.get(command).add(result.path);
  }

  return Array.from(byCommand.entries())
    .map(([command, pathSet]) => ({
      command,
      paths: Array.from(pathSet).sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.command.localeCompare(b.command));
}

function normalizeRecommendedActions(actions) {
  return (actions ?? [])
    .map((action) => ({
      command: action.command,
      paths: [...action.paths].sort((a, b) => a.localeCompare(b)),
    }))
    .sort((a, b) => a.command.localeCompare(b.command));
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

  return (
    hasValidAggregateDeltaConsistency(payload) &&
    hasValidSnapshotDeltaConsistency(payload) &&
    isSnippetObjectParityValid({
      snippet: payload.snippets?.regressionBaseline,
      constName: 'AGGREGATE_BASELINE_BOUNDS',
      expectedValue: payload.suggestedAggregateBounds,
    }) &&
    isSnippetObjectParityValid({
      snippet: payload.snippets?.regressionSnapshots,
      constName: 'EXPECTED_SUMMARY_SIGNATURES',
      expectedValue: payload.suggestedSnapshotSignatures,
    })
  );
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

function isValidScenarioTuningValidationIssue(entry, severity) {
  return Boolean(
    entry &&
      typeof entry === 'object' &&
      entry.severity === severity &&
      typeof entry.scenarioId === 'string' &&
      entry.scenarioId.length > 0 &&
      typeof entry.path === 'string' &&
      entry.path.length > 0 &&
      typeof entry.message === 'string' &&
      entry.message.length > 0,
  );
}

function hasValidScenarioTuningSignatureResultConsistency(payload) {
  const currentSignatures = payload?.currentSignatures ?? {};
  const expectedSignatures = payload?.expectedSignatures ?? {};
  const results = payload?.results ?? [];
  const scenarioIds = new Set([...Object.keys(currentSignatures), ...Object.keys(expectedSignatures)]);

  if (results.length !== scenarioIds.size) {
    return false;
  }

  const resultsByScenarioId = new Map();
  for (const result of results) {
    if (resultsByScenarioId.has(result.scenarioId)) {
      return false;
    }
    resultsByScenarioId.set(result.scenarioId, result);
  }

  for (const scenarioId of scenarioIds) {
    const result = resultsByScenarioId.get(scenarioId);
    if (!result) {
      return false;
    }
    const currentSignature = currentSignatures[scenarioId] ?? null;
    const expectedSignature = expectedSignatures[scenarioId] ?? null;
    if (result.currentSignature !== currentSignature || result.expectedSignature !== expectedSignature) {
      return false;
    }
    if (result.changed !== (currentSignature !== expectedSignature)) {
      return false;
    }
  }
  return true;
}

function hasValidScenarioTuningIntensityResultConsistency(payload) {
  const currentTotalAbsDelta = payload?.currentTotalAbsDelta ?? {};
  const expectedTotalAbsDelta = payload?.expectedTotalAbsDelta ?? {};
  const intensityResults = payload?.intensityResults ?? [];
  const scenarioIds = new Set([...Object.keys(currentTotalAbsDelta), ...Object.keys(expectedTotalAbsDelta)]);

  if (intensityResults.length !== scenarioIds.size) {
    return false;
  }

  const resultsByScenarioId = new Map();
  for (const result of intensityResults) {
    if (resultsByScenarioId.has(result.scenarioId)) {
      return false;
    }
    resultsByScenarioId.set(result.scenarioId, result);
  }

  for (const scenarioId of scenarioIds) {
    const result = resultsByScenarioId.get(scenarioId);
    if (!result) {
      return false;
    }
    const currentIntensity = currentTotalAbsDelta[scenarioId] ?? null;
    const expectedIntensity = expectedTotalAbsDelta[scenarioId] ?? null;
    if (
      result.currentTotalAbsDeltaPercent !== currentIntensity ||
      result.expectedTotalAbsDeltaPercent !== expectedIntensity
    ) {
      return false;
    }
    if (result.changed !== (currentIntensity !== expectedIntensity)) {
      return false;
    }
  }
  return true;
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
        isRecordOfStrings(payload.currentSignatures) &&
        isRecordOfStrings(payload.expectedSignatures) &&
        isRecordOfNonNegativeFiniteNumbers(payload.currentTotalAbsDelta) &&
        isRecordOfNonNegativeFiniteNumbers(payload.expectedTotalAbsDelta) &&
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
    hasValidScenarioTuningSignatureResultConsistency(payload) &&
      hasValidScenarioTuningIntensityResultConsistency(payload) &&
    payload.changedCount === changedCount &&
      payload.intensityChangedCount === intensityChangedCount &&
      payload.overallPassed === (changedCount === 0 && intensityChangedCount === 0) &&
      payload.strictIntensityRecommended === (intensityChangedCount > 0) &&
      isSnippetObjectParityValid({
        snippet: payload.snippets?.scenarioTuningBaseline,
        constName: 'EXPECTED_SCENARIO_TUNING_SIGNATURES',
        expectedValue: payload.currentSignatures,
      }) &&
      isSnippetObjectParityValid({
        snippet: payload.snippets?.scenarioTuningTotalAbsDeltaBaseline,
        constName: 'EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA',
        expectedValue: payload.currentTotalAbsDelta,
      }),
  );
}

export function isValidScenarioTuningValidationPayload(payload) {
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.scenarioTuningValidation) &&
        typeof payload.ok === 'boolean' &&
        Array.isArray(payload.errors) &&
        Array.isArray(payload.warnings) &&
        isNonNegativeInteger(payload.issueCount) &&
        isNonNegativeInteger(payload.checkedScenarioCount),
    )
  ) {
    return false;
  }

  const errorsValid = payload.errors.every((entry) =>
    isValidScenarioTuningValidationIssue(entry, 'error'),
  );
  const warningsValid = payload.warnings.every((entry) =>
    isValidScenarioTuningValidationIssue(entry, 'warn'),
  );
  if (!errorsValid || !warningsValid) {
    return false;
  }

  return Boolean(
    payload.issueCount === payload.errors.length + payload.warnings.length &&
      payload.ok === (payload.errors.length === 0),
  );
}

export function isValidScenarioTuningDashboardPayload(payload) {
  if (
    !Boolean(
      hasValidMeta(payload, REPORT_KINDS.scenarioTuningDashboard) &&
        isNonNegativeInteger(payload.scenarioCount) &&
        isNonNegativeInteger(payload.activeScenarioCount) &&
        Array.isArray(payload.scenarios) &&
        payload.scenarios.every(isValidScenarioDashboardEntry),
    )
  ) {
    return false;
  }

  const scenarios = payload.scenarios;
  const activeScenarioCount = scenarios.filter((scenario) => !scenario.isNeutral).length;
  return Boolean(
    payload.scenarioCount === scenarios.length &&
      payload.activeScenarioCount === activeScenarioCount &&
      hasValidDashboardSignatureMap(scenarios, payload.signatureMap) &&
      hasValidDashboardRanking(scenarios, payload.ranking),
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

  const validResults = results.every((result) => isValidReportArtifactResultEntry(result));
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
  const knownStatusKeysOnly = Object.keys(payload.statusCounts).every((status) =>
    KNOWN_REPORT_ARTIFACT_STATUSES.has(status),
  );
  const statusKeySetMatches = Object.keys(payload.statusCounts).length === Object.keys(computedStatusCounts).length;
  const expectedRecommendedActions = buildRecommendedActionsFromResults(results);
  const recommendedActionsMatch = areNormalizedJsonValuesEqual(
    normalizeRecommendedActions(payload.recommendedActions),
    normalizeRecommendedActions(expectedRecommendedActions),
  );

  return Boolean(
    payload.totalChecked === results.length &&
      payload.failureCount === failureCount &&
      payload.overallPassed === (failureCount === 0) &&
      reportedStatusTotal === payload.totalChecked &&
      computedStatusTotal === payload.totalChecked &&
      knownStatusKeysOnly &&
      statusKeySetMatches &&
      statusCountsMatch &&
      recommendedActionsMatch,
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
  const expectedKeys = ['added', 'changed', 'removed', 'unchanged'];
  if (Object.keys(value).length !== expectedKeys.length) {
    return false;
  }
  return expectedKeys.every((key) =>
    isNonNegativeInteger(value[key]),
  );
}

function isValidTrendStatus(value) {
  return value === 'added' || value === 'changed' || value === 'removed' || value === 'unchanged';
}

function isValidScenarioTuningTrendScenarioEntry(entry) {
  if (
    !Boolean(
      entry &&
        typeof entry === 'object' &&
        typeof entry.scenarioId === 'string' &&
        entry.scenarioId.length > 0 &&
        isValidTrendStatus(entry.status) &&
        typeof entry.changed === 'boolean' &&
        typeof entry.signatureChanged === 'boolean' &&
        isNullableString(entry.currentSignature) &&
        isNullableString(entry.baselineSignature) &&
        isNullableFiniteNumber(entry.currentTotalAbsDeltaPercent) &&
        isNullableFiniteNumber(entry.baselineTotalAbsDeltaPercent) &&
        isNullableFiniteNumber(entry.deltaTotalAbsDeltaPercent),
    )
  ) {
    return false;
  }

  const expectedSignatureChanged = entry.currentSignature !== entry.baselineSignature;
  if (entry.signatureChanged !== expectedSignatureChanged) {
    return false;
  }

  if (
    entry.currentTotalAbsDeltaPercent !== null &&
    entry.currentTotalAbsDeltaPercent < 0
  ) {
    return false;
  }
  if (
    entry.baselineTotalAbsDeltaPercent !== null &&
    entry.baselineTotalAbsDeltaPercent < 0
  ) {
    return false;
  }

  const expectedDelta =
    entry.currentTotalAbsDeltaPercent !== null && entry.baselineTotalAbsDeltaPercent !== null
      ? roundToTwo(entry.currentTotalAbsDeltaPercent - entry.baselineTotalAbsDeltaPercent)
      : null;
  if (entry.deltaTotalAbsDeltaPercent !== expectedDelta) {
    return false;
  }

  const intensityChanged = expectedDelta !== null && expectedDelta !== 0;
  const hasCurrent = entry.currentSignature !== null || entry.currentTotalAbsDeltaPercent !== null;
  const hasBaseline = entry.baselineSignature !== null || entry.baselineTotalAbsDeltaPercent !== null;
  const expectedStatus =
    hasCurrent && hasBaseline
      ? expectedSignatureChanged || intensityChanged
        ? 'changed'
        : 'unchanged'
      : hasCurrent
        ? 'added'
        : 'removed';
  if (entry.status !== expectedStatus) {
    return false;
  }

  return entry.changed === (entry.status !== 'unchanged');
}

function hasValidTrendScenarioConsistency(payload) {
  if (!payload || typeof payload !== 'object') {
    return false;
  }
  if (!Array.isArray(payload.scenarios) || !payload.scenarios.every(isValidScenarioTuningTrendScenarioEntry)) {
    return false;
  }

  const scenarioIds = payload.scenarios.map((scenario) => scenario.scenarioId);
  if (new Set(scenarioIds).size !== scenarioIds.length) {
    return false;
  }

  const changedScenarioIds = payload.scenarios
    .filter((scenario) => scenario.changed)
    .map((scenario) => scenario.scenarioId);
  if (
    !Array.isArray(payload.changedScenarioIds) ||
    payload.changedScenarioIds.length !== changedScenarioIds.length ||
    payload.changedScenarioIds.some((scenarioId, index) => scenarioId !== changedScenarioIds[index])
  ) {
    return false;
  }

  const computedStatusCounts = payload.scenarios.reduce(
    (acc, scenario) => {
      acc[scenario.status] += 1;
      return acc;
    },
    { added: 0, changed: 0, removed: 0, unchanged: 0 },
  );
  if (
    computedStatusCounts.added !== payload.statusCounts?.added ||
    computedStatusCounts.changed !== payload.statusCounts?.changed ||
    computedStatusCounts.removed !== payload.statusCounts?.removed ||
    computedStatusCounts.unchanged !== payload.statusCounts?.unchanged
  ) {
    return false;
  }

  const addedCount = computedStatusCounts.added;
  const changedStatusCount = computedStatusCounts.changed;
  const removedCount = computedStatusCounts.removed;
  const unchangedStatusCount = computedStatusCounts.unchanged;
  const changedByStatus = addedCount + changedStatusCount + removedCount;
  const totalByStatus = changedByStatus + unchangedStatusCount;

  const scenarioCount = payload.scenarios.length;
  const changedCount = changedScenarioIds.length;

  return (
    payload.scenarioCount === scenarioCount &&
    payload.changedCount === changedCount &&
    payload.unchangedCount === unchangedStatusCount &&
    payload.scenarioCount === payload.changedCount + payload.unchangedCount &&
    payload.changedCount === changedByStatus &&
    payload.scenarioCount === totalByStatus &&
    payload.hasChanges === (payload.changedCount > 0)
  );
}

export function isValidScenarioTuningTrendPayload(payload) {
  return Boolean(
    hasValidMeta(payload, REPORT_KINDS.scenarioTuningTrend) &&
      isKnownTrendComparisonSource(payload.comparisonSource) &&
      (typeof payload.baselineReference === 'string' || payload.baselineReference === null) &&
      typeof payload.hasBaselineDashboard === 'boolean' &&
      payload.hasBaselineDashboard === (payload.baselineScenarioCount > 0) &&
      isNonNegativeInteger(payload.baselineScenarioCount) &&
      isNonNegativeInteger(payload.scenarioCount) &&
      isNonNegativeInteger(payload.changedCount) &&
      isNonNegativeInteger(payload.unchangedCount) &&
      typeof payload.hasChanges === 'boolean' &&
      isValidTrendStatusCounts(payload.statusCounts) &&
      Array.isArray(payload.changedScenarioIds) &&
      payload.changedScenarioIds.every((scenarioId) => typeof scenarioId === 'string') &&
      hasValidTrendScenarioConsistency(payload),
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
