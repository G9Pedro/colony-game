import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
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
  validateReportPayloadByKind,
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';

const outputPath = process.env.SIM_SCENARIO_TUNING_TREND_PATH ?? 'reports/scenario-tuning-trend.json';
const markdownOutputPath =
  process.env.SIM_SCENARIO_TUNING_TREND_MD_PATH ?? 'reports/scenario-tuning-trend.md';
const baselineDashboardPath =
  process.env.SIM_SCENARIO_TUNING_TREND_BASELINE_PATH ?? 'reports/scenario-tuning-dashboard.baseline.json';

const currentDashboard = buildScenarioTuningDashboard(SCENARIO_DEFINITIONS);

let comparisonSource = 'signature-baseline';
let baselineReference = 'src/content/scenarioTuningBaseline.js';
let baselineDashboard = null;

try {
  const payloadText = await readFile(baselineDashboardPath, 'utf-8');
  const parsedPayload = JSON.parse(payloadText);
  const baselineValidation = validateReportPayloadByKind(
    REPORT_KINDS.scenarioTuningDashboard,
    parsedPayload,
  );
  if (baselineValidation.ok) {
    comparisonSource = 'dashboard';
    baselineReference = baselineDashboardPath;
    baselineDashboard = parsedPayload;
  } else {
    console.warn(
      `Baseline dashboard payload at ${baselineDashboardPath} is invalid (${baselineValidation.reason}); falling back to signature baseline.`,
    );
  }
} catch (error) {
  if (error?.code === 'ENOENT') {
    console.log(
      `Baseline dashboard not found at ${baselineDashboardPath}; using signature baseline comparison.`,
    );
  } else {
    const label = error instanceof SyntaxError ? 'invalid JSON' : error.code ?? error.message;
    console.warn(
      `Unable to read baseline dashboard from ${baselineDashboardPath} (${label}); falling back to signature baseline.`,
    );
  }
}

const report = buildScenarioTuningTrendReport({
  currentDashboard,
  baselineDashboard,
  baselineSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
  baselineTotalAbsDelta: EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
  comparisonSource,
  baselineReference,
});
const payload = withReportMeta(REPORT_KINDS.scenarioTuningTrend, report);
const markdown = buildScenarioTuningTrendMarkdown(payload);

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
await writeFile(markdownOutputPath, markdown, 'utf-8');

console.log(
  `Scenario tuning trend generated: source=${payload.comparisonSource}, changed=${payload.changedCount}/${payload.scenarioCount}`,
);
console.log(`Scenario tuning trend JSON written to: ${outputPath}`);
console.log(`Scenario tuning trend markdown written to: ${markdownOutputPath}`);
