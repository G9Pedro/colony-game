export const DEFAULT_REGRESSION_EXPECTATIONS = {
  frontier: {
    requiredStatus: 'playing',
    minAlivePopulation: 7,
    minBuildings: 8,
    requiredResearch: [],
  },
  prosperous: {
    requiredStatus: 'playing',
    minAlivePopulation: 9,
    minBuildings: 9,
    requiredResearch: ['masonry'],
  },
  harsh: {
    requiredStatus: 'playing',
    minAlivePopulation: 6,
    minBuildings: 7,
    requiredResearch: [],
  },
};

export function evaluateSimulationSummary(summary, expected) {
  const failures = [];
  if (summary.status !== expected.requiredStatus) {
    failures.push(`status expected "${expected.requiredStatus}" but was "${summary.status}"`);
  }
  if (summary.alivePopulation < expected.minAlivePopulation) {
    failures.push(`alive population expected >= ${expected.minAlivePopulation}, got ${summary.alivePopulation}`);
  }
  if (summary.buildings < expected.minBuildings) {
    failures.push(`building count expected >= ${expected.minBuildings}, got ${summary.buildings}`);
  }
  for (const researchId of expected.requiredResearch) {
    if (!summary.completedResearch.includes(researchId)) {
      failures.push(`required research "${researchId}" missing`);
    }
  }
  return failures;
}

export function buildRegressionReport({
  summaries,
  expectations = DEFAULT_REGRESSION_EXPECTATIONS,
  seedPrefix = 'assert',
}) {
  const results = summaries.map((summary) => {
    const expected = expectations[summary.scenarioId];
    const failures = expected ? evaluateSimulationSummary(summary, expected) : ['No expectation configured'];
    return {
      scenarioId: summary.scenarioId,
      seed: summary.seed ?? `${seedPrefix}-${summary.scenarioId}`,
      summary,
      failures,
      passed: failures.length === 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    overallPassed: results.every((result) => result.passed),
    results,
  };
}

function mean(values) {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function computeScenarioAggregateMetrics(summaries) {
  return {
    runCount: summaries.length,
    alivePopulationMean: Number(mean(summaries.map((summary) => summary.alivePopulation)).toFixed(4)),
    buildingsMean: Number(mean(summaries.map((summary) => summary.buildings)).toFixed(4)),
    dayMean: Number(mean(summaries.map((summary) => summary.day)).toFixed(4)),
    survivalRate: Number(
      mean(summaries.map((summary) => (summary.status === 'playing' || summary.status === 'won' ? 1 : 0))).toFixed(
        4,
      ),
    ),
    masonryCompletionRate: Number(
      mean(
        summaries.map((summary) => (summary.completedResearch.includes('masonry') ? 1 : 0)),
      ).toFixed(4),
    ),
  };
}

function evaluateBounds(metrics, expectedBounds) {
  const failures = [];
  for (const [metricKey, bounds] of Object.entries(expectedBounds)) {
    const value = metrics[metricKey];
    if (typeof value !== 'number') {
      failures.push(`metric "${metricKey}" missing`);
      continue;
    }
    if (value < bounds.min || value > bounds.max) {
      failures.push(
        `metric "${metricKey}" expected ${bounds.min}..${bounds.max}, got ${value}`,
      );
    }
  }
  return failures;
}

export function buildAggregateRegressionReport({
  summaries,
  baselineBounds,
}) {
  const grouped = summaries.reduce((acc, summary) => {
    if (!acc[summary.scenarioId]) {
      acc[summary.scenarioId] = [];
    }
    acc[summary.scenarioId].push(summary);
    return acc;
  }, {});

  const scenarioResults = Object.entries(grouped).map(([scenarioId, scenarioSummaries]) => {
    const metrics = computeScenarioAggregateMetrics(scenarioSummaries);
    const bounds = baselineBounds[scenarioId];
    const failures = bounds ? evaluateBounds(metrics, bounds) : ['No baseline configured'];
    return {
      scenarioId,
      metrics,
      failures,
      passed: failures.length === 0,
    };
  });

  return {
    generatedAt: new Date().toISOString(),
    overallPassed: scenarioResults.every((result) => result.passed),
    scenarioResults,
  };
}
