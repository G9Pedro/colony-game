import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import { validateScenarioTuningDefinitions } from '../src/content/scenarioTuningValidation.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { buildValidatedReportPayload } from './reportPayloadOutput.js';

const outputPath = process.env.SIM_SCENARIO_TUNING_REPORT_PATH ?? 'reports/scenario-tuning-validation.json';
const treatWarningsAsErrors = process.env.SIM_SCENARIO_TUNING_WARN_AS_ERROR === '1';

const result = validateScenarioTuningDefinitions(SCENARIO_DEFINITIONS);
const payload = buildValidatedReportPayload(
  REPORT_KINDS.scenarioTuningValidation,
  result,
  'scenario tuning validation',
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

console.log(
  `Scenario tuning validation: scenarios=${result.checkedScenarioCount}, errors=${result.errors.length}, warnings=${result.warnings.length}`,
);
console.log(`Scenario tuning validation report written to: ${outputPath}`);

result.warnings.forEach((warning) => {
  console.warn(`[warn] [${warning.scenarioId}] ${warning.path} - ${warning.message}`);
});
result.errors.forEach((error) => {
  console.error(`[error] [${error.scenarioId}] ${error.path} - ${error.message}`);
});

if (!result.ok || (treatWarningsAsErrors && result.warnings.length > 0)) {
  process.exit(1);
}
