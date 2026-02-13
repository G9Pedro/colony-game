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
