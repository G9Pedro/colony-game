import {
  createLegacyGrid,
  createLegacyGroundPlane,
  createLegacyLighting,
  createLegacyPreviewMarker,
} from './legacySceneSetup.js';

export function bootstrapLegacyScene({
  scene,
  three,
  buildLighting = createLegacyLighting,
  buildGroundPlane = createLegacyGroundPlane,
  buildGrid = createLegacyGrid,
  buildPreviewMarker = createLegacyPreviewMarker,
}) {
  const { ambientLight, sunlight } = buildLighting(three);
  scene.add(ambientLight, sunlight);

  const groundPlane = buildGroundPlane(three);
  scene.add(groundPlane);

  const grid = buildGrid(three);
  scene.add(grid);

  const previewMarker = buildPreviewMarker(three);
  scene.add(previewMarker);

  return {
    groundPlane,
    previewMarker,
  };
}

