function toAssetUrl(relativePath) {
  return new URL(`../../assets/${relativePath}`, import.meta.url).href;
}

export const UI_ASSETS = {
  favicon: toAssetUrl('favicon.png'),
  logo: toAssetUrl('ui/logo.png'),
  panelTexture: toAssetUrl('ui/panel-bg.png'),
};

export const SCENE_ASSETS = {
  sky: toAssetUrl('backgrounds/sky.png'),
  ground: toAssetUrl('tiles/ground.png'),
  grid: toAssetUrl('tiles/grid.png'),
};

export const RESOURCE_ICON_ASSETS = {
  food: toAssetUrl('icons/food.png'),
  wood: toAssetUrl('icons/wood.png'),
  stone: toAssetUrl('icons/stone.png'),
  iron: toAssetUrl('icons/iron.png'),
  tools: toAssetUrl('icons/tools.png'),
  medicine: toAssetUrl('icons/medicine.png'),
  knowledge: toAssetUrl('icons/knowledge.png'),
};

export const CATEGORY_ICON_ASSETS = {
  housing: toAssetUrl('icons/category-housing.png'),
  production: toAssetUrl('icons/category-production.png'),
  infrastructure: toAssetUrl('icons/category-infrastructure.png'),
  culture: toAssetUrl('icons/category-culture.png'),
  defense: toAssetUrl('icons/category-defense.png'),
};

export const BUILDING_ICON_ASSETS = {
  hut: toAssetUrl('buildings/hut.png'),
  house: toAssetUrl('buildings/house.png'),
  apartment: toAssetUrl('buildings/apartment.png'),
  farm: toAssetUrl('buildings/farm.png'),
  lumberCamp: toAssetUrl('buildings/lumberCamp.png'),
  quarry: toAssetUrl('buildings/quarry.png'),
  ironMine: toAssetUrl('buildings/ironMine.png'),
  workshop: toAssetUrl('buildings/workshop.png'),
  clinic: toAssetUrl('buildings/clinic.png'),
  warehouse: toAssetUrl('buildings/warehouse.png'),
  school: toAssetUrl('buildings/school.png'),
  library: toAssetUrl('buildings/library.png'),
  shrine: toAssetUrl('buildings/shrine.png'),
  watchtower: toAssetUrl('buildings/watchtower.png'),
};

export const RESEARCH_ICON_ASSETS = {
  masonry: toAssetUrl('research/masonry.png'),
  'deep-mining': toAssetUrl('research/deep-mining.png'),
  smithing: toAssetUrl('research/smithing.png'),
  medicine: toAssetUrl('research/medicine.png'),
  'civil-service': toAssetUrl('research/civil-service.png'),
  engineering: toAssetUrl('research/engineering.png'),
  'colony-charter': toAssetUrl('research/colony-charter.png'),
};

const COLONIST_DEFAULT_IDLE = toAssetUrl('units/colonist-idle.png');
const COLONIST_DEFAULT_WALK = [
  toAssetUrl('units/colonist-walk-1.png'),
  toAssetUrl('units/colonist-walk-2.png'),
  toAssetUrl('units/colonist-walk-3.png'),
  toAssetUrl('units/colonist-walk-2.png'),
];
const COLONIST_BUILDER_IDLE = toAssetUrl('units/colonist-builder-idle.png');
const COLONIST_BUILDER_WALK = [
  toAssetUrl('units/colonist-builder-walk-1.png'),
  toAssetUrl('units/colonist-builder-walk-2.png'),
  toAssetUrl('units/colonist-builder-walk-3.png'),
  toAssetUrl('units/colonist-builder-walk-2.png'),
];

export const COLONIST_PORTRAITS = {
  laborer: toAssetUrl('units/colonist.png'),
  builder: toAssetUrl('units/colonist-builder.png'),
};

export function getColonistSpriteAssetSet(job) {
  if (job === 'builder') {
    return {
      key: 'builder',
      idle: COLONIST_BUILDER_IDLE,
      walk: COLONIST_BUILDER_WALK,
    };
  }
  return {
    key: 'default',
    idle: COLONIST_DEFAULT_IDLE,
    walk: COLONIST_DEFAULT_WALK,
  };
}
