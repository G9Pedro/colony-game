import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_DEFINITIONS } from '../src/content/buildings.js';
import {
  buildLegacyBuildingSyncInvocation,
  buildLegacyColonistSyncInvocation,
} from '../src/render/legacyMeshSyncInvocation.js';
import { createLegacyBuildingMesh, createLegacyColonistMesh } from '../src/render/legacyMeshFactory.js';
import { reconcileMeshMap, updateColonistMeshPose } from '../src/render/legacyEntitySync.js';

test('buildLegacyBuildingSyncInvocation maps renderer building sync dependencies', () => {
  const renderer = {
    buildingMeshes: { id: 'building-meshes' },
    scene: { id: 'scene' },
  };
  const state = { id: 'state' };
  const three = { id: 'three' };

  const invocation = buildLegacyBuildingSyncInvocation(renderer, state, { three });

  assert.equal(invocation.state, state);
  assert.equal(invocation.buildingMeshes, renderer.buildingMeshes);
  assert.equal(invocation.scene, renderer.scene);
  assert.equal(invocation.three, three);
  assert.equal(invocation.buildingDefinitions, BUILDING_DEFINITIONS);
  assert.equal(invocation.reconcileMeshMap, reconcileMeshMap);
  assert.equal(invocation.createLegacyBuildingMesh, createLegacyBuildingMesh);
});

test('buildLegacyColonistSyncInvocation maps renderer colonist sync dependencies', () => {
  const renderer = {
    colonistMeshes: { id: 'colonist-meshes' },
    scene: { id: 'scene' },
  };
  const state = { id: 'state' };
  const three = { id: 'three' };

  const invocation = buildLegacyColonistSyncInvocation(renderer, state, { three });

  assert.equal(invocation.state, state);
  assert.equal(invocation.colonistMeshes, renderer.colonistMeshes);
  assert.equal(invocation.scene, renderer.scene);
  assert.equal(invocation.three, three);
  assert.equal(invocation.reconcileMeshMap, reconcileMeshMap);
  assert.equal(invocation.createLegacyColonistMesh, createLegacyColonistMesh);
  assert.equal(invocation.updateColonistMeshPose, updateColonistMeshPose);
});

