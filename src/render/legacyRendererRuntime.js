import {
  createLegacyCameraRig,
  createLegacyInteractionState,
  createLegacyWebGLRenderer,
} from './legacyRendererBootstrap.js';
import { bootstrapLegacyScene } from './legacySceneBootstrap.js';

export function createLegacyRendererRuntime({
  rootElement,
  scene,
  three,
  windowObject = window,
  maxPixelRatio = 2,
  createCameraRig = createLegacyCameraRig,
  createRenderer = createLegacyWebGLRenderer,
  createInteractionState = createLegacyInteractionState,
  bootstrapScene = bootstrapLegacyScene,
}) {
  const cameraRig = createCameraRig(three);
  const renderer = createRenderer({
    rootElement,
    three,
    windowObject,
    maxPixelRatio,
  });
  const interactionState = createInteractionState(three);
  const sceneState = bootstrapScene({ scene, three });

  return {
    camera: cameraRig.camera,
    cameraTarget: cameraRig.cameraTarget,
    cameraPolar: cameraRig.cameraPolar,
    renderer,
    raycaster: interactionState.raycaster,
    mouse: interactionState.mouse,
    dragState: interactionState.dragState,
    touchState: interactionState.touchState,
    buildingMeshes: interactionState.buildingMeshes,
    colonistMeshes: interactionState.colonistMeshes,
    groundPlane: sceneState.groundPlane,
    previewMarker: sceneState.previewMarker,
  };
}

