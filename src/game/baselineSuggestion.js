const DEFAULT_TOLERANCE = {
  alivePopulationMean: 0.1,
  buildingsMean: 0.1,
  dayMean: 0.1,
  survivalRate: 0,
  masonryCompletionRate: 0,
};

function round(value) {
  return Number(value.toFixed(4));
}

function isPlainObject(value) {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function sortObjectKeys(value) {
  if (Array.isArray(value)) {
    return value.map((item) => sortObjectKeys(item));
  }
  if (!isPlainObject(value)) {
    return value;
  }

  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = sortObjectKeys(value[key]);
    });
  return sorted;
}

export function buildSuggestedBoundsFromMetrics(metrics, toleranceConfig = DEFAULT_TOLERANCE) {
  const bounds = {};
  for (const [metricKey, value] of Object.entries(metrics)) {
    if (metricKey === 'runCount') {
      continue;
    }
    if (typeof value !== 'number') {
      continue;
    }
    const tolerance = toleranceConfig[metricKey] ?? 0;
    bounds[metricKey] = {
      min: round(value - tolerance),
      max: round(value + tolerance),
    };
  }
  return bounds;
}

export function buildSuggestedAggregateBounds(aggregateReport, toleranceConfig = DEFAULT_TOLERANCE) {
  const suggested = {};
  for (const result of aggregateReport.scenarioResults ?? []) {
    suggested[result.scenarioId] = buildSuggestedBoundsFromMetrics(result.metrics, toleranceConfig);
  }
  return suggested;
}

export function buildSnapshotSignatureMap(snapshotReport) {
  const signatures = {};
  for (const result of snapshotReport.results ?? []) {
    signatures[result.key] = result.signature;
  }
  return signatures;
}

export function buildAggregateBoundsDelta(currentBounds, suggestedBounds) {
  const delta = {};
  const scenarioIds = Array.from(
    new Set([...Object.keys(currentBounds ?? {}), ...Object.keys(suggestedBounds ?? {})]),
  ).sort((a, b) => a.localeCompare(b));

  for (const scenarioId of scenarioIds) {
    const currentScenarioBounds = currentBounds?.[scenarioId] ?? {};
    const suggestedScenarioBounds = suggestedBounds?.[scenarioId] ?? {};
    const metricKeys = Array.from(
      new Set([
        ...Object.keys(currentScenarioBounds),
        ...Object.keys(suggestedScenarioBounds),
      ]),
    ).sort((a, b) => a.localeCompare(b));

    delta[scenarioId] = {};
    for (const metricKey of metricKeys) {
      const currentMetric = currentScenarioBounds[metricKey];
      const suggestedMetric = suggestedScenarioBounds[metricKey];
      if (!currentMetric || !suggestedMetric) {
        delta[scenarioId][metricKey] = {
          changed: true,
          from: currentMetric ?? null,
          to: suggestedMetric ?? null,
        };
        continue;
      }

      const minDelta = round((suggestedMetric.min ?? 0) - (currentMetric.min ?? 0));
      const maxDelta = round((suggestedMetric.max ?? 0) - (currentMetric.max ?? 0));
      delta[scenarioId][metricKey] = {
        changed: minDelta !== 0 || maxDelta !== 0,
        minDelta,
        maxDelta,
      };
    }
  }

  return delta;
}

export function buildSnapshotSignatureDelta(currentSignatures, suggestedSignatures) {
  const keySet = new Set([
    ...Object.keys(currentSignatures ?? {}),
    ...Object.keys(suggestedSignatures ?? {}),
  ]);
  const changes = [];
  for (const key of Array.from(keySet).sort((a, b) => a.localeCompare(b))) {
    const from = currentSignatures?.[key] ?? null;
    const to = suggestedSignatures?.[key] ?? null;
    changes.push({
      key,
      changed: from !== to,
      from,
      to,
    });
  }
  return changes;
}

export function formatAggregateBoundsSnippet(bounds) {
  const sorted = sortObjectKeys(bounds);
  return `export const AGGREGATE_BASELINE_BOUNDS = ${JSON.stringify(sorted, null, 2)};\n`;
}

export function formatSnapshotSignaturesSnippet(signatures) {
  const sorted = sortObjectKeys(signatures);
  return `export const EXPECTED_SUMMARY_SIGNATURES = ${JSON.stringify(sorted, null, 2)};\n`;
}

export function buildBaselineSuggestionPayload({
  currentAggregateBounds,
  currentSnapshotSignatures,
  aggregateReport,
  snapshotReport,
  driftRuns,
}) {
  const suggestedAggregateBounds = buildSuggestedAggregateBounds(aggregateReport);
  const suggestedSnapshotSignatures = buildSnapshotSignatureMap(snapshotReport);
  const aggregateDelta = buildAggregateBoundsDelta(
    currentAggregateBounds,
    suggestedAggregateBounds,
  );
  const snapshotDelta = buildSnapshotSignatureDelta(
    currentSnapshotSignatures,
    suggestedSnapshotSignatures,
  );

  return {
    generatedAt: new Date().toISOString(),
    driftRuns,
    suggestedAggregateBounds,
    suggestedSnapshotSignatures,
    currentAggregateBounds,
    currentSnapshotSignatures,
    aggregateDelta,
    snapshotDelta,
    snippets: {
      regressionBaseline: formatAggregateBoundsSnippet(suggestedAggregateBounds),
      regressionSnapshots: formatSnapshotSignaturesSnippet(suggestedSnapshotSignatures),
    },
  };
}

export function buildBaselineSuggestionMarkdown(payload) {
  const changedSnapshotCount = payload.snapshotDelta.filter((item) => item.changed).length;
  return `# Baseline Suggestions

- Generated At: ${payload.generatedAt}
- Drift Runs: ${payload.driftRuns}
- Changed Snapshot Signatures: ${changedSnapshotCount}

## Suggested Aggregate Bounds

\`\`\`js
${payload.snippets.regressionBaseline.trim()}
\`\`\`

## Suggested Snapshot Signatures

\`\`\`js
${payload.snippets.regressionSnapshots.trim()}
\`\`\`
`;
}

export function getBaselineChangeSummary(payload) {
  let aggregateChangedMetrics = 0;
  for (const scenarioEntry of Object.values(payload.aggregateDelta ?? {})) {
    for (const metricEntry of Object.values(scenarioEntry ?? {})) {
      if (metricEntry?.changed) {
        aggregateChangedMetrics += 1;
      }
    }
  }

  const snapshotChangedKeys = (payload.snapshotDelta ?? []).filter((item) => item.changed).length;
  return {
    aggregateChangedMetrics,
    snapshotChangedKeys,
    hasChanges: aggregateChangedMetrics > 0 || snapshotChangedKeys > 0,
  };
}
