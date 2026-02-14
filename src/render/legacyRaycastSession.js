export function updateRaycasterFromClientPoint({
  clientX,
  clientY,
  domElement,
  mouse,
  raycaster,
  camera,
  toNdc,
}) {
  const rect = domElement.getBoundingClientRect();
  const ndc = toNdc(clientX, clientY, rect);
  mouse.x = ndc.x;
  mouse.y = ndc.y;
  raycaster.setFromCamera(mouse, camera);
  return ndc;
}

export function pickGroundPointFromClient({
  clientX,
  clientY,
  domElement,
  mouse,
  raycaster,
  camera,
  groundPlane,
  toNdc,
}) {
  updateRaycasterFromClientPoint({
    clientX,
    clientY,
    domElement,
    mouse,
    raycaster,
    camera,
    toNdc,
  });
  const intersects = raycaster.intersectObject(groundPlane);
  if (intersects.length === 0) {
    return null;
  }
  return intersects[0].point;
}

export function pickEntitySelectionFromClient({
  clientX,
  clientY,
  domElement,
  mouse,
  raycaster,
  camera,
  targets,
  toNdc,
  mapSelectionFromObject,
}) {
  updateRaycasterFromClientPoint({
    clientX,
    clientY,
    domElement,
    mouse,
    raycaster,
    camera,
    toNdc,
  });
  const intersects = raycaster.intersectObjects(targets, false);
  if (intersects.length === 0) {
    return null;
  }
  return mapSelectionFromObject(intersects[0].object);
}

