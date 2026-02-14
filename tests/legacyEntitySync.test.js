import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileMeshMap, updateColonistMeshPose } from '../src/render/legacyEntitySync.js';

function createMockMesh() {
  return {
    removed: false,
    geometry: { disposeCalled: false, dispose() { this.disposeCalled = true; } },
    material: { disposeCalled: false, dispose() { this.disposeCalled = true; } },
    position: { x: 0, y: 0, z: 0 },
  };
}

test('reconcileMeshMap removes stale meshes and adds missing meshes', () => {
  const scene = {
    added: [],
    removed: [],
    add(mesh) { this.added.push(mesh); },
    remove(mesh) { this.removed.push(mesh); },
  };
  const meshMap = new Map([
    ['a', createMockMesh()],
    ['stale', createMockMesh()],
  ]);

  reconcileMeshMap({
    entities: [{ id: 'a' }, { id: 'b' }],
    meshMap,
    scene,
    getId: (entity) => entity.id,
    createMesh: () => createMockMesh(),
  });

  assert.equal(meshMap.has('a'), true);
  assert.equal(meshMap.has('b'), true);
  assert.equal(meshMap.has('stale'), false);
  assert.equal(scene.removed.length, 1);
  assert.equal(scene.added.length, 1);
});

test('updateColonistMeshPose applies position and bobbing offset', () => {
  const mesh = createMockMesh();
  updateColonistMeshPose(mesh, {
    position: { x: 4, z: -2 },
    age: 3,
  }, 12);
  assert.equal(mesh.position.x, 4);
  assert.equal(mesh.position.z, -2);
  assert.ok(mesh.position.y > 0.25 && mesh.position.y < 0.35);
});

