import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDING_DEFINITIONS } from '../src/content/buildings.js';
import {
  LEGACY_BUILDING_Y_BASE,
  createLegacyBuildingMesh,
  createLegacyColonistMesh,
} from '../src/render/legacyMeshFactory.js';

function createThreeMock() {
  class BoxGeometry {
    constructor(x, y, z) {
      this.size = [x, y, z];
      this.disposed = false;
    }
    dispose() {
      this.disposed = true;
    }
  }
  class SphereGeometry {
    constructor(radius, widthSegments, heightSegments) {
      this.radius = radius;
      this.widthSegments = widthSegments;
      this.heightSegments = heightSegments;
      this.disposed = false;
    }
    dispose() {
      this.disposed = true;
    }
  }
  class MeshLambertMaterial {
    constructor({ color }) {
      this.color = color;
      this.disposed = false;
    }
    dispose() {
      this.disposed = true;
    }
  }
  class Mesh {
    constructor(geometry, material) {
      this.geometry = geometry;
      this.material = material;
      this.userData = {};
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
  return {
    BoxGeometry,
    SphereGeometry,
    MeshLambertMaterial,
    Mesh,
  };
}

test('createLegacyBuildingMesh assigns transform and entity metadata', () => {
  const threeMock = createThreeMock();
  const building = { id: 'b-1', type: 'farm', x: 4, z: -3 };
  const mesh = createLegacyBuildingMesh(building, BUILDING_DEFINITIONS, threeMock);
  const [, sy] = BUILDING_DEFINITIONS.farm.size;

  assert.equal(mesh.userData.entityId, 'b-1');
  assert.equal(mesh.userData.entityType, 'building');
  assert.equal(mesh.position.x, 4);
  assert.equal(mesh.position.z, -3);
  assert.equal(mesh.position.y, LEGACY_BUILDING_Y_BASE + sy / 2);
});

test('createLegacyColonistMesh uses job color and entity metadata', () => {
  const threeMock = createThreeMock();
  const builderMesh = createLegacyColonistMesh({
    id: 'c-builder',
    job: 'builder',
    position: { x: 1, z: 2 },
  }, threeMock);
  const workerMesh = createLegacyColonistMesh({
    id: 'c-worker',
    job: 'hauler',
    position: { x: -1, z: 5 },
  }, threeMock);

  assert.equal(builderMesh.userData.entityType, 'colonist');
  assert.equal(builderMesh.material.color, 0xf59e0b);
  assert.equal(workerMesh.material.color, 0xf97316);
});

