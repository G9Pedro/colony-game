import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { deserializeState, isLikelyValidState, serializeState, validateSaveState } from '../src/persistence/saveLoad.js';
import { SAVE_SCHEMA_VERSION } from '../src/persistence/migrations.js';

test('state can be serialized and deserialized', () => {
  const state = createInitialState();
  state.resources.food = 77;
  state.research.completed.push('masonry');

  const serialized = serializeState(state);
  const parsed = deserializeState(serialized);

  assert.equal(parsed.resources.food, 77);
  assert.ok(parsed.research.completed.includes('masonry'));
  assert.equal(isLikelyValidState(parsed), true);
  assert.equal(parsed.saveMeta.schemaVersion, SAVE_SCHEMA_VERSION);
});

test('isLikelyValidState rejects malformed payload', () => {
  assert.equal(isLikelyValidState(null), false);
  assert.equal(isLikelyValidState({}), false);
});

test('validateSaveState returns actionable validation errors', () => {
  const validation = validateSaveState({ tick: 2 });
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.includes('Missing or invalid timeSeconds.'));
  assert.ok(validation.errors.includes('Missing resources map.'));
});

test('deserializeState migrates legacy save payload fields', () => {
  const legacyState = {
    tick: 10,
    timeSeconds: 20,
    resources: { food: 10, wood: 10, stone: 10, iron: 10, tools: 0, medicine: 0, knowledge: 0 },
    colonists: [],
    buildings: [],
    research: { completed: [], current: null, progress: 0 },
    runSummaryHistory: [{ outcome: 'lost', scenarioId: 'frontier' }],
    rules: { basePopulationCap: 6, baseStorageCapacity: 320 },
  };

  const migrated = deserializeState(JSON.stringify(legacyState));
  assert.equal(migrated.scenarioId, 'frontier');
  assert.equal(Array.isArray(migrated.objectives.completed), true);
  assert.equal(typeof migrated.rngState, 'number');
  assert.equal(typeof migrated.metrics.peakPopulation, 'number');
  assert.equal(Array.isArray(migrated.runSummaryHistory), true);
  assert.equal(migrated.runSummaryHistory[0].balanceProfileId, 'standard');
  assert.equal(Array.isArray(migrated.debug.invariantViolations), true);
  assert.equal(migrated.saveMeta.schemaVersion, SAVE_SCHEMA_VERSION);
});
