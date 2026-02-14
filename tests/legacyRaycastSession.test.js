import test from 'node:test';
import assert from 'node:assert/strict';
import {
  pickEntitySelectionFromClient,
  pickGroundPointFromClient,
  updateRaycasterFromClientPoint,
} from '../src/render/legacyRaycastSession.js';

function createSessionHarness() {
  const calls = {
    setFromCamera: 0,
    intersectObject: 0,
    intersectObjects: 0,
  };
  const domElement = {
    getBoundingClientRect: () => ({ left: 10, top: 20, width: 200, height: 100 }),
  };
  const mouse = { x: 0, y: 0 };
  const camera = { id: 'camera' };
  const raycaster = {
    setFromCamera(_mouse, _camera) {
      calls.setFromCamera += 1;
    },
    intersectObject() {
      calls.intersectObject += 1;
      return [];
    },
    intersectObjects() {
      calls.intersectObjects += 1;
      return [];
    },
  };
  return { calls, domElement, mouse, camera, raycaster };
}

test('updateRaycasterFromClientPoint projects mouse and sets ray', () => {
  const { calls, domElement, mouse, camera, raycaster } = createSessionHarness();
  const ndc = updateRaycasterFromClientPoint({
    clientX: 88,
    clientY: 66,
    domElement,
    mouse,
    raycaster,
    camera,
    toNdc: () => ({ x: -0.25, y: 0.4 }),
  });

  assert.deepEqual(ndc, { x: -0.25, y: 0.4 });
  assert.equal(mouse.x, -0.25);
  assert.equal(mouse.y, 0.4);
  assert.equal(calls.setFromCamera, 1);
});

test('pickGroundPointFromClient returns first ground hit point', () => {
  const { domElement, mouse, camera, raycaster } = createSessionHarness();
  raycaster.intersectObject = () => [{ point: { x: 2, y: 0, z: -4 } }];

  const point = pickGroundPointFromClient({
    clientX: 10,
    clientY: 20,
    domElement,
    mouse,
    raycaster,
    camera,
    groundPlane: { id: 'ground' },
    toNdc: () => ({ x: 0, y: 0 }),
  });

  assert.deepEqual(point, { x: 2, y: 0, z: -4 });
});

test('pickEntitySelectionFromClient maps first entity hit payload', () => {
  const { domElement, mouse, camera, raycaster } = createSessionHarness();
  raycaster.intersectObjects = () => [{ object: { id: 'mesh-1' } }];

  const hit = pickEntitySelectionFromClient({
    clientX: 10,
    clientY: 20,
    domElement,
    mouse,
    raycaster,
    camera,
    targets: [{ id: 'mesh-1' }],
    toNdc: () => ({ x: 0, y: 0 }),
    mapSelectionFromObject: (object) => ({ entityId: object.id }),
  });

  assert.deepEqual(hit, { entityId: 'mesh-1' });
});

