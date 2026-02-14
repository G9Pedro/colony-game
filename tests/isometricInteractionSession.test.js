import test from 'node:test';
import assert from 'node:assert/strict';
import { createIsometricInteractionSession } from '../src/render/isometricInteractionSession.js';

test('createIsometricInteractionSession wires preview, hover, and click callbacks', () => {
  const calls = [];
  class InteractionControllerMock {
    constructor(config) {
      this.config = config;
    }
  }
  const renderer = {
    canvas: { id: 'canvas' },
    camera: { id: 'camera' },
    onPlacementPreview: (point) => calls.push({ method: 'onPlacementPreview', args: [point] }),
    updateHoverSelection: (...args) => calls.push({ method: 'updateHoverSelection', args }),
    handleClick: (...args) => calls.push({ method: 'handleClick', args }),
  };

  const session = createIsometricInteractionSession({
    renderer,
    InteractionControllerClass: InteractionControllerMock,
  });
  assert.equal(session instanceof InteractionControllerMock, true);
  assert.equal(session.config.canvas, renderer.canvas);
  assert.equal(session.config.camera, renderer.camera);

  session.config.onPreview({ tile: { x: 2, z: 3 } });
  session.config.onHover({ local: { x: 4, y: 5 } });
  session.config.onClick({ local: { x: 6, y: 7 }, tile: { x: 8, z: 9 } });

  assert.deepEqual(calls, [
    { method: 'onPlacementPreview', args: [{ x: 2, z: 3 }] },
    { method: 'updateHoverSelection', args: [4, 5] },
    { method: 'handleClick', args: [6, 7, { x: 8, z: 9 }] },
  ]);
});

test('createIsometricInteractionSession ignores preview callback when unavailable', () => {
  class InteractionControllerMock {
    constructor(config) {
      this.config = config;
    }
  }
  const renderer = {
    canvas: {},
    camera: {},
    onPlacementPreview: null,
    updateHoverSelection: () => {},
    handleClick: () => {},
  };
  const session = createIsometricInteractionSession({
    renderer,
    InteractionControllerClass: InteractionControllerMock,
  });

  assert.doesNotThrow(() => {
    session.config.onPreview({ tile: { x: 1, z: 1 } });
  });
});

