import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { AGGREGATE_BASELINE_BOUNDS } from '../src/content/regressionBaseline.js';
import { buildAggregateRegressionReport } from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_DRIFT_PATH ?? 'reports/simulation-drift.json';
const runCount = Number(process.env.SIM_DRIFT_RUNS ?? 8);
const scenarioIds = Object.keys(AGGREGATE_BASELINE_BOUNDS);
const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';

const summaries = [];
for (const scenarioId of scenarioIds) {
  for (let index = 0; index < runCount; index += 1) {
    const seed = `drift-${scenarioId}-${index}`;
    summaries.push(runStrategy(scenarioId, seed, { strategyProfileId }));
  }
}

const report = buildAggregateRegressionReport({
  summaries,
  baselineBounds: AGGREGATE_BASELINE_BOUNDS,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

report.scenarioResults.forEach((result) => {
  const metrics = result.metrics;
  console.log(
    `[${result.scenarioId}] meanAlive=${metrics.alivePopulationMean} meanBuildings=${metrics.buildingsMean} survival=${metrics.survivalRate} masonryRate=${metrics.masonryCompletionRate}`,
  );
  if (!result.passed) {
    result.failures.forEach((failure) => console.error(`  - ${failure}`));
  }
});

console.log(`Simulation drift report written to: ${outputPath}`);
if (!report.overallPassed) {
  process.exit(1);
}
