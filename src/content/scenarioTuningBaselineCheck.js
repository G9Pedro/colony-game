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
  return buildScenarioTuningBaselineSuggestionPayload({
    scenarios,
    expectedSignatures,
  });
}

export function buildScenarioTuningBaselineSuggestionPayload({
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

export function buildScenarioTuningBaselineSuggestionMarkdown(payload) {
  const changed = payload.results.filter((result) => result.changed);
  const lines = [
    '# Scenario Tuning Baseline Suggestions',
    '',
    `- Changed signatures: ${changed.length}`,
    '',
  ];

  if (changed.length === 0) {
    lines.push('No baseline signature changes detected.', '');
  } else {
    lines.push('## Changed Scenarios', '');
    changed.forEach((item) => {
      lines.push(`- ${item.scenarioId}: ${item.expectedSignature ?? 'null'} -> ${item.currentSignature ?? 'null'}`);
    });
    lines.push('');
  }

  lines.push(
    '## Suggested Baseline Snippet',
    '',
    '```js',
    payload.snippets.scenarioTuningBaseline.trim(),
    '```',
    '',
  );
  return lines.join('\n');
}

export function getScenarioTuningBaselineChangeSummary(payload) {
  const changedSignatures = (payload.results ?? []).filter((result) => result.changed).length;
  return {
    changedSignatures,
    hasChanges: changedSignatures > 0,
  };
}
