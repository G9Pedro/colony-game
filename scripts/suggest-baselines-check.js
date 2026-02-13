import { getBaselineChangeSummary } from '../src/game/baselineSuggestion.js';
import { buildBaselineSuggestionPayloadFromSimulations } from './baselineSuggestionRuntime.js';
import { loadJsonPayloadOrCompute } from './jsonPayloadCache.js';

const inputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';

function isValidBaselineSuggestionPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === 'object' &&
      payload.aggregateDelta &&
      typeof payload.aggregateDelta === 'object' &&
      Array.isArray(payload.snapshotDelta) &&
      payload.snippets &&
      typeof payload.snippets.regressionBaseline === 'string' &&
      typeof payload.snippets.regressionSnapshots === 'string',
  );
}

const { source, payload } = await loadJsonPayloadOrCompute({
  path: inputPath,
  recoverOnParseError: true,
  validatePayload: isValidBaselineSuggestionPayload,
  recoverOnInvalidPayload: true,
  computePayload: () =>
    buildBaselineSuggestionPayloadFromSimulations({
      driftRuns,
      strategyProfileId,
    }),
});
const summary = getBaselineChangeSummary(payload);

console.log(
  `Baseline change summary: aggregateChangedMetrics=${summary.aggregateChangedMetrics}, snapshotChangedKeys=${summary.snapshotChangedKeys}, source=${source}`,
);

if (summary.hasChanges) {
  const changedSnapshots = (payload.snapshotDelta ?? []).filter((item) => item.changed);
  if (changedSnapshots.length > 0) {
    changedSnapshots.forEach((item) => {
      console.error(`- Snapshot ${item.key}: ${item.from ?? 'null'} -> ${item.to ?? 'null'}`);
    });
  }
  console.error('Suggested baseline snippets:');
  console.error(payload.snippets?.regressionBaseline ?? '(aggregate snippet unavailable)');
  console.error(payload.snippets?.regressionSnapshots ?? '(snapshot snippet unavailable)');
  console.error('Baseline drift detected. Re-baseline intentionally if this is expected.');
  process.exit(1);
}
