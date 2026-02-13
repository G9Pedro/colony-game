import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import { buildScenarioTuningDashboard } from '../src/content/scenarioTuningDashboard.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { buildValidatedReportPayload } from './reportPayloadOutput.js';

const outputPath =
  process.env.SIM_SCENARIO_TUNING_DASHBOARD_BASELINE_PATH ??
  'reports/scenario-tuning-dashboard.baseline.json';

const dashboard = buildScenarioTuningDashboard(SCENARIO_DEFINITIONS);
const payload = buildValidatedReportPayload(
  REPORT_KINDS.scenarioTuningDashboard,
  dashboard,
  'scenario tuning dashboard baseline',
);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

console.log(
  `Scenario tuning dashboard baseline captured: scenarios=${payload.scenarioCount}, active=${payload.activeScenarioCount}`,
);
console.log(`Scenario tuning dashboard baseline written to: ${outputPath}`);
