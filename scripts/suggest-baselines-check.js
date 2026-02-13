import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { getBaselineChangeSummary } from '../src/game/baselineSuggestion.js';
import { buildBaselineSuggestionPayloadFromSimulations } from './baselineSuggestionRuntime.js';

const inputPath = process.env.SIM_BASELINE_SUGGEST_PATH ?? 'reports/baseline-suggestions.json';
const driftRuns = Number(process.env.SIM_BASELINE_SUGGEST_RUNS ?? 8);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';

async function loadBaselineSuggestionPayload() {
  try {
    const payloadText = await readFile(inputPath, 'utf-8');
    return {
      source: 'file',
      payload: JSON.parse(payloadText),
    };
  } catch (error) {
    if (error?.code !== 'ENOENT') {
      throw error;
    }

    const payload = buildBaselineSuggestionPayloadFromSimulations({
      driftRuns,
      strategyProfileId,
    });
    await mkdir(dirname(inputPath), { recursive: true });
    await writeFile(
      inputPath,
      JSON.stringify(payload, null, 2),
      'utf-8',
    );
    return {
      source: 'computed',
      payload,
    };
  }
}

const { source, payload } = await loadBaselineSuggestionPayload();
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
