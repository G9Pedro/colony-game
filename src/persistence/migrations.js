import { seedFromString } from '../game/random.js';
import { getBalanceProfileDefinition } from '../content/balanceProfiles.js';
import { getScenarioDefinition } from '../content/scenarios.js';

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
  if (typeof state.balanceProfileId !== 'string') {
    state.balanceProfileId = 'standard';
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
  if (typeof state.metrics.peakPopulation !== 'number') {
    state.metrics.peakPopulation = state.colonists?.filter((colonist) => colonist.alive).length ?? 0;
  }
  if (typeof state.metrics.buildingsConstructed !== 'number') {
    state.metrics.buildingsConstructed = 0;
  }
  if (typeof state.metrics.researchCompleted !== 'number') {
    state.metrics.researchCompleted = state.research?.completed?.length ?? 0;
  }
  if (typeof state.metrics.objectivesCompleted !== 'number') {
    state.metrics.objectivesCompleted = state.objectives.completed.length;
  }

  if (!Array.isArray(state.runSummaryHistory)) {
    state.runSummaryHistory = [];
  }
  state.runSummaryHistory = state.runSummaryHistory.map((summary) => {
    if (!summary || typeof summary !== 'object') {
      return summary;
    }
    return {
      balanceProfileId: state.balanceProfileId ?? 'standard',
      ...summary,
      balanceProfileId: summary.balanceProfileId ?? state.balanceProfileId ?? 'standard',
    };
  });
  if (state.lastRunSummary && typeof state.lastRunSummary !== 'object') {
    state.lastRunSummary = null;
  }
  if (state.lastRunSummary && !state.lastRunSummary.balanceProfileId) {
    state.lastRunSummary.balanceProfileId = state.balanceProfileId ?? 'standard';
  }
  if (!state.debug || typeof state.debug !== 'object') {
    state.debug = {};
  }
  if (!Array.isArray(state.debug.invariantViolations)) {
    state.debug.invariantViolations = [];
  }

  if (!state.rules || typeof state.rules !== 'object') {
    state.rules = {};
  }
  const scenario = getScenarioDefinition(state.scenarioId);
  const profile = getBalanceProfileDefinition(state.balanceProfileId);
  if (typeof state.rules.needDecayMultiplier !== 'number') {
    state.rules.needDecayMultiplier = profile.needDecayMultiplier;
  }
  if (typeof state.rules.starvationHealthDamageMultiplier !== 'number') {
    state.rules.starvationHealthDamageMultiplier = profile.starvationHealthDamageMultiplier;
  }
  if (typeof state.rules.restHealthDamageMultiplier !== 'number') {
    state.rules.restHealthDamageMultiplier = profile.restHealthDamageMultiplier;
  }
  if (typeof state.rules.moralePenaltyMultiplier !== 'number') {
    state.rules.moralePenaltyMultiplier = profile.moralePenaltyMultiplier;
  }
  if (typeof state.rules.objectiveRewardMultiplier !== 'number') {
    state.rules.objectiveRewardMultiplier =
      (scenario.objectiveRewardMultiplier ?? 1) * (profile.objectiveRewardMultiplier ?? 1);
  }

  state.saveMeta = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    migratedFrom: incomingVersion < SAVE_SCHEMA_VERSION ? incomingVersion : SAVE_SCHEMA_VERSION,
    savedAt: state.saveMeta?.savedAt ?? new Date().toISOString(),
  };

  return state;
}
