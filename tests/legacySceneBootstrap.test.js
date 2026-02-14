import test from 'node:test';
import assert from 'node:assert/strict';
import { bootstrapLegacyScene } from '../src/render/legacySceneBootstrap.js';

test('bootstrapLegacyScene adds lighting, ground, grid, and preview marker', () => {
  const added = [];
  const scene = {
    add: (...items) => added.push(items),
  };
  const three = { id: 'three' };
  const ambientLight = { id: 'ambient' };
  const sunlight = { id: 'sunlight' };
  const groundPlane = { id: 'ground' };
  const grid = { id: 'grid' };
  const previewMarker = { id: 'preview' };

  const result = bootstrapLegacyScene({
    scene,
    three,
    buildLighting: (incomingThree) => {
      assert.equal(incomingThree, three);
      return { ambientLight, sunlight };
    },
    buildGroundPlane: (incomingThree) => {
      assert.equal(incomingThree, three);
      return groundPlane;
    },
    buildGrid: (incomingThree) => {
      assert.equal(incomingThree, three);
      return grid;
    },
    buildPreviewMarker: (incomingThree) => {
      assert.equal(incomingThree, three);
      return previewMarker;
    },
  });

  assert.deepEqual(added, [
    [ambientLight, sunlight],
    [groundPlane],
    [grid],
    [previewMarker],
  ]);
  assert.deepEqual(result, {
    groundPlane,
    previewMarker,
  });
});

