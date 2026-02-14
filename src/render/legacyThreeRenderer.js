import * as THREE from '../../node_modules/three/build/three.module.js';
import { dispatchLegacyCameraUpdate } from './legacyCameraDispatch.js';
import { dispatchLegacyFrame } from './legacyFrameDispatch.js';
import { initializeLegacyThreeRenderer } from './legacyRendererInitialization.js';
import { dispatchLegacyEventSessionBind } from './legacyEventSessionDispatch.js';
import {
  dispatchLegacyEntitySelectHandler,
  dispatchLegacyGroundClickHandler,
  dispatchLegacyPlacementPreviewHandler,
} from './legacyRendererCallbacksDispatch.js';
import {
  dispatchLegacyCameraCenter,
  dispatchLegacyEntityPickAtScreen,
  dispatchLegacyGroundPickAtScreen,
  dispatchLegacyPlacementMarker,
  dispatchLegacyPreviewClear,
  dispatchLegacyPreviewSet,
  dispatchLegacyViewportResize,
} from './legacyRendererSurfaceDispatch.js';
import {
  dispatchLegacyPointerDownInteraction,
  dispatchLegacyPointerMoveInteraction,
  dispatchLegacyPointerUpInteraction,
  dispatchLegacyTouchEndInteraction,
  dispatchLegacyTouchMoveInteraction,
  dispatchLegacyTouchStartInteraction,
  dispatchLegacyWheelInteraction,
} from './legacyRendererInteractionDispatch.js';
import {
  buildLegacyRendererCameraSnapshot,
  buildLegacyRendererDebugSnapshot,
  dispatchLegacyBuildingSyncWithThree,
  dispatchLegacyColonistSyncWithThree,
  dispatchLegacyRendererDispose,
} from './legacyRendererRuntimeDispatch.js';

export class LegacyThreeRenderer {
  constructor(rootElement) {
    initializeLegacyThreeRenderer(this, {
      rootElement,
      three: THREE,
      performanceObject: performance,
      windowObject: window,
      maxPixelRatio: 2,
    });
  }

  bindEvents() {
    dispatchLegacyEventSessionBind(this);
  }

  updateCamera() {
    dispatchLegacyCameraUpdate(this);
  }

  resize() {
    dispatchLegacyViewportResize(this);
  }

  setGroundClickHandler(handler) {
    dispatchLegacyGroundClickHandler(this, handler);
  }

  setPlacementPreviewHandler(handler) {
    dispatchLegacyPlacementPreviewHandler(this, handler);
  }

  setEntitySelectHandler(handler) {
    dispatchLegacyEntitySelectHandler(this, handler);
  }

  screenToGround(clientX, clientY) {
    return dispatchLegacyGroundPickAtScreen(this, clientX, clientY);
  }

  screenToEntity(clientX, clientY) {
    return dispatchLegacyEntityPickAtScreen(this, clientX, clientY);
  }

  handlePointerDown(event) {
    dispatchLegacyPointerDownInteraction(this, event);
  }

  handlePointerMove(event) {
    dispatchLegacyPointerMoveInteraction(this, event);
  }

  handlePointerUp(event) {
    dispatchLegacyPointerUpInteraction(this, event);
  }

  handleWheel(event) {
    dispatchLegacyWheelInteraction(this, event);
  }

  handleTouchStart(event) {
    dispatchLegacyTouchStartInteraction(this, event);
  }

  handleTouchMove(event) {
    dispatchLegacyTouchMoveInteraction(this, event);
  }

  handleTouchEnd() {
    dispatchLegacyTouchEndInteraction(this);
  }

  setPreviewPosition(position, valid = true) {
    dispatchLegacyPreviewSet(this, position, valid);
  }

  clearPreview() {
    dispatchLegacyPreviewClear(this);
  }

  updatePlacementMarker(position, valid) {
    dispatchLegacyPlacementMarker(this, position, valid);
  }

  centerOnBuilding(building) {
    dispatchLegacyCameraCenter(this, building);
  }

  getCameraState() {
    return buildLegacyRendererCameraSnapshot(this);
  }

  getDebugStats() {
    return buildLegacyRendererDebugSnapshot(this);
  }

  syncBuildings(state) {
    dispatchLegacyBuildingSyncWithThree(this, state, THREE);
  }

  syncColonists(state) {
    dispatchLegacyColonistSyncWithThree(this, state, THREE);
  }

  render(state) {
    dispatchLegacyFrame(this, state);
  }

  dispose() {
    dispatchLegacyRendererDispose(this);
  }
}

