import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import {
  EXPECTED_SCENARIO_TUNING_SIGNATURES,
  EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
} from '../src/content/scenarioTuningBaseline.js';
import { buildScenarioTuningDashboard } from '../src/content/scenarioTuningDashboard.js';
import {
  buildScenarioTuningTrendMarkdown,
  buildScenarioTuningTrendReport,
} from '../src/content/scenarioTuningTrend.js';
import {
  REPORT_KINDS,
} from '../src/game/reportPayloadValidators.js';
import { readValidatedReportArtifact } from './reportPayloadInput.js';
import {
  buildValidatedReportPayload,
  writeJsonArtifact,
  writeTextArtifact,
} from './reportPayloadOutput.js';

const outputPath = process.env.SIM_SCENARIO_TUNING_TREND_PATH ?? 'reports/scenario-tuning-trend.json';
const markdownOutputPath =
  process.env.SIM_SCENARIO_TUNING_TREND_MD_PATH ?? 'reports/scenario-tuning-trend.md';
const baselineDashboardPath =
  process.env.SIM_SCENARIO_TUNING_TREND_BASELINE_PATH ?? 'reports/scenario-tuning-dashboard.baseline.json';
const BASELINE_CAPTURE_COMMAND = 'npm run simulate:capture:tuning-dashboard-baseline';

const currentDashboard = buildScenarioTuningDashboard(SCENARIO_DEFINITIONS);

let comparisonSource = 'signature-baseline';
let baselineReference = 'src/content/scenarioTuningBaseline.js';
let baselineDashboard = null;

try {
  const baselineDashboardResult = await readValidatedReportArtifact({
    path: baselineDashboardPath,
    kind: REPORT_KINDS.scenarioTuningDashboard,
  });
  if (baselineDashboardResult.ok) {
    comparisonSource = 'dashboard';
    baselineReference = baselineDashboardPath;
    baselineDashboard = baselineDashboardResult.payload;
  } else if (baselineDashboardResult.status === 'invalid') {
    console.warn(
      `Baseline dashboard payload at ${baselineDashboardPath} is invalid (${baselineDashboardResult.message}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
  } else if (baselineDashboardResult.status === 'missing') {
    console.log(
      `Baseline dashboard not found at ${baselineDashboardPath}; using signature baseline comparison. To create one, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
  } else {
    const label =
      baselineDashboardResult.status === 'invalid-json'
        ? 'invalid JSON'
        : baselineDashboardResult.errorCode ?? baselineDashboardResult.message;
    console.warn(
      `Unable to read baseline dashboard from ${baselineDashboardPath} (${label}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
  }
} catch (error) {
  console.warn(
    `Unexpected baseline dashboard handling failure (${error.message}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
  );
}

const report = buildScenarioTuningTrendReport({
  currentDashboard,
  baselineDashboard,
  baselineSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
  baselineTotalAbsDelta: EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
  comparisonSource,
  baselineReference,
});
const payload = buildValidatedReportPayload(
  REPORT_KINDS.scenarioTuningTrend,
  report,
  'scenario tuning trend',
);
const markdown = buildScenarioTuningTrendMarkdown(payload);

await writeJsonArtifact(outputPath, payload);
await writeTextArtifact(markdownOutputPath, markdown);

console.log(
  `Scenario tuning trend generated: source=${payload.comparisonSource}, changed=${payload.changedCount}/${payload.scenarioCount}, statuses=added:${payload.statusCounts?.added ?? 0},changed:${payload.statusCounts?.changed ?? 0},removed:${payload.statusCounts?.removed ?? 0},unchanged:${payload.statusCounts?.unchanged ?? 0}`,
);
console.log(`Scenario tuning trend JSON written to: ${outputPath}`);
console.log(`Scenario tuning trend markdown written to: ${markdownOutputPath}`);
