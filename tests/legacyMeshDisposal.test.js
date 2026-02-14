import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeLegacyMaterial, disposeLegacyMesh } from '../src/render/legacyMeshDisposal.js';

test('disposeLegacyMaterial disposes single material and material arrays', () => {
  const disposed = [];
  disposeLegacyMaterial({ dispose: () => disposed.push('single') });
  disposeLegacyMaterial([
    { dispose: () => disposed.push('array-1') },
    { dispose: () => disposed.push('array-2') },
  ]);

  assert.deepEqual(disposed, ['single', 'array-1', 'array-2']);
});

test('disposeLegacyMesh disposes geometry and material payloads safely', () => {
  const disposed = [];
  disposeLegacyMesh({
    geometry: { dispose: () => disposed.push('geometry') },
    material: { dispose: () => disposed.push('material') },
  });
  disposeLegacyMesh({
    geometry: { dispose: () => disposed.push('geometry-2') },
    material: [
      { dispose: () => disposed.push('material-2a') },
      { dispose: () => disposed.push('material-2b') },
    ],
  });
  disposeLegacyMesh(null);

  assert.deepEqual(disposed, [
    'geometry',
    'material',
    'geometry-2',
    'material-2a',
    'material-2b',
  ]);
});

