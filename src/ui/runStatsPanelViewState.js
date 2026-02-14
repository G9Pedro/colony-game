import {
  buildMetricsSummaryRows,
  getLatestInvariantWarning,
  getRecentRunHistory,
  getRunOutcomeLabel,
} from './runStatsView.js';

export function buildRunStatsPanelViewModel(state, historyLimit = 3) {
  const metricsRows = buildMetricsSummaryRows(state.metrics);
  const latestViolation = getLatestInvariantWarning(state.debug);
  const warningMessage = latestViolation
    ? `Invariant warning: ${latestViolation.message}`
    : null;
  const historyRows = getRecentRunHistory(state.runSummaryHistory, historyLimit).map((run) => ({
    id: run.id ?? `${run.scenarioId}:${run.day}`,
    outcomeLabel: getRunOutcomeLabel(run.outcome),
    dayLabel: `Day ${run.day}`,
    summary: `${run.scenarioId}/${run.balanceProfileId ?? 'standard'} · peak ${run.peakPopulation} · ${run.buildingsConstructed} builds`,
  }));

  return {
    metricsRows,
    warningMessage,
    historyRows,
  };
}

