export const RESOURCE_DEFINITIONS = {
  food: { label: 'Food', starting: 120, color: '#84cc16' },
  wood: { label: 'Wood', starting: 140, color: '#a16207' },
  stone: { label: 'Stone', starting: 90, color: '#94a3b8' },
  iron: { label: 'Iron', starting: 30, color: '#6b7280' },
  tools: { label: 'Tools', starting: 10, color: '#f59e0b' },
  medicine: { label: 'Medicine', starting: 6, color: '#ec4899' },
  knowledge: { label: 'Knowledge', starting: 0, color: '#8b5cf6' },
};

export const BASE_STORAGE_CAPACITY = 320;
export const BASE_POPULATION_CAPACITY = 6;

export const RESOURCE_KEYS = Object.keys(RESOURCE_DEFINITIONS);
