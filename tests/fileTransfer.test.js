import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState } from '../src/game/state.js';
import { buildExportFilename, MAX_IMPORT_FILE_BYTES, readStateFromFile } from '../src/persistence/fileTransfer.js';
import { serializeState } from '../src/persistence/saveLoad.js';

test('buildExportFilename includes scenario and day', () => {
  const state = createInitialState({ scenarioId: 'harsh', seed: 'file-seed' });
  state.day = 4;
  const filename = buildExportFilename(state);
  assert.equal(filename, 'colony-frontier-harsh-day-4.json');
});

test('readStateFromFile parses valid serialized state', async () => {
  const state = createInitialState({ scenarioId: 'frontier', seed: 'file-seed' });
  const file = new File([serializeState(state)], 'save.json', { type: 'application/json' });
  const parsed = await readStateFromFile(file);
  assert.equal(parsed.scenarioId, 'frontier');
  assert.equal(parsed.rngSeed, 'file-seed');
});

test('readStateFromFile rejects oversized files', async () => {
  const oversizedPayload = 'x'.repeat(MAX_IMPORT_FILE_BYTES + 1);
  const file = new File([oversizedPayload], 'oversized.json', { type: 'application/json' });
  await assert.rejects(() => readStateFromFile(file), /Save file too large/);
});
