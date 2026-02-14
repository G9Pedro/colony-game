import test from 'node:test';
import assert from 'node:assert/strict';
import { runIsometricFrame } from '../src/render/isometricFramePipeline.js';

test('runIsometricFrame executes frame context, dynamics, and draw stages', () => {
  const calls = [];
  const state = { id: 'state-1', day: 3 };
  const frame = runIsometricFrame({
    state,
    now: 1000,
    lastFrameAt: 950,
    smoothedFps: 56,
    camera: { id: 'camera' },
    qualityController: { id: 'quality' },
    particles: { id: 'particles' },
    sampleResourceGains: () => calls.push('sampleResourceGains'),
    syncBuildingAnimations: () => calls.push('syncBuildingAnimations'),
    updateColonistInterpolation: () => calls.push('updateColonistInterpolation'),
    maybeEmitBuildingEffects: () => calls.push('maybeEmitBuildingEffects'),
    drawBackground: () => calls.push('drawBackground'),
    drawTerrain: () => calls.push('drawTerrain'),
    drawEntities: () => calls.push('drawEntities'),
    drawPreview: () => calls.push('drawPreview'),
    hoveredEntity: { id: 'hovered' },
    selectedEntity: { id: 'selected' },
    drawSelectionOverlay: () => calls.push('drawSelectionOverlay'),
    getSelectionPulse: () => 1,
    ctx: { id: 'ctx' },
    buildFrameContext: (payload) => {
      calls.push({ type: 'context', payload });
      return {
        now: payload.now,
        width: 1280,
        height: 720,
        daylight: 0.8,
        deltaSeconds: 0.05,
        nextLastFrameAt: payload.now,
        nextSmoothedFps: 57,
      };
    },
    runFrameDynamics: (payload) => {
      calls.push({ type: 'dynamics', payload });
    },
    runFrameDraw: (payload) => {
      calls.push({ type: 'draw', payload });
    },
  });

  assert.equal(frame.nextLastFrameAt, 1000);
  assert.equal(frame.nextSmoothedFps, 57);
  assert.equal(calls[0].type, 'context');
  assert.equal(calls[1].type, 'dynamics');
  assert.equal(calls[2].type, 'draw');
  assert.equal(calls[1].payload.state, state);
  assert.equal(calls[2].payload.state, state);
});

test('runIsometricFrame forwards custom timing and visual dependencies', () => {
  const records = [];
  runIsometricFrame({
    state: { day: 5 },
    now: 200,
    lastFrameAt: 150,
    smoothedFps: 60,
    camera: {},
    qualityController: {},
    particles: {},
    sampleResourceGains: () => {},
    syncBuildingAnimations: () => {},
    updateColonistInterpolation: () => {},
    maybeEmitBuildingEffects: () => {},
    drawBackground: () => {},
    drawTerrain: () => {},
    drawEntities: () => {},
    drawPreview: () => {},
    hoveredEntity: null,
    selectedEntity: null,
    drawSelectionOverlay: () => {},
    getSelectionPulse: () => 0,
    ctx: {},
    maxDeltaSeconds: 0.2,
    fpsSmoothing: 0.75,
    computeFrameDeltaSecondsFn: () => 0.1,
    updateSmoothedFpsFn: () => 62,
    getDaylightFactorFn: () => 0.9,
    getSeasonTintFn: () => 'rgba(0,0,0,0.1)',
    drawTimeAndSeasonOverlaysFn: () => records.push('seasonOverlay'),
    buildFrameContext: (payload) => {
      records.push({
        maxDeltaSeconds: payload.maxDeltaSeconds,
        fpsSmoothing: payload.fpsSmoothing,
        hasGetDaylight: typeof payload.getDaylightFactor,
      });
      return {
        now: payload.now,
        deltaSeconds: 0.1,
        width: 800,
        height: 600,
        daylight: 0.9,
        nextLastFrameAt: payload.now,
        nextSmoothedFps: 62,
      };
    },
    runFrameDynamics: () => {},
    runFrameDraw: (payload) => {
      payload.drawTimeAndSeasonOverlays();
      payload.getSeasonTint(5);
    },
  });

  assert.deepEqual(records, [
    { maxDeltaSeconds: 0.2, fpsSmoothing: 0.75, hasGetDaylight: 'function' },
    'seasonOverlay',
  ]);
});

