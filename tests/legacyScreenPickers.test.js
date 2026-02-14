import test from 'node:test';
import assert from 'node:assert/strict';
import { pickLegacyEntityAtClient, pickLegacyGroundAtClient } from '../src/render/legacyScreenPickers.js';

test('pickLegacyGroundAtClient forwards picking payload to ground picker', () => {
  const domElement = { id: 'canvas' };
  const mouse = { id: 'mouse' };
  const raycaster = { id: 'raycaster' };
  const camera = { id: 'camera' };
  const groundPlane = { id: 'ground' };
  const result = pickLegacyGroundAtClient({
    clientX: 10,
    clientY: 20,
    domElement,
    mouse,
    raycaster,
    camera,
    groundPlane,
    toNdc: () => ({ x: 0, y: 0 }),
    pickGround: (payload) => {
      assert.equal(payload.clientX, 10);
      assert.equal(payload.clientY, 20);
      assert.equal(payload.domElement, domElement);
      assert.equal(payload.mouse, mouse);
      assert.equal(payload.raycaster, raycaster);
      assert.equal(payload.camera, camera);
      assert.equal(payload.groundPlane, groundPlane);
      assert.equal(typeof payload.toNdc, 'function');
      return { x: 3, z: 4 };
    },
  });

  assert.deepEqual(result, { x: 3, z: 4 });
});

test('pickLegacyEntityAtClient builds targets from building and colonist meshes', () => {
  const buildingA = { id: 'building-a' };
  const colonistA = { id: 'colonist-a' };
  const result = pickLegacyEntityAtClient({
    clientX: 6,
    clientY: 7,
    domElement: {},
    mouse: {},
    raycaster: {},
    camera: {},
    buildingMeshes: new Map([['b1', buildingA]]),
    colonistMeshes: new Map([['c1', colonistA]]),
    toNdc: () => ({ x: 0, y: 0 }),
    mapSelectionFromObject: (value) => value,
    pickEntity: (payload) => {
      assert.deepEqual(payload.targets, [buildingA, colonistA]);
      assert.equal(payload.clientX, 6);
      assert.equal(payload.clientY, 7);
      assert.equal(typeof payload.toNdc, 'function');
      assert.equal(typeof payload.mapSelectionFromObject, 'function');
      return { type: 'building', id: 'b1' };
    },
  });

  assert.deepEqual(result, { type: 'building', id: 'b1' });
});

