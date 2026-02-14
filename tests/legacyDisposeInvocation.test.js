import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLegacyDisposeInvocation } from '../src/render/legacyDisposeInvocation.js';

test('buildLegacyDisposeInvocation maps renderer runtime disposal payload', () => {
  const renderer = {
    unbindEvents: () => {},
    buildingMeshes: new Map(),
    colonistMeshes: new Map(),
    renderer: { domElement: {} },
  };

  const invocation = buildLegacyDisposeInvocation(renderer);

  assert.equal(invocation.unbindEvents, renderer.unbindEvents);
  assert.equal(invocation.buildingMeshes, renderer.buildingMeshes);
  assert.equal(invocation.colonistMeshes, renderer.colonistMeshes);
  assert.equal(invocation.renderer, renderer.renderer);
});

test('buildLegacyDisposeInvocation setUnbindEvents mutates renderer state', () => {
  const renderer = {
    unbindEvents: () => {},
    buildingMeshes: new Map(),
    colonistMeshes: new Map(),
    renderer: { domElement: {} },
  };
  const nextUnbind = () => {};

  const invocation = buildLegacyDisposeInvocation(renderer);
  invocation.setUnbindEvents(nextUnbind);

  assert.equal(renderer.unbindEvents, nextUnbind);
});

