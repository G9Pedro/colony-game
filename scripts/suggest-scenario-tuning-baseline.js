import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  EXPECTED_SCENARIO_TUNING_SIGNATURES,
  EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
} from '../src/content/scenarioTuningBaseline.js';
import {
  buildScenarioTuningBaselineSuggestionMarkdown,
  buildScenarioTuningBaselineSuggestionPayload,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import {
  REPORT_KINDS,
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

const outputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';
const markdownOutputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_MD_PATH ??
  'reports/scenario-tuning-baseline-suggestions.md';

const suggestionPayload = buildScenarioTuningBaselineSuggestionPayload({
  scenarios: SCENARIO_DEFINITIONS,
  expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
  expectedTotalAbsDelta: EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
});
const payload = withReportMeta(REPORT_KINDS.scenarioTuningBaselineSuggestions, suggestionPayload);
const payloadValidation = validateReportPayloadByKind(
  REPORT_KINDS.scenarioTuningBaselineSuggestions,
  payload,
);
if (!payloadValidation.ok) {
  console.error(
    `Unable to build valid scenario tuning baseline suggestion payload: ${payloadValidation.reason}`,
  );
  process.exit(1);
}
const summary = getScenarioTuningBaselineChangeSummary(payload);
const markdown = buildScenarioTuningBaselineSuggestionMarkdown(payload);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(payload, null, 2),
  'utf-8',
);
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(`Scenario tuning baseline suggestions written to: ${outputPath}`);
console.log(`Scenario tuning baseline suggestions markdown written to: ${markdownOutputPath}`);
console.log(`Changed signatures detected: ${summary.changedSignatures}`);
console.log(`Changed total |delta| baselines detected: ${summary.changedTotalAbsDelta}`);
if (payload.strictIntensityRecommended) {
  console.log(`Strict intensity enforcement recommendation: ${payload.strictIntensityCommand}`);
}
