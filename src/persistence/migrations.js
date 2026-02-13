import { seedFromString } from '../game/random.js';

export const SAVE_SCHEMA_VERSION = 2;

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

export function migrateSaveState(inputState) {
  const state = cloneValue(inputState);
  const incomingVersion = Number(state?.saveMeta?.schemaVersion ?? 1);

  if (!state.objectives || !Array.isArray(state.objectives.completed)) {
    state.objectives = {
      completed: [],
    };
  }

  if (typeof state.scenarioId !== 'string') {
    state.scenarioId = 'frontier';
  }

  if (typeof state.rngSeed !== 'string') {
    state.rngSeed = 'legacy-save';
  }

  if (typeof state.rngState !== 'number') {
    state.rngState = seedFromString(state.rngSeed);
  }

  if (!state.metrics || typeof state.metrics !== 'object') {
    state.metrics = {};
  }
  if (typeof state.metrics.deaths !== 'number') {
    state.metrics.deaths = 0;
  }
  if (typeof state.metrics.starvationTicks !== 'number') {
    state.metrics.starvationTicks = 0;
  }
  if (typeof state.metrics.lowMoraleTicks !== 'number') {
    state.metrics.lowMoraleTicks = 0;
  }

  if (!Array.isArray(state.runSummaryHistory)) {
    state.runSummaryHistory = [];
  }

  state.saveMeta = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    migratedFrom: incomingVersion < SAVE_SCHEMA_VERSION ? incomingVersion : SAVE_SCHEMA_VERSION,
    savedAt: state.saveMeta?.savedAt ?? new Date().toISOString(),
  };

  return state;
}
