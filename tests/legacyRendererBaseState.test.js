import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyRendererBaseState } from '../src/render/legacyRendererBaseState.js';

test('createLegacyRendererBaseState initializes callbacks, frame timing, and scene', () => {
  const createdScenes = [];
  const three = {
    Scene: class {
      constructor() {
        this.background = null;
        createdScenes.push(this);
      }
    },
    Color: class {
      constructor(value) {
        this.value = value;
      }
    },
  };
  const rootElement = { id: 'root' };

  const state = createLegacyRendererBaseState({
    rootElement,
    three,
    performanceObject: { now: () => 1234 },
  });

  assert.equal(state.rootElement, rootElement);
  assert.equal(state.onGroundClick, null);
  assert.equal(state.onPlacementPreview, null);
  assert.equal(state.onEntitySelect, null);
  assert.equal(state.lastFrameAt, 1234);
  assert.equal(state.smoothedFps, 60);
  assert.equal(createdScenes.length, 1);
  assert.equal(state.scene, createdScenes[0]);
  assert.equal(state.scene.background.value, 0x9ad6f7);
});

