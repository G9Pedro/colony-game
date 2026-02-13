import {
  EXPECTED_SCENARIO_TUNING_SIGNATURES,
  EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
} from '../src/content/scenarioTuningBaseline.js';
import {
  buildScenarioTuningBaselineSuggestionPayload,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import {
  isValidScenarioTuningSuggestionPayload,
  REPORT_KINDS,
} from '../src/game/reportPayloadValidators.js';
import {
  emitJsonDiagnostic,
  REPORT_DIAGNOSTIC_CODES,
} from './reportDiagnostics.js';
import { loadJsonPayloadOrCompute } from './jsonPayloadCache.js';
import { buildValidatedReportPayload } from './reportPayloadOutput.js';

const inputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';
const enforceIntensityBaseline = process.env.SIM_SCENARIO_TUNING_ENFORCE_INTENSITY === '1';
const DIAGNOSTIC_SCRIPT = 'simulate:check:tuning-baseline';

const { source, payload } = await loadJsonPayloadOrCompute({
  path: inputPath,
  recoverOnParseError: true,
  validatePayload: isValidScenarioTuningSuggestionPayload,
  recoverOnInvalidPayload: true,
  computePayload: () =>
    buildValidatedReportPayload(
      REPORT_KINDS.scenarioTuningBaselineSuggestions,
      buildScenarioTuningBaselineSuggestionPayload({
        scenarios: SCENARIO_DEFINITIONS,
        expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
        expectedTotalAbsDelta: EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
      }),
      'scenario tuning baseline suggestion',
    ),
});
const summary = getScenarioTuningBaselineChangeSummary(payload);

console.log(
  `Scenario tuning baseline summary: changedSignatures=${summary.changedSignatures}, changedTotalAbsDelta=${summary.changedTotalAbsDelta}, source=${source}`,
);
emitJsonDiagnostic({
  level: 'info',
  code: REPORT_DIAGNOSTIC_CODES.scenarioTuningBaselineSummary,
  script: DIAGNOSTIC_SCRIPT,
  message: 'Scenario tuning baseline summary calculated.',
  context: {
    changedSignatures: summary.changedSignatures,
    changedTotalAbsDelta: summary.changedTotalAbsDelta,
    source,
    strictIntensity: enforceIntensityBaseline,
  },
});

if (summary.hasChanges) {
  payload.results
    .filter((result) => result.changed)
    .forEach((result) => {
      console.error(`- ${result.scenarioId}: ${result.expectedSignature ?? 'null'} -> ${result.currentSignature ?? 'null'}`);
    });
  console.error('Suggested baseline snippet:');
  console.error(payload.snippets?.scenarioTuningBaseline ?? '(snippet unavailable)');
  console.error('Scenario tuning baseline drift detected. Re-baseline intentionally if expected.');
  emitJsonDiagnostic({
    level: 'error',
    code: REPORT_DIAGNOSTIC_CODES.scenarioTuningSignatureDrift,
    script: DIAGNOSTIC_SCRIPT,
    message: 'Scenario tuning signature baseline drift detected.',
    context: {
      changedSignatures: summary.changedSignatures,
      source,
    },
  });
  process.exit(1);
}

if (summary.changedTotalAbsDelta > 0) {
  payload.intensityResults
    ?.filter((result) => result.changed)
    .forEach((result) => {
      console.warn(
        `~ intensity ${result.scenarioId}: ${result.expectedTotalAbsDeltaPercent ?? 'null'} -> ${result.currentTotalAbsDeltaPercent ?? 'null'}`,
      );
    });
  console.warn('Suggested total |delta| baseline snippet:');
  console.warn(payload.snippets?.scenarioTuningTotalAbsDeltaBaseline ?? '(snippet unavailable)');
  emitJsonDiagnostic({
    level: 'warn',
    code: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDrift,
    script: DIAGNOSTIC_SCRIPT,
    message: 'Scenario tuning intensity baseline drift detected.',
    context: {
      changedTotalAbsDelta: summary.changedTotalAbsDelta,
      strictIntensity: enforceIntensityBaseline,
      source,
    },
  });
  if (enforceIntensityBaseline) {
    console.error('Scenario tuning intensity baseline drift detected with strict enforcement enabled.');
    emitJsonDiagnostic({
      level: 'error',
      code: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityDriftStrict,
      script: DIAGNOSTIC_SCRIPT,
      message: 'Strict intensity baseline enforcement triggered failure.',
      context: {
        changedTotalAbsDelta: summary.changedTotalAbsDelta,
        source,
      },
    });
    process.exit(1);
  }
  console.warn(`Tip: run "${payload.strictIntensityCommand}" to enforce intensity drift as a hard failure.`);
  emitJsonDiagnostic({
    level: 'warn',
    code: REPORT_DIAGNOSTIC_CODES.scenarioTuningIntensityEnforcementTip,
    script: DIAGNOSTIC_SCRIPT,
    message: 'Intensity drift tip emitted with strict enforcement command.',
    context: {
      command: payload.strictIntensityCommand,
      source,
    },
  });
}
