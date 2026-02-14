import test from 'node:test';
import assert from 'node:assert/strict';
import { createLegacyRendererRuntime } from '../src/render/legacyRendererRuntime.js';

test('createLegacyRendererRuntime composes camera, interaction, and scene state', () => {
  const rootElement = { id: 'root' };
  const scene = { id: 'scene' };
  const three = { id: 'three' };
  const windowObject = { devicePixelRatio: 2 };
  const camera = { id: 'camera' };
  const cameraTarget = { id: 'target' };
  const cameraPolar = { radius: 42, yaw: 1, pitch: 0.7 };
  const renderer = { id: 'renderer' };
  const raycaster = { id: 'raycaster' };
  const mouse = { id: 'mouse' };
  const dragState = { active: false };
  const touchState = { isPinching: false };
  const buildingMeshes = new Map();
  const colonistMeshes = new Map();
  const groundPlane = { id: 'ground' };
  const previewMarker = { id: 'preview' };

  const runtime = createLegacyRendererRuntime({
    rootElement,
    scene,
    three,
    windowObject,
    maxPixelRatio: 1.5,
    createCameraRig: (incomingThree) => {
      assert.equal(incomingThree, three);
      return { camera, cameraTarget, cameraPolar };
    },
    createRenderer: ({ rootElement: incomingRoot, scene: incomingScene, three: incomingThree, windowObject: incomingWindow, maxPixelRatio }) => {
      assert.equal(incomingRoot, rootElement);
      assert.equal(incomingThree, three);
      assert.equal(incomingWindow, windowObject);
      assert.equal(maxPixelRatio, 1.5);
      assert.equal(incomingScene, undefined);
      return renderer;
    },
    createInteractionState: (incomingThree) => {
      assert.equal(incomingThree, three);
      return {
        raycaster,
        mouse,
        dragState,
        touchState,
        buildingMeshes,
        colonistMeshes,
      };
    },
    bootstrapScene: ({ scene: incomingScene, three: incomingThree }) => {
      assert.equal(incomingScene, scene);
      assert.equal(incomingThree, three);
      return { groundPlane, previewMarker };
    },
  });

  assert.deepEqual(runtime, {
    camera,
    cameraTarget,
    cameraPolar,
    renderer,
    raycaster,
    mouse,
    dragState,
    touchState,
    buildingMeshes,
    colonistMeshes,
    groundPlane,
    previewMarker,
  });
});

