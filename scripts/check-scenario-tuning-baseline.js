import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EXPECTED_SCENARIO_TUNING_SIGNATURES } from '../src/content/scenarioTuningBaseline.js';
import { buildScenarioTuningBaselineReport } from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';

const outputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_CHECK_PATH ?? 'reports/scenario-tuning-baseline-check.json';

const report = buildScenarioTuningBaselineReport({
  scenarios: SCENARIO_DEFINITIONS,
  expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(
  outputPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      ...report,
    },
    null,
    2,
  ),
  'utf-8',
);

report.results.forEach((result) => {
  const status = result.changed ? 'changed' : 'ok';
  console.log(`[${result.scenarioId}] ${status}: ${result.currentSignature}`);
  if (result.changed) {
    console.error(`  - ${result.message}`);
  }
});

console.log(`Scenario tuning baseline report written to: ${outputPath}`);
console.log(`Changed signatures detected: ${report.changedCount}`);

if (!report.overallPassed) {
  process.exit(1);
}
