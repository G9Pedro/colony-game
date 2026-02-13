import { GameEngine } from '../src/game/gameEngine.js';
import { getStrategyProfile } from '../src/content/strategyProfiles.js';
import { getSimulationSummary, runScriptedSimulation } from '../src/game/simulationHarness.js';

export function runStrategy(scenarioId, seed, options = {}) {
  const balanceProfileId = options.balanceProfileId ?? 'standard';
  const strategyProfile = getStrategyProfile(options.strategyProfileId ?? 'baseline');
  const engine = new GameEngine({ scenarioId, seed, balanceProfileId });
  const buildPlan = options.buildPlan ?? strategyProfile.buildActions;
  const stepCount = options.steps ?? strategyProfile.steps;
  const hireSteps = new Set(options.hireSteps ?? strategyProfile.hireSteps);
  const researchActions = options.researchActions ?? strategyProfile.researchActions;

  runScriptedSimulation({
    engine,
    steps: stepCount,
    onStep: ({ step }) => {
      buildPlan
        .filter((item) => item.step === step)
        .forEach((item) => {
          engine.queueBuilding(item.type, item.x, item.z);
        });

      if (hireSteps.has(step)) {
        engine.hireColonist();
      }

      for (const action of researchActions) {
        if (
          step >= action.startAtStep &&
          !engine.state.research.current &&
          !engine.state.research.completed.includes(action.techId)
        ) {
          engine.beginResearch(action.techId);
        }
      }
    },
  });

  return getSimulationSummary(engine.state);
}

export function runScenarioMatrix(scenarios, seedPrefix = 'simulation', options = {}) {
  return scenarios.map((scenarioId) =>
    runStrategy(scenarioId, `${seedPrefix}-${scenarioId}`, {
      ...options,
    }),
  );
}
