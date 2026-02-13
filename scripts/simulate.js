import { GameEngine } from '../src/game/gameEngine.js';
import { getSimulationSummary, runScriptedSimulation } from '../src/game/simulationHarness.js';

function runStrategy(scenarioId, seed) {
  const engine = new GameEngine({ scenarioId, seed });

  const queueAt = (step, type, x, z) => ({ step, type, x, z });
  const buildPlan = [
    queueAt(0, 'hut', 14, -14),
    queueAt(0, 'farm', -14, -14),
    queueAt(20, 'lumberCamp', -15, 14),
    queueAt(90, 'school', 14, 0),
  ];

  runScriptedSimulation({
    engine,
    steps: 900,
    onStep: ({ step }) => {
      buildPlan
        .filter((item) => item.step === step)
        .forEach((item) => {
          engine.queueBuilding(item.type, item.x, item.z);
        });

      if (step === 140) {
        engine.hireColonist();
      }
      if (step === 220) {
        engine.hireColonist();
      }
      if (step >= 300 && !engine.state.research.current && !engine.state.research.completed.includes('masonry')) {
        engine.beginResearch('masonry');
      }
    },
  });

  return getSimulationSummary(engine.state);
}

const scenarios = ['frontier', 'prosperous', 'harsh'];
for (const scenarioId of scenarios) {
  const summary = runStrategy(scenarioId, `simulation-${scenarioId}`);
  console.log(
    `[${scenarioId}] status=${summary.status}, day=${summary.day}, buildings=${summary.buildings}, alive=${summary.alivePopulation}, research=${summary.completedResearch.join(',') || 'none'}`,
  );
}
