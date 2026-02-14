import test from 'node:test';
import assert from 'node:assert/strict';
import {
  bindLegacyRendererEvents,
  disposeLegacyRendererRuntime,
  disposeMeshMap,
} from '../src/render/legacyRendererLifecycle.js';

function createEventTargetMock() {
  const added = [];
  const removed = [];
  return {
    added,
    removed,
    addEventListener(type, handler, options) {
      added.push({ type, handler, options });
    },
    removeEventListener(type, handler) {
      removed.push({ type, handler });
    },
  };
}

test('bindLegacyRendererEvents registers and unregisters all listeners', () => {
  const windowMock = createEventTargetMock();
  const domMock = createEventTargetMock();
  const handlers = {
    onResize: () => {},
    onPointerDown: () => {},
    onPointerMove: () => {},
    onPointerUp: () => {},
    onWheel: () => {},
    onTouchStart: () => {},
    onTouchMove: () => {},
    onTouchEnd: () => {},
  };

  const unbind = bindLegacyRendererEvents({
    windowObject: windowMock,
    domElement: domMock,
    ...handlers,
  });

  assert.deepEqual(
    windowMock.added.map((entry) => entry.type),
    ['resize'],
  );
  assert.deepEqual(
    domMock.added.map((entry) => entry.type),
    ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'touchstart', 'touchmove', 'touchend'],
  );
  assert.deepEqual(
    domMock.added.filter((entry) => entry.type === 'wheel').map((entry) => entry.options),
    [{ passive: false }],
  );
  assert.deepEqual(
    domMock.added
      .filter((entry) => entry.type.startsWith('touch'))
      .map((entry) => entry.options),
    [{ passive: false }, { passive: false }, { passive: false }],
  );

  unbind();

  assert.deepEqual(
    windowMock.removed.map((entry) => entry.type),
    ['resize'],
  );
  assert.deepEqual(
    domMock.removed.map((entry) => entry.type),
    ['pointerdown', 'pointermove', 'pointerup', 'wheel', 'touchstart', 'touchmove', 'touchend'],
  );
});

test('disposeMeshMap disposes geometry/material and clears map', () => {
  const disposed = [];
  const meshMap = new Map([
    ['a', {
      geometry: { dispose: () => disposed.push('g-a') },
      material: { dispose: () => disposed.push('m-a') },
    }],
    ['b', {
      geometry: { dispose: () => disposed.push('g-b') },
      material: [
        { dispose: () => disposed.push('m-b1') },
        { dispose: () => disposed.push('m-b2') },
      ],
    }],
  ]);

  disposeMeshMap(meshMap);

  assert.deepEqual(disposed, ['g-a', 'm-a', 'g-b', 'm-b1', 'm-b2']);
  assert.equal(meshMap.size, 0);
});

test('disposeLegacyRendererRuntime clears session, disposes mesh maps, and tears down renderer', () => {
  const calls = [];
  const unbindEvents = () => calls.push('unbind');
  const renderer = {
    dispose: () => calls.push('dispose-renderer'),
    domElement: {
      remove: () => calls.push('remove-dom'),
    },
  };
  const buildingMeshes = new Map();
  const colonistMeshes = new Map();

  disposeLegacyRendererRuntime({
    unbindEvents,
    setUnbindEvents: (value) => calls.push({ setUnbindEvents: value }),
    buildingMeshes,
    colonistMeshes,
    renderer,
    disposeMeshMapFn: (meshMap) => calls.push({ disposeMeshMap: meshMap }),
  });

  assert.deepEqual(calls, [
    'unbind',
    { setUnbindEvents: null },
    { disposeMeshMap: buildingMeshes },
    { disposeMeshMap: colonistMeshes },
    'dispose-renderer',
    'remove-dom',
  ]);
});

