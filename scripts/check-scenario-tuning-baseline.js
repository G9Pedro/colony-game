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
  withReportMeta,
} from '../src/game/reportPayloadValidators.js';
import { loadJsonPayloadOrCompute } from './jsonPayloadCache.js';

const inputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';

const { source, payload } = await loadJsonPayloadOrCompute({
  path: inputPath,
  recoverOnParseError: true,
  validatePayload: isValidScenarioTuningSuggestionPayload,
  recoverOnInvalidPayload: true,
  computePayload: () =>
    withReportMeta(
      REPORT_KINDS.scenarioTuningBaselineSuggestions,
      buildScenarioTuningBaselineSuggestionPayload({
        scenarios: SCENARIO_DEFINITIONS,
        expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
        expectedTotalAbsDelta: EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA,
      }),
    ),
});
const summary = getScenarioTuningBaselineChangeSummary(payload);

console.log(
  `Scenario tuning baseline summary: changedSignatures=${summary.changedSignatures}, changedTotalAbsDelta=${summary.changedTotalAbsDelta}, source=${source}`,
);

if (summary.hasChanges) {
  payload.results
    .filter((result) => result.changed)
    .forEach((result) => {
      console.error(`- ${result.scenarioId}: ${result.expectedSignature ?? 'null'} -> ${result.currentSignature ?? 'null'}`);
    });
  console.error('Suggested baseline snippet:');
  console.error(payload.snippets?.scenarioTuningBaseline ?? '(snippet unavailable)');
  console.error('Scenario tuning baseline drift detected. Re-baseline intentionally if expected.');
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
}
