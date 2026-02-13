import { runStrategy } from './simulationMatrix.js';

const scenarios = ['frontier', 'prosperous', 'harsh'];
for (const scenarioId of scenarios) {
  const summary = runStrategy(scenarioId, `simulation-${scenarioId}`);
  console.log(
    `[${scenarioId}] status=${summary.status}, day=${summary.day}, buildings=${summary.buildings}, alive=${summary.alivePopulation}, research=${summary.completedResearch.join(',') || 'none'}`,
  );
}
