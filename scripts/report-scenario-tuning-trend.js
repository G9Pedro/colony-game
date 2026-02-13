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
import {
  createScriptDiagnosticEmitter,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';
import {
  buildReadArtifactFailureContext,
  buildReadArtifactDiagnostic,
  buildReadArtifactFailureLabel,
  readValidatedReportArtifact,
} from './reportPayloadInput.js';
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
const DIAGNOSTIC_SCRIPT = 'simulate:report:tuning:trend';
const emitDiagnostic = createScriptDiagnosticEmitter(DIAGNOSTIC_SCRIPT);

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
    const diagnostic = buildReadArtifactDiagnostic(baselineDashboardResult);
    console.warn(
      `Baseline dashboard payload at ${baselineDashboardPath} is invalid (${baselineDashboardResult.message}; code=${diagnostic?.code ?? 'unknown'}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
    emitDiagnostic({
      level: 'warn',
      code: diagnostic?.code ?? REPORT_DIAGNOSTIC_CODES.artifactReadError,
      message: 'Baseline dashboard payload is invalid; falling back to signature baseline.',
      context: buildReadArtifactFailureContext(baselineDashboardResult, {
        baselinePath: baselineDashboardPath,
        remediationCommand: BASELINE_CAPTURE_COMMAND,
      }),
    });
  } else if (baselineDashboardResult.status === 'missing') {
    const diagnostic = buildReadArtifactDiagnostic(baselineDashboardResult);
    console.log(
      `Baseline dashboard not found at ${baselineDashboardPath} (code=${diagnostic?.code ?? 'unknown'}); using signature baseline comparison. To create one, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
    emitDiagnostic({
      level: 'info',
      code: diagnostic?.code ?? REPORT_DIAGNOSTIC_CODES.artifactMissing,
      message: 'Baseline dashboard not found; using signature baseline comparison.',
      context: buildReadArtifactFailureContext(baselineDashboardResult, {
        baselinePath: baselineDashboardPath,
        remediationCommand: BASELINE_CAPTURE_COMMAND,
      }),
    });
  } else {
    const diagnostic = buildReadArtifactDiagnostic(baselineDashboardResult);
    const label = buildReadArtifactFailureLabel(baselineDashboardResult);
    console.warn(
      `Unable to read baseline dashboard from ${baselineDashboardPath} (${label}; code=${diagnostic?.code ?? 'unknown'}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
    );
    emitDiagnostic({
      level: 'warn',
      code: diagnostic?.code ?? REPORT_DIAGNOSTIC_CODES.artifactReadError,
      message: 'Unable to read baseline dashboard; falling back to signature baseline.',
      context: buildReadArtifactFailureContext(baselineDashboardResult, {
        baselinePath: baselineDashboardPath,
        remediationCommand: BASELINE_CAPTURE_COMMAND,
      }),
    });
  }
} catch (error) {
  console.warn(
    `Unexpected baseline dashboard handling failure (${error.message}); falling back to signature baseline. To refresh baseline dashboard, run "${BASELINE_CAPTURE_COMMAND}".`,
  );
  emitDiagnostic({
    level: 'warn',
    code: REPORT_DIAGNOSTIC_CODES.artifactReadError,
    message: 'Unexpected baseline dashboard handling failure; falling back to signature baseline.',
    context: {
      baselinePath: baselineDashboardPath,
      reason: error.message,
      remediationCommand: BASELINE_CAPTURE_COMMAND,
    },
  });
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
