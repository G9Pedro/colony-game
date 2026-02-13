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

function round(value) {
  return Number(value.toFixed(2));
}

export function formatScenarioTuningBaselineSnippet(signatures) {
  const sorted = sortObjectKeys(signatures);
  return `export const EXPECTED_SCENARIO_TUNING_SIGNATURES = ${JSON.stringify(sorted, null, 2)};\n`;
}

export function formatScenarioTuningTotalAbsDeltaSnippet(totalAbsDeltaMap) {
  const sorted = sortObjectKeys(totalAbsDeltaMap);
  return `export const EXPECTED_SCENARIO_TUNING_TOTAL_ABS_DELTA = ${JSON.stringify(sorted, null, 2)};\n`;
}

function buildTotalAbsDeltaMap(scenarios) {
  return Object.fromEntries(
    Object.entries(scenarios)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([scenarioId, scenario]) => {
        const maps = [
          scenario?.productionMultipliers?.resource ?? {},
          scenario?.productionMultipliers?.job ?? {},
          scenario?.jobPriorityMultipliers ?? {},
        ];

        const totalAbsDeltaPercent = round(
          maps
            .flatMap((map) => Object.values(map))
            .reduce((sum, value) => {
              if (typeof value !== 'number' || !Number.isFinite(value) || value === 1) {
                return sum;
              }
              return sum + round(Math.abs((value - 1) * 100));
            }, 0),
        );
        return [scenarioId, totalAbsDeltaPercent];
      }),
  );
}

export function buildScenarioTuningBaselineReport({
  scenarios,
  expectedSignatures,
  expectedTotalAbsDelta,
}) {
  return buildScenarioTuningBaselineSuggestionPayload({
    scenarios,
    expectedSignatures,
    expectedTotalAbsDelta,
  });
}

export function buildScenarioTuningBaselineSuggestionPayload({
  scenarios,
  expectedSignatures,
  expectedTotalAbsDelta = {},
}) {
  const currentSignatures = buildScenarioTuningSignatureMap(scenarios);
  const currentTotalAbsDelta = buildTotalAbsDeltaMap(scenarios);
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
  const intensityScenarioIds = Array.from(
    new Set([...Object.keys(currentTotalAbsDelta), ...Object.keys(expectedTotalAbsDelta ?? {})]),
  ).sort((a, b) => a.localeCompare(b));
  const intensityResults = intensityScenarioIds.map((scenarioId) => {
    const currentTotalAbsDeltaPercent = currentTotalAbsDelta[scenarioId] ?? null;
    const expectedTotalAbsDeltaPercent = expectedTotalAbsDelta?.[scenarioId] ?? null;
    const changed = currentTotalAbsDeltaPercent !== expectedTotalAbsDeltaPercent;
    return {
      scenarioId,
      currentTotalAbsDeltaPercent,
      expectedTotalAbsDeltaPercent,
      changed,
      message: changed
        ? `expected ${expectedTotalAbsDeltaPercent ?? 'null'} but got ${currentTotalAbsDeltaPercent ?? 'null'}`
        : null,
    };
  });
  const changedCount = results.filter((result) => result.changed).length;
  const intensityChangedCount = intensityResults.filter((result) => result.changed).length;

  return {
    overallPassed:
      results.every((result) => !result.changed) &&
      intensityResults.every((result) => !result.changed),
    changedCount,
    intensityChangedCount,
    strictIntensityRecommended: intensityChangedCount > 0,
    strictIntensityCommand:
      'SIM_SCENARIO_TUNING_ENFORCE_INTENSITY=1 npm run simulate:check:tuning-baseline',
    currentSignatures,
    expectedSignatures,
    currentTotalAbsDelta,
    expectedTotalAbsDelta,
    results,
    intensityResults,
    snippets: {
      scenarioTuningBaseline: formatScenarioTuningBaselineSnippet(currentSignatures),
      scenarioTuningTotalAbsDeltaBaseline:
        formatScenarioTuningTotalAbsDeltaSnippet(currentTotalAbsDelta),
    },
  };
}

export function buildScenarioTuningBaselineSuggestionMarkdown(payload) {
  const changed = payload.results.filter((result) => result.changed);
  const intensityChanged = (payload.intensityResults ?? []).filter((result) => result.changed);
  const lines = [
    '# Scenario Tuning Baseline Suggestions',
    '',
    `- Changed signatures: ${changed.length}`,
    `- Changed total |delta| baselines: ${intensityChanged.length}`,
    `- Strict intensity enforcement recommended: ${payload.strictIntensityRecommended ? 'yes' : 'no'}`,
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

  if (intensityChanged.length === 0) {
    lines.push('No total |delta| baseline changes detected.', '');
  } else {
    lines.push('## Changed Total |Delta| Baselines', '');
    intensityChanged.forEach((item) => {
      lines.push(
        `- ${item.scenarioId}: ${item.expectedTotalAbsDeltaPercent ?? 'null'} -> ${item.currentTotalAbsDeltaPercent ?? 'null'}`,
      );
    });
    lines.push('');
  }

  lines.push(
    '## Suggested Signature Baseline Snippet',
    '',
    '```js',
    payload.snippets.scenarioTuningBaseline.trim(),
    '```',
    '',
  );
  lines.push(
    '## Suggested Total |Delta| Baseline Snippet',
    '',
    '```js',
    payload.snippets.scenarioTuningTotalAbsDeltaBaseline.trim(),
    '```',
    '',
  );
  lines.push(
    '## Enforcement Guidance',
    '',
    '- Signature baseline drift is always enforced by `npm run simulate:check:tuning-baseline`.',
    `- To also enforce total |delta| baseline drift, run with \`${payload.strictIntensityCommand}\`.`,
    '',
  );
  return lines.join('\n');
}

export function getScenarioTuningBaselineChangeSummary(payload) {
  const changedSignatures = (payload.results ?? []).filter((result) => result.changed).length;
  const changedTotalAbsDelta = (payload.intensityResults ?? []).filter((result) => result.changed)
    .length;
  return {
    changedSignatures,
    changedTotalAbsDelta,
    hasChanges: changedSignatures > 0,
    hasAnyChanges: changedSignatures > 0 || changedTotalAbsDelta > 0,
  };
}
