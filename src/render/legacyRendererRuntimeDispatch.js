import { dispatchLegacyBuildingSync, dispatchLegacyColonistSync } from './legacyMeshSyncDispatch.js';
import { buildLegacyDisposeInvocation } from './legacyDisposeInvocation.js';
import { disposeLegacyRendererRuntime } from './legacyRendererLifecycle.js';
import { buildLegacyCameraState, buildLegacyDebugStats } from './legacyRendererSnapshots.js';

export function buildLegacyRendererCameraSnapshot(renderer, deps = {}) {
  const buildCameraState = deps.buildCameraState ?? buildLegacyCameraState;
  const worldRadius = deps.worldRadius ?? 30;
  return buildCameraState({
    rootElement: renderer.rootElement,
    cameraTarget: renderer.cameraTarget,
    worldRadius,
  });
}

export function buildLegacyRendererDebugSnapshot(renderer, deps = {}) {
  const buildDebugStats = deps.buildDebugStats ?? buildLegacyDebugStats;
  return buildDebugStats(renderer.smoothedFps);
}

export function dispatchLegacyBuildingSyncWithThree(renderer, state, three, deps = {}) {
  const syncBuildings = deps.syncBuildings ?? dispatchLegacyBuildingSync;
  syncBuildings(renderer, state, { dependencies: { three } });
}

export function dispatchLegacyColonistSyncWithThree(renderer, state, three, deps = {}) {
  const syncColonists = deps.syncColonists ?? dispatchLegacyColonistSync;
  syncColonists(renderer, state, { dependencies: { three } });
}

export function dispatchLegacyRendererDispose(renderer, deps = {}) {
  const buildDisposePayload = deps.buildDisposePayload ?? buildLegacyDisposeInvocation;
  const disposeRuntime = deps.disposeRuntime ?? disposeLegacyRendererRuntime;
  disposeRuntime(buildDisposePayload(renderer));
}

