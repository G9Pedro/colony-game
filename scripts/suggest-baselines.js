import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AGGREGATE_BASELINE_BOUNDS } from '../src/content/regressionBaseline.js';
import { SNAPSHOT_CASES } from '../src/content/regressionSnapshots.js';
import {
  buildSuggestedAggregateBounds,
  buildSnapshotSignatureMap,
} from '../src/game/baselineSuggestion.js';
import {
  buildAggregateRegressionReport,
  buildSnapshotRegressionReport,
} from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);

const driftSummaries = [];
for (const scenarioId of Object.keys(AGGREGATE_BASELINE_BOUNDS)) {
  for (let index = 0; index < driftRuns; index += 1) {
    driftSummaries.push(
      runStrategy(scenarioId, `suggest-${scenarioId}-${index}`),
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
  }),
);
const snapshotReport = buildSnapshotRegressionReport({
  summaries: snapshotSummaries,
  expectedSignatures: {},
});

const suggestions = {
  generatedAt: new Date().toISOString(),
  driftRuns,
  suggestedAggregateBounds: buildSuggestedAggregateBounds(aggregateReport),
  suggestedSnapshotSignatures: buildSnapshotSignatureMap(snapshotReport),
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(suggestions, null, 2), 'utf-8');

console.log(`Baseline suggestions written to: ${outputPath}`);
