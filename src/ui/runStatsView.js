export function buildMetricsSummaryRows(metrics) {
  return [
    { label: 'Peak Population', value: metrics.peakPopulation },
    { label: 'Built Structures', value: metrics.buildingsConstructed },
    { label: 'Research Completed', value: metrics.researchCompleted },
    { label: 'Objectives Completed', value: metrics.objectivesCompleted },
    { label: 'Deaths', value: metrics.deaths },
  ];
}

export function getLatestInvariantWarning(debugState) {
  return debugState?.invariantViolations?.at?.(-1) ?? null;
}

export function getRecentRunHistory(runSummaryHistory, limit = 3) {
  return [...(runSummaryHistory ?? [])].slice(-limit).reverse();
}

export function getRunOutcomeLabel(outcome) {
  return outcome === 'won' ? 'Victory' : 'Defeat';
}

