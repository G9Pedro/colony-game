import { buildLegacyBuildingSyncInvocation, buildLegacyColonistSyncInvocation } from './legacyMeshSyncInvocation.js';
import { syncLegacyBuildingMeshes, syncLegacyColonistMeshes } from './legacyRenderSync.js';

export function dispatchLegacyBuildingSync(renderer, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyBuildingSyncInvocation;
  const syncMeshes = deps.syncMeshes ?? syncLegacyBuildingMeshes;
  const dependencies = deps.dependencies ?? {};
  syncMeshes(buildInvocation(renderer, state, dependencies));
}

export function dispatchLegacyColonistSync(renderer, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyColonistSyncInvocation;
  const syncMeshes = deps.syncMeshes ?? syncLegacyColonistMeshes;
  const dependencies = deps.dependencies ?? {};
  syncMeshes(buildInvocation(renderer, state, dependencies));
}

