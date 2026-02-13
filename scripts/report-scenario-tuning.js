import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import {
  buildScenarioTuningDashboard,
  buildScenarioTuningDashboardMarkdown,
} from '../src/content/scenarioTuningDashboard.js';
import { REPORT_KINDS } from '../src/game/reportPayloadValidators.js';
import { buildValidatedReportPayload } from './reportPayloadOutput.js';

const outputPath = process.env.SIM_SCENARIO_TUNING_DASHBOARD_PATH ?? 'reports/scenario-tuning-dashboard.json';
const markdownOutputPath =
  process.env.SIM_SCENARIO_TUNING_DASHBOARD_MD_PATH ?? 'reports/scenario-tuning-dashboard.md';

const dashboard = buildScenarioTuningDashboard(SCENARIO_DEFINITIONS);
const payload = buildValidatedReportPayload(
  REPORT_KINDS.scenarioTuningDashboard,
  dashboard,
  'scenario tuning dashboard',
);
const markdown = buildScenarioTuningDashboardMarkdown(payload);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(
  `Scenario tuning dashboard generated: scenarios=${payload.scenarioCount}, active=${payload.activeScenarioCount}`,
);
console.log(`Scenario tuning dashboard JSON written to: ${outputPath}`);
console.log(`Scenario tuning dashboard markdown written to: ${markdownOutputPath}`);
