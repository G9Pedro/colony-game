import { readFile } from 'node:fs/promises';
import { getScenarioTuningBaselineChangeSummary } from '../src/content/scenarioTuningBaselineCheck.js';

const inputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';

const payload = JSON.parse(await readFile(inputPath, 'utf-8'));
const summary = getScenarioTuningBaselineChangeSummary(payload);

console.log(
  `Scenario tuning baseline summary: changedSignatures=${summary.changedSignatures}`,
);

if (summary.hasChanges) {
  console.error('Scenario tuning baseline drift detected. Re-baseline intentionally if expected.');
  process.exit(1);
}
