import { CIVIC_BUILDING_DECORATION_HANDLERS } from './spriteBuildingDecorationCivic.js';
import { ECONOMIC_BUILDING_DECORATION_HANDLERS } from './spriteBuildingDecorationEconomic.js';

const handlers = {
  ...ECONOMIC_BUILDING_DECORATION_HANDLERS,
  ...CIVIC_BUILDING_DECORATION_HANDLERS,
};

export const BUILDING_DECORATION_HANDLERS = Object.freeze(handlers);

export function getBuildingDecorationHandler(type) {
  return BUILDING_DECORATION_HANDLERS[type] ?? null;
}

