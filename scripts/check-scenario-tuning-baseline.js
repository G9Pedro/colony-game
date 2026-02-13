import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EXPECTED_SCENARIO_TUNING_SIGNATURES } from '../src/content/scenarioTuningBaseline.js';
import {
  buildScenarioTuningBaselineSuggestionPayload,
  getScenarioTuningBaselineChangeSummary,
} from '../src/content/scenarioTuningBaselineCheck.js';
import { SCENARIO_DEFINITIONS } from '../src/content/scenarios.js';

const inputPath =
  process.env.SIM_SCENARIO_TUNING_BASELINE_SUGGEST_PATH ??
  'reports/scenario-tuning-baseline-suggestions.json';

async function loadSuggestionPayload() {
  try {
    const text = await readFile(inputPath, 'utf-8');
    return {
      source: 'file',
      payload: JSON.parse(text),
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const payload = buildScenarioTuningBaselineSuggestionPayload({
      scenarios: SCENARIO_DEFINITIONS,
      expectedSignatures: EXPECTED_SCENARIO_TUNING_SIGNATURES,
    });
    await mkdir(dirname(inputPath), { recursive: true });
    await writeFile(
      inputPath,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          ...payload,
        },
        null,
        2,
      ),
      'utf-8',
    );
    return {
      source: 'computed',
      payload,
    };
  }
}

const { source, payload } = await loadSuggestionPayload();
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
