import { collectStructurePoints } from './terrainStructures.js';

export function buildTerrainSignature(state, deps = {}) {
  const collectStructures = deps.collectStructures ?? collectStructurePoints;
  let hash = 0;
  const structures = collectStructures(state)
    .sort((a, b) => a.x - b.x || a.z - b.z || a.type.localeCompare(b.type));
  for (const structure of structures) {
    const x = structure.x & 0xffff;
    const z = structure.z & 0xffff;
    hash = ((hash * 33) ^ x) >>> 0;
    hash = ((hash * 33) ^ z) >>> 0;
    for (let idx = 0; idx < structure.type.length; idx += 1) {
      hash = ((hash * 33) ^ structure.type.charCodeAt(idx)) >>> 0;
    }
  }
  return `${structures.length}:${hash}`;
}
