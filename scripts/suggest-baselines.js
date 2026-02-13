import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AGGREGATE_BASELINE_BOUNDS } from '../src/content/regressionBaseline.js';
import {
  EXPECTED_SUMMARY_SIGNATURES,
  SNAPSHOT_CASES,
} from '../src/content/regressionSnapshots.js';
import {
  buildAggregateBoundsDelta,
  buildSnapshotSignatureDelta,
  buildSuggestedAggregateBounds,
  buildSnapshotSignatureMap,
  formatAggregateBoundsSnippet,
  formatSnapshotSignaturesSnippet,
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

const suggestions = {
  generatedAt: new Date().toISOString(),
  driftRuns,
  suggestedAggregateBounds: buildSuggestedAggregateBounds(aggregateReport),
  suggestedSnapshotSignatures: buildSnapshotSignatureMap(snapshotReport),
};

const aggregateDelta = buildAggregateBoundsDelta(
  AGGREGATE_BASELINE_BOUNDS,
  suggestions.suggestedAggregateBounds,
);
const snapshotDelta = buildSnapshotSignatureDelta(
  EXPECTED_SUMMARY_SIGNATURES,
  suggestions.suggestedSnapshotSignatures,
);

const payload = {
  ...suggestions,
  currentAggregateBounds: AGGREGATE_BASELINE_BOUNDS,
  currentSnapshotSignatures: EXPECTED_SUMMARY_SIGNATURES,
  aggregateDelta,
  snapshotDelta,
  snippets: {
    regressionBaseline: formatAggregateBoundsSnippet(suggestions.suggestedAggregateBounds),
    regressionSnapshots: formatSnapshotSignaturesSnippet(suggestions.suggestedSnapshotSignatures),
  },
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

const changedSnapshotCount = snapshotDelta.filter((item) => item.changed).length;
const markdown = `# Baseline Suggestions

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
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(`Baseline suggestions written to: ${outputPath}`);
console.log(`Baseline suggestions markdown written to: ${markdownOutputPath}`);
