import { buildEntitySelectionFromObject, clientToNdc } from './legacyRaycastUtils.js';
import { pickEntitySelectionFromClient, pickGroundPointFromClient } from './legacyRaycastSession.js';

export function pickLegacyGroundAtClient({
  clientX,
  clientY,
  domElement,
  mouse,
  raycaster,
  camera,
  groundPlane,
  pickGround = pickGroundPointFromClient,
  toNdc = clientToNdc,
}) {
  return pickGround({
    clientX,
    clientY,
    domElement,
    mouse,
    raycaster,
    camera,
    groundPlane,
    toNdc,
  });
}

export function pickLegacyEntityAtClient({
  clientX,
  clientY,
  domElement,
  mouse,
  raycaster,
  camera,
  buildingMeshes,
  colonistMeshes,
  pickEntity = pickEntitySelectionFromClient,
  toNdc = clientToNdc,
  mapSelectionFromObject = buildEntitySelectionFromObject,
}) {
  const targets = [
    ...buildingMeshes.values(),
    ...colonistMeshes.values(),
  ];
  return pickEntity({
    clientX,
    clientY,
    domElement,
    mouse,
    raycaster,
    camera,
    targets,
    toNdc,
    mapSelectionFromObject,
  });
}

