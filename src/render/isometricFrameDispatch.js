import { buildIsometricFrameInvocation } from './isometricFrameInvocation.js';
import { runIsometricFrame } from './isometricFramePipeline.js';
import { applyRendererFrameState } from './rendererFrameState.js';

export function dispatchIsometricFrame(renderer, state, deps = {}) {
  renderer.lastState = state;
  const performanceObject = deps.performanceObject ?? performance;
  const buildInvocation = deps.buildInvocation ?? buildIsometricFrameInvocation;
  const runFrame = deps.runFrame ?? runIsometricFrame;
  const applyFrameState = deps.applyFrameState ?? applyRendererFrameState;

  const frame = runFrame(buildInvocation({
    renderer,
    state,
    now: performanceObject.now(),
  }));
  applyFrameState(renderer, frame);
}

