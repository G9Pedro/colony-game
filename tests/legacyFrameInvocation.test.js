import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyFrameInvocation } from '../src/render/legacyFrameInvocation.js';

test('buildLegacyFrameInvocation maps renderer frame state and delegates operations', () => {
  const calls = [];
  const renderer = {
    lastFrameAt: 45,
    smoothedFps: 59,
    scene: { id: 'scene' },
    camera: { id: 'camera' },
    renderer: {
      render: (...args) => calls.push({ method: 'render', args }),
    },
    syncBuildings: (...args) => calls.push({ method: 'syncBuildings', args }),
    syncColonists: (...args) => calls.push({ method: 'syncColonists', args }),
  };

  const state = { id: 'state' };
  const invocation = buildLegacyFrameInvocation({
    renderer,
    state,
    now: 500,
  });

  assert.equal(invocation.state, state);
  assert.equal(invocation.now, 500);
  assert.equal(invocation.lastFrameAt, 45);
  assert.equal(invocation.smoothedFps, 59);

  invocation.syncBuildings('next-state');
  invocation.syncColonists('next-state');
  invocation.renderScene();

  assert.deepEqual(calls, [
    { method: 'syncBuildings', args: ['next-state'] },
    { method: 'syncColonists', args: ['next-state'] },
    { method: 'render', args: [renderer.scene, renderer.camera] },
  ]);
});

