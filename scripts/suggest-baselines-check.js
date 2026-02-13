import { readFile } from 'node:fs/promises';
import { getBaselineChangeSummary } from '../src/game/baselineSuggestion.js';

const inputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';

const payload = JSON.parse(await readFile(inputPath, 'utf-8'));
const summary = getBaselineChangeSummary(payload);

console.log(
  `Baseline change summary: aggregateChangedMetrics=${summary.aggregateChangedMetrics}, snapshotChangedKeys=${summary.snapshotChangedKeys}`,
);

if (summary.hasChanges) {
  console.error('Baseline drift detected. Re-baseline intentionally if this is expected.');
  process.exit(1);
}
