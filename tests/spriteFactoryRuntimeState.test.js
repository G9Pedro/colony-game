import test from 'node:test';
import assert from 'node:assert/strict';
import { createSpriteFactoryRuntimeState } from '../src/render/spriteFactoryRuntimeState.js';

test('createSpriteFactoryRuntimeState returns initialized cache maps and tile sizes', () => {
  const runtime = createSpriteFactoryRuntimeState({ quality: 'high' });
  assert.equal(runtime.quality, 'high');
  assert.equal(runtime.tileWidth, 64);
  assert.equal(runtime.tileHeight, 32);
  assert.ok(runtime.buildingSprites instanceof Map);
  assert.ok(runtime.colonistSprites instanceof Map);
  assert.ok(runtime.terrainTiles instanceof Map);
  assert.ok(runtime.resourceIcons instanceof Map);
});

test('createSpriteFactoryRuntimeState defaults quality when omitted', () => {
  const runtime = createSpriteFactoryRuntimeState();
  assert.equal(runtime.quality, 'balanced');
});

