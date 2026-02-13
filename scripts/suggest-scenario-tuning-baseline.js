import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EXPECTED_SCENARIO_TUNING_SIGNATURES } from '../src/content/scenarioTuningBaseline.js';
import {
  buildScenarioTuningBaselineSuggestionMarkdown,
  buildScenarioTuningBaselineSuggestionPayload,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';

const outputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';
const markdownOutputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_MD_PATH ??
  'reports/scenario-tuning-baseline-suggestions.md';

const payload = buildScenarioTuningBaselineSuggestionPayload({
  scenarios: SCENARIO_DEFINITIONS,
  expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
});
const summary = getScenarioTuningBaselineChangeSummary(payload);
const markdown = buildScenarioTuningBaselineSuggestionMarkdown(payload);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      ...payload,
    },
    null,
    2,
  ),
  'utf-8',
);
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(`Scenario tuning baseline suggestions written to: ${outputPath}`);
console.log(`Scenario tuning baseline suggestions markdown written to: ${markdownOutputPath}`);
console.log(`Changed signatures detected: ${summary.changedSignatures}`);
