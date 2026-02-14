import test from 'node:test';
import assert from 'node:assert/strict';
import { buildBuildingThumbnailCrop, drawBuildingThumbnail } from '../src/render/spriteThumbnailRenderer.js';

test('buildBuildingThumbnailCrop returns centered crop bounds', () => {
  const crop = buildBuildingThumbnailCrop({ width: 160, height: 160 });
  assert.deepEqual(crop, {
    sourceX: 22,
    sourceY: 26,
    sourceWidth: 116,
    sourceHeight: 126,
  });
});

test('drawBuildingThumbnail delegates drawImage with computed crop', () => {
  const calls = [];
  const ctx = {
    drawImage: (...args) => {
      calls.push(args);
    },
  };
  const source = { width: 200, height: 180 };

  drawBuildingThumbnail(ctx, source, 58, {
    buildCrop: () => ({
      sourceX: 10,
      sourceY: 12,
      sourceWidth: 90,
      sourceHeight: 70,
    }),
  });

  assert.deepEqual(calls, [[source, 10, 12, 90, 70, 0, 0, 58, 58]]);
});

