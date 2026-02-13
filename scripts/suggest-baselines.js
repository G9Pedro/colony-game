import {
  buildBaselineSuggestionMarkdown,
} from '../src/game/baselineSuggestion.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { buildBaselineSuggestionPayloadFromSimulations } from './baselineSuggestionRuntime.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from './reportPayloadOutput.js';

const outputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const markdownOutputPath = process.env.SIM_BASELINE_SUGGEST_MD_PATH ?? 'reports/baseline-suggestions.md';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';

const baselinePayload = buildBaselineSuggestionPayloadFromSimulations({
  driftRuns,
  strategyProfileId,
});
const payload = buildValidatedReportPayload(
  REPORT_KINDS.baselineSuggestions,
  baselinePayload,
  'baseline suggestion',
);

await writeJsonArtifact(outputPath, payload);

const markdown = buildBaselineSuggestionMarkdown(payload);
await writeTextArtifact(markdownOutputPath, markdown);

console.log(`Baseline suggestions written to: ${outputPath}`);
console.log(`Baseline suggestions markdown written to: ${markdownOutputPath}`);
const changedCount = payload.snapshotDelta.filter((item) => item.changed).length;
console.log(`Changed snapshot signatures detected: ${changedCount}`);
