import { resolveTerrainKind, resolveTerrainVariant } from './terrainTilePolicies.js';

export function paintTerrainTiles({
  ctx,
  state,
  camera,
  spriteFactory,
  bounds,
  structureTileSet,
  pathTileSet,
}) {
  const { minX, maxX, minZ, maxZ } = bounds;
  for (let z = minZ; z <= maxZ; z += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      if (Math.hypot(x, z) > state.maxWorldRadius + 3) {
        continue;
      }
      const key = `${x}:${z}`;
      const kind = resolveTerrainKind({
        onPath: pathTileSet.has(key),
        nearBuilding: structureTileSet.has(key),
      });
      const variant = resolveTerrainVariant(x, z);
      const tile = spriteFactory.getTerrainTile(kind, variant);
      const screen = camera.worldToScreen(x, z);
      ctx.drawImage(tile, screen.x - tile.width * 0.5, screen.y - tile.height * 0.5);
    }
  }
}
