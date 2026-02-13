import { getAliveColonists, getAverageMorale } from '../game/selectors.js';

function finalizeRunSummary(state, outcome) {
  const summary = {
    outcome,
    scenarioId: state.scenarioId,
    balanceProfileId: state.balanceProfileId ?? 'standard',
    seed: state.rngSeed,
    day: state.day,
    alivePopulation: state.colonists.filter((colonist) => colonist.alive).length,
    peakPopulation: state.metrics.peakPopulation,
    buildingsConstructed: state.metrics.buildingsConstructed,
    completedResearch: [...state.research.completed],
    completedObjectives: [...state.objectives.completed],
    timestamp: new Date().toISOString(),
  };

  state.runSummaryHistory.push(summary);
  state.lastRunSummary = summary;
}

export function runOutcomeSystem(context) {
  const { state, deltaSeconds, emit } = context;
  if (state.status !== 'playing') {
    return;
  }

  const aliveColonists = getAliveColonists(state);
  const averageMorale = getAverageMorale(state);
  const averageHunger =
    aliveColonists.length === 0
      ? 0
      : aliveColonists.reduce((sum, colonist) => sum + colonist.needs.hunger, 0) / aliveColonists.length;
  state.metrics.peakPopulation = Math.max(state.metrics.peakPopulation, aliveColonists.length);

  state.day = Math.max(1, Math.floor(state.timeSeconds / 24) + 1);

  if (state.resources.food <= 0 && averageHunger < 25) {
    state.metrics.starvationTicks += deltaSeconds;
  } else {
    state.metrics.starvationTicks = Math.max(0, state.metrics.starvationTicks - deltaSeconds * 0.5);
  }

  if (averageMorale < 16) {
    state.metrics.lowMoraleTicks += deltaSeconds;
  } else {
    state.metrics.lowMoraleTicks = Math.max(0, state.metrics.lowMoraleTicks - deltaSeconds * 0.75);
  }

  if (aliveColonists.length === 0) {
    state.status = 'lost';
    finalizeRunSummary(state, 'lost');
    emit('game-over', {
      kind: 'error',
      message: 'Your colony has fallen. No colonists remain.',
    });
    return;
  }

  if (state.metrics.starvationTicks >= 52 || state.metrics.lowMoraleTicks >= 70) {
    state.status = 'lost';
    finalizeRunSummary(state, 'lost');
    emit('game-over', {
      kind: 'error',
      message: 'The colony collapsed due to starvation and despair.',
    });
    return;
  }

  const hasCharter = state.research.completed.includes('colony-charter');
  if (hasCharter && aliveColonists.length >= 24 && state.buildings.length >= 14) {
    state.status = 'won';
    finalizeRunSummary(state, 'won');
    emit('game-over', {
      kind: 'success',
      message: 'Victory! Your thriving colony earned an official charter.',
    });
  }
}
