import { AGGREGATE_BASELINE_BOUNDS } from '../src/content/regressionBaseline.js';
import {
  EXPECTED_SUMMARY_SIGNATURES,
  SNAPSHOT_CASES,
} from '../src/content/regressionSnapshots.js';
import { buildBaselineSuggestionPayload } from '../src/game/baselineSuggestion.js';
import {
  buildAggregateRegressionReport,
  buildSnapshotRegressionReport,
} from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

export function buildBaselineSuggestionPayloadFromSimulations({
  driftRuns = 8,
  strategyProfileId = 'baseline',
}) {
  const driftSummaries = [];
  for (const scenarioId of Object.keys(AGGREGATE_BASELINE_BOUNDS)) {
    for (let index = 0; index < driftRuns; index += 1) {
      driftSummaries.push(
        runStrategy(scenarioId, `suggest-${scenarioId}-${index}`, { strategyProfileId }),
      );
    }
  }

  const aggregateReport = buildAggregateRegressionReport({
    summaries: driftSummaries,
    baselineBounds: AGGREGATE_BASELINE_BOUNDS,
  });

  const snapshotSummaries = SNAPSHOT_CASES.map((snapshotCase) =>
    runStrategy(snapshotCase.scenarioId, snapshotCase.seed, {
      balanceProfileId: snapshotCase.balanceProfileId,
      strategyProfileId,
    }),
  );
  const snapshotReport = buildSnapshotRegressionReport({
    summaries: snapshotSummaries,
    expectedSignatures: {},
  });

  return buildBaselineSuggestionPayload({
    currentAggregateBounds: AGGREGATE_BASELINE_BOUNDS,
    currentSnapshotSignatures: EXPECTED_SUMMARY_SIGNATURES,
    aggregateReport,
    snapshotReport,
    driftRuns,
  });
}
