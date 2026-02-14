import test from 'node:test';
import assert from 'node:assert/strict';
import {
  centerSceneRendererOnBuilding,
  disposeSceneRenderer,
  getSceneRendererAvailableModes,
  renderSceneRendererFrame,
  resizeSceneRenderer,
} from '../src/render/sceneRendererRuntimeDispatch.js';

test('getSceneRendererAvailableModes returns stable supported modes list copy', () => {
  const modes = getSceneRendererAvailableModes();
  assert.deepEqual(modes, ['isometric', 'three']);
  modes.push('unexpected');
  assert.deepEqual(getSceneRendererAvailableModes(), ['isometric', 'three']);
});

test('centerSceneRendererOnBuilding delegates to active renderer', () => {
  const calls = [];
  const building = { id: 'hut-1' };
  const renderer = {
    activeRenderer: {
      centerOnBuilding: (nextBuilding) => calls.push(nextBuilding),
    },
  };

  centerSceneRendererOnBuilding(renderer, building);
  assert.deepEqual(calls, [building]);
});

test('resizeSceneRenderer delegates to active renderer', () => {
  const calls = [];
  const renderer = {
    activeRenderer: {
      resize: () => calls.push('resize'),
    },
  };

  resizeSceneRenderer(renderer);
  assert.deepEqual(calls, ['resize']);
});

test('renderSceneRendererFrame records state and delegates render', () => {
  const calls = [];
  const state = { tick: 42 };
  const renderer = {
    lastState: null,
    activeRenderer: {
      render: (nextState) => calls.push(nextState),
    },
  };

  renderSceneRendererFrame(renderer, state);
  assert.equal(renderer.lastState, state);
  assert.deepEqual(calls, [state]);
});

test('disposeSceneRenderer disposes active renderer and nulls reference', () => {
  const calls = [];
  const renderer = {
    activeRenderer: {
      dispose: () => calls.push('dispose'),
    },
  };

  disposeSceneRenderer(renderer);
  assert.deepEqual(calls, ['dispose']);
  assert.equal(renderer.activeRenderer, null);
});

test('scene renderer runtime dispatch helpers tolerate missing active renderer', () => {
  const renderer = { activeRenderer: null, lastState: null };
  assert.doesNotThrow(() => centerSceneRendererOnBuilding(renderer, { id: 'x' }));
  assert.doesNotThrow(() => resizeSceneRenderer(renderer));
  assert.doesNotThrow(() => disposeSceneRenderer(renderer));
});

