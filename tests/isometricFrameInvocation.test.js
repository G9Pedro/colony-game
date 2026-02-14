import test from 'node:test';
import assert from 'node:assert/strict';
import { buildIsometricFrameInvocation } from '../src/render/isometricFrameInvocation.js';

test('buildIsometricFrameInvocation maps renderer runtime and delegates callbacks', () => {
  const calls = [];
  const renderer = {
    lastFrameAt: 100,
    smoothedFps: 58,
    camera: { id: 'camera' },
    qualityController: { id: 'quality' },
    particles: { id: 'particles' },
    hoveredEntity: { id: 'hovered' },
    selectedEntity: { id: 'selected' },
    ctx: { id: 'ctx' },
    animations: {
      getSelectionPulse: (time) => {
        calls.push({ method: 'getSelectionPulse', time });
        return 0.7;
      },
    },
    sampleResourceGains: (...args) => calls.push({ method: 'sampleResourceGains', args }),
    syncBuildingAnimations: (...args) => calls.push({ method: 'syncBuildingAnimations', args }),
    updateColonistInterpolation: (...args) => calls.push({ method: 'updateColonistInterpolation', args }),
    maybeEmitBuildingEffects: (...args) => calls.push({ method: 'maybeEmitBuildingEffects', args }),
    drawBackground: (...args) => calls.push({ method: 'drawBackground', args }),
    drawTerrain: (...args) => calls.push({ method: 'drawTerrain', args }),
    drawEntities: (...args) => calls.push({ method: 'drawEntities', args }),
    drawPreview: (...args) => calls.push({ method: 'drawPreview', args }),
    drawSelectionOverlay: (...args) => calls.push({ method: 'drawSelectionOverlay', args }),
  };
  const state = { id: 'state' };
  const invocation = buildIsometricFrameInvocation({
    renderer,
    state,
    now: 250,
  });

  assert.equal(invocation.state, state);
  assert.equal(invocation.now, 250);
  assert.equal(invocation.lastFrameAt, 100);
  assert.equal(invocation.smoothedFps, 58);
  assert.equal(invocation.camera, renderer.camera);
  assert.equal(invocation.qualityController, renderer.qualityController);
  assert.equal(invocation.particles, renderer.particles);
  assert.equal(invocation.hoveredEntity, renderer.hoveredEntity);
  assert.equal(invocation.selectedEntity, renderer.selectedEntity);
  assert.equal(invocation.ctx, renderer.ctx);

  invocation.sampleResourceGains('s', 0.1);
  invocation.syncBuildingAnimations('s', 5);
  invocation.updateColonistInterpolation('s', 0.2);
  invocation.maybeEmitBuildingEffects('s', 0.3);
  invocation.drawBackground('s', 10, 20, 0.5);
  invocation.drawTerrain('s');
  invocation.drawEntities('s', 6, 0.9);
  invocation.drawPreview();
  invocation.drawSelectionOverlay({ id: 'entity' }, 0.8);
  const pulse = invocation.getSelectionPulse(12);

  assert.equal(pulse, 0.7);
  assert.deepEqual(calls, [
    { method: 'sampleResourceGains', args: ['s', 0.1] },
    { method: 'syncBuildingAnimations', args: ['s', 5] },
    { method: 'updateColonistInterpolation', args: ['s', 0.2] },
    { method: 'maybeEmitBuildingEffects', args: ['s', 0.3] },
    { method: 'drawBackground', args: ['s', 10, 20, 0.5] },
    { method: 'drawTerrain', args: ['s'] },
    { method: 'drawEntities', args: ['s', 6, 0.9] },
    { method: 'drawPreview', args: [] },
    { method: 'drawSelectionOverlay', args: [{ id: 'entity' }, 0.8] },
    { method: 'getSelectionPulse', time: 12 },
  ]);
});

