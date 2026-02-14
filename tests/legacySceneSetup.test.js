import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createLegacyGrid,
  createLegacyGroundPlane,
  createLegacyLighting,
  createLegacyPreviewMarker,
} from '../src/render/legacySceneSetup.js';

function createThreeMock() {
  class AmbientLight {
    constructor(color, intensity) {
      this.color = color;
      this.intensity = intensity;
    }
  }
  class DirectionalLight {
    constructor(color, intensity) {
      this.color = color;
      this.intensity = intensity;
      this.position = {
        x: 0,
        y: 0,
        z: 0,
        set: (x, y, z) => {
          this.position.x = x;
          this.position.y = y;
          this.position.z = z;
        },
      };
    }
  }
  class PlaneGeometry {
    constructor(width, height, segmentsX, segmentsY) {
      this.width = width;
      this.height = height;
      this.segmentsX = segmentsX;
      this.segmentsY = segmentsY;
    }
  }
  class MeshLambertMaterial {
    constructor({ color }) {
      this.color = color;
    }
  }
  class GridHelper {
    constructor(size, divisions, colorCenterLine, colorGrid) {
      this.size = size;
      this.divisions = divisions;
      this.colorCenterLine = colorCenterLine;
      this.colorGrid = colorGrid;
      this.position = { x: 0, y: 0, z: 0 };
    }
  }
  class CylinderGeometry {
    constructor(radiusTop, radiusBottom, height, radialSegments) {
      this.radiusTop = radiusTop;
      this.radiusBottom = radiusBottom;
      this.height = height;
      this.radialSegments = radialSegments;
    }
  }
  class MeshBasicMaterial {
    constructor({ color, transparent, opacity }) {
      this.color = color;
      this.transparent = transparent;
      this.opacity = opacity;
    }
  }
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.rotation = { x: 0, y: 0, z: 0 };
      this.position = { x: 0, y: 0, z: 0 };
      this.userData = {};
      this.visible = true;
    }
  }
  return {
    AmbientLight,
    DirectionalLight,
    PlaneGeometry,
    MeshLambertMaterial,
    GridHelper,
    CylinderGeometry,
    MeshBasicMaterial,
    Mesh,
  };
}

test('createLegacyLighting configures ambient and directional lights', () => {
  const three = createThreeMock();
  const { ambientLight, sunlight } = createLegacyLighting(three);

  assert.equal(ambientLight.color, 0xffffff);
  assert.equal(ambientLight.intensity, 0.72);
  assert.equal(sunlight.color, 0xffffff);
  assert.equal(sunlight.intensity, 1.15);
  assert.deepEqual(
    { x: sunlight.position.x, y: sunlight.position.y, z: sunlight.position.z },
    { x: 22, y: 40, z: 12 },
  );
});

test('createLegacyGroundPlane configures geometry transform and metadata', () => {
  const three = createThreeMock();
  const groundPlane = createLegacyGroundPlane(three);

  assert.equal(groundPlane.geometry.width, 64);
  assert.equal(groundPlane.geometry.height, 64);
  assert.equal(groundPlane.material.color, 0x4d7c0f);
  assert.equal(groundPlane.rotation.x, -Math.PI / 2);
  assert.equal(groundPlane.position.y, 0);
  assert.equal(groundPlane.userData.isGround, true);
});

test('createLegacyGrid and createLegacyPreviewMarker configure visual helpers', () => {
  const three = createThreeMock();
  const grid = createLegacyGrid(three);
  const marker = createLegacyPreviewMarker(three);

  assert.equal(grid.size, 64);
  assert.equal(grid.divisions, 32);
  assert.equal(grid.position.y, 0.01);
  assert.equal(marker.geometry.radiusTop, 0.6);
  assert.equal(marker.material.color, 0x22c55e);
  assert.equal(marker.material.transparent, true);
  assert.equal(marker.material.opacity, 0.65);
  assert.equal(marker.position.y, 0.08);
  assert.equal(marker.visible, false);
});

