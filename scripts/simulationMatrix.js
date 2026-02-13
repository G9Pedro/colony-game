import { GameEngine } from '../src/game/gameEngine.js';
import { getSimulationSummary, runScriptedSimulation } from '../src/game/simulationHarness.js';

function queueAt(step, type, x, z) {
  return { step, type, x, z };
}

const DEFAULT_BUILD_PLAN = [
  queueAt(0, 'hut', 14, -14),
  queueAt(0, 'farm', -14, -14),
  queueAt(20, 'lumberCamp', -15, 14),
  queueAt(90, 'school', 14, 0),
];

export function runStrategy(scenarioId, seed, options = {}) {
  const engine = new GameEngine({ scenarioId, seed });
  const buildPlan = options.buildPlan ?? DEFAULT_BUILD_PLAN;
  const stepCount = options.steps ?? 900;

  runScriptedSimulation({
    engine,
    steps: stepCount,
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

export function runScenarioMatrix(scenarios, seedPrefix = 'simulation') {
  return scenarios.map((scenarioId) => runStrategy(scenarioId, `${seedPrefix}-${scenarioId}`));
}
