import { BUILDING_DEFINITIONS } from '../content/buildings.js';
import { createLegacyBuildingMesh, createLegacyColonistMesh } from './legacyMeshFactory.js';
import { reconcileMeshMap, updateColonistMeshPose } from './legacyEntitySync.js';

export function buildLegacyBuildingSyncInvocation(renderer, state, { three }) {
  return {
    state,
    buildingMeshes: renderer.buildingMeshes,
    scene: renderer.scene,
    three,
    buildingDefinitions: BUILDING_DEFINITIONS,
    reconcileMeshMap,
    createLegacyBuildingMesh,
  };
}

export function buildLegacyColonistSyncInvocation(renderer, state, { three }) {
  return {
    state,
    colonistMeshes: renderer.colonistMeshes,
    scene: renderer.scene,
    three,
    reconcileMeshMap,
    createLegacyColonistMesh,
    updateColonistMeshPose,
  };
}

