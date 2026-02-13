import { buildScenarioTuningSignatureMap } from './scenarioTuningSignature.js';

function sortObjectKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return value;
  }
  const sorted = {};
  Object.keys(value)
    .sort((a, b) => a.localeCompare(b))
    .forEach((key) => {
      sorted[key] = sortObjectKeys(value[key]);
    });
  return sorted;
}

export function formatScenarioTuningBaselineSnippet(signatures) {
  const sorted = sortObjectKeys(signatures);
  return `export const EXPECTED_SCENARIO_TUNING_SIGNATURES = ${JSON.stringify(sorted, null, 2)};\n`;
}

export function buildScenarioTuningBaselineReport({
  scenarios,
  expectedSignatures,
}) {
  const currentSignatures = buildScenarioTuningSignatureMap(scenarios);
  const scenarioIds = Array.from(
    new Set([...Object.keys(currentSignatures), ...Object.keys(expectedSignatures ?? {})]),
  ).sort((a, b) => a.localeCompare(b));

  const results = scenarioIds.map((scenarioId) => {
    const currentSignature = currentSignatures[scenarioId] ?? null;
    const expectedSignature = expectedSignatures?.[scenarioId] ?? null;
    const changed = currentSignature !== expectedSignature;
    return {
      scenarioId,
      currentSignature,
      expectedSignature,
      changed,
      message: changed
        ? `expected ${expectedSignature ?? 'null'} but got ${currentSignature ?? 'null'}`
        : null,
    };
  });

  return {
    overallPassed: results.every((result) => !result.changed),
    changedCount: results.filter((result) => result.changed).length,
    currentSignatures,
    expectedSignatures,
    results,
    snippets: {
      scenarioTuningBaseline: formatScenarioTuningBaselineSnippet(currentSignatures),
    },
  };
}
