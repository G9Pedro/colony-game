import { runStrategy } from './simulationMatrix.js';
import { DEFAULT_REGRESSION_EXPECTATIONS, evaluateSimulationSummary } from '../src/game/regression.js';

const strategyProfileId = process.env.SIM_STRATEGY_PROFILE ?? 'baseline';
let hasFailure = false;
for (const [scenarioId, expected] of Object.entries(DEFAULT_REGRESSION_EXPECTATIONS)) {
  const summary = runStrategy(scenarioId, `assert-${scenarioId}`, { strategyProfileId });
  const failures = evaluateSimulationSummary(summary, expected);
  if (failures.length > 0) {
    hasFailure = true;
    console.error(`[${scenarioId}] regression FAILED`);
    failures.forEach((failure) => console.error(`  - ${failure}`));
  } else {
    console.log(
      `[${scenarioId}] ok: status=${summary.status}, alive=${summary.alivePopulation}, buildings=${summary.buildings}, research=${summary.completedResearch.join(',') || 'none'}`,
    );
  }
}

if (hasFailure) {
  process.exit(1);
}
