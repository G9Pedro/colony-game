import { DEFAULT_TILE_HEIGHT, DEFAULT_TILE_WIDTH } from './spriteFactoryLayout.js';

export function createSpriteFactoryRuntimeState({ quality = 'balanced' } = {}) {
  return {
    quality,
    tileWidth: DEFAULT_TILE_WIDTH,
    tileHeight: DEFAULT_TILE_HEIGHT,
    buildingSprites: new Map(),
    colonistSprites: new Map(),
    terrainTiles: new Map(),
    resourceIcons: new Map(),
  };
}

