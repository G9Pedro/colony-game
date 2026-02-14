import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIsometricEntityDrawInvocation } from '../src/render/isometricEntityDrawInvocation.js';

test('buildIsometricEntityDrawInvocation maps renderer draw dependencies and setter', () => {
  const renderer = {
    camera: { id: 'camera' },
    spriteFactory: { id: 'spriteFactory' },
    animations: { id: 'animations' },
    particles: { id: 'particles' },
    colonistRenderState: { id: 'colonistRenderState' },
    ctx: { id: 'ctx' },
    interactiveEntities: [],
  };
  const state = { tick: 10 };

  const invocation = buildIsometricEntityDrawInvocation(renderer, state, 15, 0.7);

  assert.equal(invocation.state, state);
  assert.equal(invocation.now, 15);
  assert.equal(invocation.daylight, 0.7);
  assert.equal(invocation.camera, renderer.camera);
  assert.equal(invocation.spriteFactory, renderer.spriteFactory);
  assert.equal(invocation.animations, renderer.animations);
  assert.equal(invocation.particles, renderer.particles);
  assert.equal(invocation.colonistRenderState, renderer.colonistRenderState);
  assert.equal(invocation.ctx, renderer.ctx);

  invocation.setInteractiveEntities([{ id: 'entity' }]);
  assert.deepEqual(renderer.interactiveEntities, [{ id: 'entity' }]);
});

