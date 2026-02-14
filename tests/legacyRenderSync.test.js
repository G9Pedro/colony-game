import test from 'node:test';
import assert from 'node:assert/strict';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from '../src/render/legacyRenderSync.js';

test('syncLegacyBuildingMeshes delegates reconciliation with building mesh factory', () => {
  const state = {
    buildings: [{ id: 'b-1', type: 'farm' }],
  };
  const buildingMeshes = new Map();
  const scene = {};
  const three = { name: 'three' };
  const buildingDefinitions = { farm: { name: 'Farm' } };
  let reconcileArgs = null;
  const created = [];

  syncLegacyBuildingMeshes({
    state,
    buildingMeshes,
    scene,
    three,
    buildingDefinitions,
    reconcileMeshMap: (args) => {
      reconcileArgs = args;
    },
    createLegacyBuildingMesh: (building, definitions, threeObject) => {
      created.push({ building, definitions, threeObject });
      return { id: `mesh:${building.id}` };
    },
  });

  assert.equal(reconcileArgs.entities, state.buildings);
  assert.equal(reconcileArgs.meshMap, buildingMeshes);
  assert.equal(reconcileArgs.scene, scene);
  assert.equal(reconcileArgs.getId(state.buildings[0]), 'b-1');
  assert.deepEqual(reconcileArgs.createMesh(state.buildings[0]), { id: 'mesh:b-1' });
  assert.deepEqual(created, [{
    building: state.buildings[0],
    definitions: buildingDefinitions,
    threeObject: three,
  }]);
});

test('syncLegacyColonistMeshes reconciles alive colonists and updates existing meshes', () => {
  const liveA = { id: 'c-a', alive: true, position: { x: 1, z: 2 } };
  const liveB = { id: 'c-b', alive: true, position: { x: 5, z: 6 } };
  const dead = { id: 'c-dead', alive: false, position: { x: 0, z: 0 } };
  const state = {
    colonists: [liveA, dead, liveB],
    timeSeconds: 48,
  };
  const colonistMeshes = new Map([
    ['c-a', { id: 'mesh-a' }],
  ]);
  const scene = {};
  const three = { name: 'three' };
  let reconcileArgs = null;
  const poseUpdates = [];

  syncLegacyColonistMeshes({
    state,
    colonistMeshes,
    scene,
    three,
    reconcileMeshMap: (args) => {
      reconcileArgs = args;
    },
    createLegacyColonistMesh: (colonist, threeObject) => ({ id: `mesh:${colonist.id}:${threeObject.name}` }),
    updateColonistMeshPose: (mesh, colonist, timeSeconds) => {
      poseUpdates.push({ mesh, colonist, timeSeconds });
    },
  });

  assert.deepEqual(reconcileArgs.entities, [liveA, liveB]);
  assert.equal(reconcileArgs.meshMap, colonistMeshes);
  assert.equal(reconcileArgs.scene, scene);
  assert.equal(reconcileArgs.getId(liveA), 'c-a');
  assert.deepEqual(reconcileArgs.createMesh(liveB), { id: 'mesh:c-b:three' });
  assert.deepEqual(poseUpdates, [
    { mesh: { id: 'mesh-a' }, colonist: liveA, timeSeconds: 48 },
  ]);
});

