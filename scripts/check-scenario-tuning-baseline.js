import { EXPECTED_SCENARIO_TUNING_SIGNATURES } from '../src/content/scenarioTuningBaseline.js';
import {
  buildScenarioTuningBaselineSuggestionPayload,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';
import { loadJsonPayloadOrCompute } from './jsonPayloadCache.js';

const inputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';

function isValidScenarioTuningSuggestionPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      Array.isArray(payload.results) &&
      payload.snippets &&
      typeof payload.snippets.scenarioTuningBaseline === 'string',
  );
}

const { source, payload } = await loadJsonPayloadOrCompute({
  path: inputPath,
  recoverOnParseError: true,
  validatePayload: isValidScenarioTuningSuggestionPayload,
  recoverOnInvalidPayload: true,
  computePayload: () => ({
    generatedAt: new Date().toISOString(),
    ...buildScenarioTuningBaselineSuggestionPayload({
      scenarios: SCENARIO_DEFINITIONS,
      expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
    }),
  }),
});
const summary = getScenarioTuningBaselineChangeSummary(payload);

console.log(
  `Scenario tuning baseline summary: changedSignatures=${summary.changedSignatures}, source=${source}`,
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
