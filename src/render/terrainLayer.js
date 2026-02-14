import { buildPathTileSet, buildStructureTileSet, buildTerrainSignature } from './terrainUtils.js';
import {
  buildTerrainLayerCacheSnapshot,
  createTerrainLayerCacheState,
  createTerrainLayerRefreshPayload,
} from './terrainLayerCache.js';
import { resolveTerrainLayerBounds } from './terrainLayerBounds.js';
import { paintTerrainTiles } from './terrainTilePainter.js';
export { resolveTerrainKind } from './terrainTilePolicies.js';

export function shouldRefreshTerrainCache(cache, {
  centerX,
  centerZ,
  zoom,
  minX,
  maxX,
  minZ,
  maxZ,
  width,
  height,
  dpr,
  signature,
}) {
  if (!cache.valid) {
    return true;
  }
  if (cache.width !== width || cache.height !== height) {
    return true;
  }
  if (cache.dpr !== dpr) {
    return true;
  }

  const centerDelta = Math.hypot(cache.centerX - centerX, cache.centerZ - centerZ);
  const zoomDelta = Math.abs(cache.zoom - zoom);
  const boundsChanged = cache.minX !== minX
    || cache.maxX !== maxX
    || cache.minZ !== minZ
    || cache.maxZ !== maxZ;
  if (centerDelta > 0.45 || zoomDelta > 0.04 || boundsChanged) {
    return true;
  }

  return cache.buildingSignature !== signature;
}

export class TerrainLayerRenderer {
  constructor(spriteFactory) {
    this.spriteFactory = spriteFactory;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: true });
    this.cache = createTerrainLayerCacheState();
  }

  resize(width, height, dpr) {
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.cache.valid = false;
  }

  getBounds(camera) {
    return resolveTerrainLayerBounds(camera);
  }

  rebuild(state, camera, dpr, bounds, signature) {
    this.ctx.clearRect(0, 0, camera.viewportWidth, camera.viewportHeight);

    const structureTileSet = buildStructureTileSet(state);
    const pathTileSet = buildPathTileSet(state);
    paintTerrainTiles({
      ctx: this.ctx,
      state,
      camera,
      spriteFactory: this.spriteFactory,
      bounds,
      structureTileSet,
      pathTileSet,
    });

    this.cache = buildTerrainLayerCacheSnapshot({
      camera,
      bounds,
      dpr,
      signature,
    });
  }

  draw(targetCtx, state, camera, dpr = 1) {
    const bounds = this.getBounds(camera);
    const signature = buildTerrainSignature(state);
    const refreshPayload = createTerrainLayerRefreshPayload({
      camera,
      bounds,
      dpr,
      signature,
    });
    if (shouldRefreshTerrainCache(this.cache, refreshPayload)) {
      this.rebuild(state, camera, dpr, bounds, signature);
    }

    targetCtx.drawImage(
      this.canvas,
      0,
      0,
      this.canvas.width,
      this.canvas.height,
      0,
      0,
      camera.viewportWidth,
      camera.viewportHeight,
    );
  }
}

