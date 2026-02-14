import { applyLegacyCameraPose, computeLegacyCameraPosition } from './legacyCameraPose.js';
import { centerLegacyCameraOnBuilding } from './legacyRendererViewport.js';

export function dispatchLegacyCameraUpdate(renderer, deps = {}) {
  const computeCamera = deps.computeCamera ?? computeLegacyCameraPosition;
  const applyCamera = deps.applyCamera ?? applyLegacyCameraPose;
  const position = computeCamera(renderer.cameraPolar, renderer.cameraTarget);
  applyCamera(renderer.camera, renderer.cameraTarget, position);
}

export function dispatchLegacyCenterOnBuilding(renderer, building, deps = {}) {
  const centerCamera = deps.centerCamera ?? centerLegacyCameraOnBuilding;
  centerCamera(building, renderer.cameraTarget, () => dispatchLegacyCameraUpdate(renderer, deps));
}

