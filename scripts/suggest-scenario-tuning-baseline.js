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
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from './reportPayloadOutput.js';

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
const payload = buildValidatedReportPayload(
  REPORT_KINDS.scenarioTuningBaselineSuggestions,
  suggestionPayload,
  'scenario tuning baseline suggestion',
);
const summary = getScenarioTuningBaselineChangeSummary(payload);
const markdown = buildScenarioTuningBaselineSuggestionMarkdown(payload);

await writeJsonArtifact(outputPath, payload);
await writeTextArtifact(markdownOutputPath, markdown);

console.log(`Scenario tuning baseline suggestions written to: ${outputPath}`);
console.log(`Scenario tuning baseline suggestions markdown written to: ${markdownOutputPath}`);
console.log(`Changed signatures detected: ${summary.changedSignatures}`);
console.log(`Changed total |delta| baselines detected: ${summary.changedTotalAbsDelta}`);
if (payload.strictIntensityRecommended) {
  console.log(`Strict intensity enforcement recommendation: ${payload.strictIntensityCommand}`);
}
