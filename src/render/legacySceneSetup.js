export function createLegacyLighting(three) {
  const ambientLight = new three.AmbientLight(0xffffff, 0.72);
  const sunlight = new three.DirectionalLight(0xffffff, 1.15);
  sunlight.position.set(22, 40, 12);
  return { ambientLight, sunlight };
}

export function createLegacyGroundPlane(three) {
  const groundGeometry = new three.PlaneGeometry(64, 64, 1, 1);
  const groundMaterial = new three.MeshLambertMaterial({ color: 0x4d7c0f });
  const groundPlane = new three.Mesh(groundGeometry, groundMaterial);
  groundPlane.rotation.x = -Math.PI / 2;
  groundPlane.position.y = 0;
  groundPlane.userData.isGround = true;
  return groundPlane;
}

export function createLegacyGrid(three) {
  const grid = new three.GridHelper(64, 32, 0x334155, 0x64748b);
  grid.position.y = 0.01;
  return grid;
}

export function createLegacyPreviewMarker(three) {
  const markerGeometry = new three.CylinderGeometry(0.6, 0.6, 0.14, 16);
  const markerMaterial = new three.MeshBasicMaterial({
    color: 0x22c55e,
    transparent: true,
    opacity: 0.65,
  });
  const previewMarker = new three.Mesh(markerGeometry, markerMaterial);
  previewMarker.position.y = 0.08;
  previewMarker.visible = false;
  return previewMarker;
}

