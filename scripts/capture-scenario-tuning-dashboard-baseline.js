import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import { buildScenarioTuningDashboard } from '../src/content/scenarioTuningDashboard.js';
import {
  REPORT_KINDS,
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

const outputPath =
  process.env.SIM_SCENARIO_TUNING_DASHBOARD_BASELINE_PATH ??
  'reports/scenario-tuning-dashboard.baseline.json';

const dashboard = buildScenarioTuningDashboard(SCENARIO_DEFINITIONS);
const payload = withReportMeta(REPORT_KINDS.scenarioTuningDashboard, dashboard);
const payloadValidation = validateReportPayloadByKind(REPORT_KINDS.scenarioTuningDashboard, payload);
if (!payloadValidation.ok) {
  console.error(
    `Unable to build valid scenario tuning dashboard baseline payload: ${payloadValidation.reason}`,
  );
  process.exit(1);
}

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');

console.log(
  `Scenario tuning dashboard baseline captured: scenarios=${payload.scenarioCount}, active=${payload.activeScenarioCount}`,
);
console.log(`Scenario tuning dashboard baseline written to: ${outputPath}`);
