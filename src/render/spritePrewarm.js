export function prewarmSpriteFactoryAssets({
  spriteFactory,
  buildingDefinitions,
  prewarmJobTypes,
  prewarmResourceKeys,
}) {
  for (const building of Object.values(buildingDefinitions)) {
    spriteFactory.getBuildingSprite(building.id);
    spriteFactory.getBuildingSprite(building.id, { construction: true });
  }

  for (let variant = 0; variant < 4; variant += 1) {
    spriteFactory.getTerrainTile('grass', variant);
  }
  spriteFactory.getTerrainTile('dirt', 0);
  spriteFactory.getTerrainTile('path', 0);

  prewarmJobTypes.forEach((job) => {
    for (let frame = 0; frame < 3; frame += 1) {
      spriteFactory.getColonistSprite(job, frame, { idle: false });
      spriteFactory.getColonistSprite(job, frame, { idle: true });
    }
  });

  prewarmResourceKeys.forEach((resource) => {
    spriteFactory.getResourceIcon(resource, 20);
  });
}

