import { buildPathTileSet, buildStructureTileSet, buildTerrainSignature, getTerrainBoundsFromCorners } from './terrainUtils.js';
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
    this.cache = {
      valid: false,
      centerX: 0,
      centerZ: 0,
      zoom: 0,
      minX: 0,
      maxX: 0,
      minZ: 0,
      maxZ: 0,
      buildingSignature: '',
      width: 0,
      height: 0,
      dpr: 1,
    };
  }

  resize(width, height, dpr) {
    this.canvas.width = Math.floor(width * dpr);
    this.canvas.height = Math.floor(height * dpr);
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    this.ctx.scale(dpr, dpr);
    this.cache.valid = false;
  }

  getBounds(camera) {
    const corners = [
      camera.screenToWorld(0, 0),
      camera.screenToWorld(camera.viewportWidth, 0),
      camera.screenToWorld(0, camera.viewportHeight),
      camera.screenToWorld(camera.viewportWidth, camera.viewportHeight),
    ];
    return getTerrainBoundsFromCorners(corners, 3);
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

    const { minX, maxX, minZ, maxZ } = bounds;

    this.cache = {
      valid: true,
      centerX: camera.centerX,
      centerZ: camera.centerZ,
      zoom: camera.zoom,
      minX,
      maxX,
      minZ,
      maxZ,
      buildingSignature: signature,
      width: camera.viewportWidth,
      height: camera.viewportHeight,
      dpr,
    };
  }

  draw(targetCtx, state, camera, dpr = 1) {
    const bounds = this.getBounds(camera);
    const signature = buildTerrainSignature(state);
    if (shouldRefreshTerrainCache(this.cache, {
      centerX: camera.centerX,
      centerZ: camera.centerZ,
      zoom: camera.zoom,
      minX: bounds.minX,
      maxX: bounds.maxX,
      minZ: bounds.minZ,
      maxZ: bounds.maxZ,
      width: camera.viewportWidth,
      height: camera.viewportHeight,
      dpr,
      signature,
    })) {
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

