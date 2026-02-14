export const JOB_COLORS = {
  builder: '#f97316',
  farmer: '#65a30d',
  miner: '#6b7280',
  soldier: '#dc2626',
  scholar: '#2563eb',
  artisan: '#7e22ce',
  medic: '#db2777',
  laborer: '#ca8a04',
  lumberjack: '#92400e',
};

export const RESOURCE_GLYPHS = {
  wood: '🪵',
  stone: '🪨',
  food: '🌾',
  iron: '⛓',
  tools: '⚒',
  medicine: '✚',
  knowledge: '📘',
};

export const PREWARM_JOB_TYPES = Object.keys(JOB_COLORS);
export const PREWARM_RESOURCE_KEYS = Object.keys(RESOURCE_GLYPHS);

export const BUILDING_STYLE_OVERRIDES = {
  hut: { roof: '#8f613b', wall: '#7a4d2d', footprint: 0.82, height: 0.68 },
  house: { roof: '#b85d35', wall: '#b9b1a2', footprint: 0.92, height: 0.78 },
  apartment: { roof: '#8f95a1', wall: '#aeb6c3', footprint: 1, height: 1.25 },
  farm: { roof: '#8f4e24', wall: '#8b6b3f', footprint: 1.24, height: 0.42 },
  lumberCamp: { roof: '#90542a', wall: '#7a4f30', footprint: 1.05, height: 0.65 },
  quarry: { roof: '#7b8796', wall: '#6d7784', footprint: 1.08, height: 0.8 },
  ironMine: { roof: '#525866', wall: '#4a4f5d', footprint: 1.1, height: 0.9 },
  workshop: { roof: '#7b3aa6', wall: '#6b4877', footprint: 1.08, height: 0.82 },
  clinic: { roof: '#d7679e', wall: '#d3cad0', footprint: 1.02, height: 0.82 },
  warehouse: { roof: '#7d4e2b', wall: '#7a5b38', footprint: 1.32, height: 0.92 },
  school: { roof: '#2d5fb8', wall: '#cabca8', footprint: 1.1, height: 0.9 },
  library: { roof: '#1d4ed8', wall: '#d0c5b4', footprint: 1.24, height: 0.98 },
  shrine: { roof: '#15b7a2', wall: '#d5d2c5', footprint: 0.92, height: 1.15 },
  watchtower: { roof: '#4d5867', wall: '#5f6a79', footprint: 0.8, height: 1.6 },
};

