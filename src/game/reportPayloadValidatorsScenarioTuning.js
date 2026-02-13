import { REPORT_KINDS, hasValidMeta } from './reportPayloadMeta.js';
import {
  isNonNegativeInteger,
  isNullableFiniteNumber,
  isNullableString,
  isPlainRecord,
  isRecordOfNonNegativeFiniteNumbers,
  isRecordOfNumbers,
  isRecordOfStrings,
  isSnippetObjectParityValid,
  roundToTwo,
} from './reportPayloadValidatorUtils.js';

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

function isSortedDashboardDeltaEntries(entries) {
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1];
    const current = entries[index];
    if (previous.absDeltaPercent < current.absDeltaPercent) {
      return false;
    }
    if (
      previous.absDeltaPercent === current.absDeltaPercent &&
      previous.key.localeCompare(current.key) > 0
    ) {
      return false;
    }
  }
  return true;
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
    !isSortedDashboardDeltaEntries(entry.resourceOutputDeltas) ||
    !isSortedDashboardDeltaEntries(entry.jobOutputDeltas) ||
    !isSortedDashboardDeltaEntries(entry.jobPriorityDeltas)
  ) {
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

function isKnownTrendComparisonSource(value) {
  return value === 'dashboard' || value === 'signature-baseline';
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
