export function runScriptedSimulation({
  engine,
  steps,
  deltaSeconds = 0.2,
  onStep = () => {},
}) {
  for (let step = 0; step < steps; step += 1) {
    onStep({ step, engine });
    engine.step(deltaSeconds);
    if (engine.state.status !== 'playing') {
      break;
    }
  }

  return engine.snapshot();
}

export function getSimulationSummary(state) {
  const alivePopulation = state.colonists.filter((colonist) => colonist.alive).length;
  return {
    scenarioId: state.scenarioId,
    balanceProfileId: state.balanceProfileId,
    seed: state.rngSeed,
    status: state.status,
    day: state.day,
    alivePopulation,
    buildings: state.buildings.length,
    queueLength: state.constructionQueue.length,
    resources: Object.fromEntries(
      Object.entries(state.resources).map(([key, value]) => [key, Math.floor(value)]),
    ),
    completedResearch: [...state.research.completed],
  };
}
