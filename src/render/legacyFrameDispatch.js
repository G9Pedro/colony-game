import { buildLegacyFrameInvocation } from './legacyFrameInvocation.js';
import { runLegacyFrame } from './legacyFrameRender.js';
import { applyRendererFrameState } from './rendererFrameState.js';

export function dispatchLegacyFrame(renderer, state, deps = {}) {
  const performanceObject = deps.performanceObject ?? performance;
  const buildInvocation = deps.buildInvocation ?? buildLegacyFrameInvocation;
  const runFrame = deps.runFrame ?? runLegacyFrame;
  const applyFrameState = deps.applyFrameState ?? applyRendererFrameState;

  const frame = runFrame(buildInvocation({
    renderer,
    state,
    now: performanceObject.now(),
  }));
  applyFrameState(renderer, frame);
}

