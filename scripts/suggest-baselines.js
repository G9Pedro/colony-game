import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AGGREGATE_BASELINE_BOUNDS } from '../src/content/regressionBaseline.js';
import {
  EXPECTED_SUMMARY_SIGNATURES,
  SNAPSHOT_CASES,
} from '../src/content/regressionSnapshots.js';
import {
  buildBaselineSuggestionMarkdown,
  buildBaselineSuggestionPayload,
} from '../src/game/baselineSuggestion.js';
import {
  buildAggregateRegressionReport,
  buildSnapshotRegressionReport,
} from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const markdownOutputPath = process.env.SIM_BASELINE_SUGGEST_MD_PATH ?? 'reports/baseline-suggestions.md';
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

const payload = buildBaselineSuggestionPayload({
  currentAggregateBounds: AGGREGATE_BASELINE_BOUNDS,
  currentSnapshotSignatures: EXPECTED_SUMMARY_SIGNATURES,
  aggregateReport,
  snapshotReport,
  driftRuns,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

const markdown = buildBaselineSuggestionMarkdown(payload);
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(`Baseline suggestions written to: ${outputPath}`);
console.log(`Baseline suggestions markdown written to: ${markdownOutputPath}`);
const changedCount = payload.snapshotDelta.filter((item) => item.changed).length;
console.log(`Changed snapshot signatures detected: ${changedCount}`);
