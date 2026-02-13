import { REPORT_KINDS, hasValidMeta } from './reportPayloadMeta.js';
import {
  isNonNegativeInteger,
  isNullableString,
  isPlainRecord,
  isRecordOfNullableStrings,
  isSnippetObjectParityValid,
  roundToFour,
} from './reportPayloadValidatorUtils.js';

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
  let previousKey = null;

  for (const entry of snapshotDelta) {
    if (!entry || typeof entry !== 'object' || typeof entry.key !== 'string' || entry.key.length === 0) {
      return false;
    }
    if (previousKey !== null && previousKey.localeCompare(entry.key) > 0) {
      return false;
    }
    previousKey = entry.key;
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
