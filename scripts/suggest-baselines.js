import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  buildBaselineSuggestionMarkdown,
} from '../src/game/baselineSuggestion.js';
import { buildBaselineSuggestionPayloadFromSimulations } from './baselineSuggestionRuntime.js';

const outputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const markdownOutputPath = process.env.SIM_BASELINE_SUGGEST_MD_PATH ?? 'reports/baseline-suggestions.md';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';

const payload = buildBaselineSuggestionPayloadFromSimulations({
  driftRuns,
  strategyProfileId,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

const markdown = buildBaselineSuggestionMarkdown(payload);
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(`Baseline suggestions written to: ${outputPath}`);
console.log(`Baseline suggestions markdown written to: ${markdownOutputPath}`);
const changedCount = payload.snapshotDelta.filter((item) => item.changed).length;
console.log(`Changed snapshot signatures detected: ${changedCount}`);
