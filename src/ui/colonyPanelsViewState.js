export function buildConstructionQueueRows(constructionQueue, buildingDefinitions, percentFn) {
  return constructionQueue.map((item) => {
    const building = buildingDefinitions[item.type];
    return {
      id: item.id ?? `${item.type}:${item.x}:${item.z}`,
      name: building?.name ?? item.type,
      progress: percentFn(item.progress, item.buildTime),
    };
  });
}

export function buildColonistRows(colonists, limit = 18) {
  return colonists
    .filter((colonist) => colonist.alive)
    .slice(0, limit)
    .map((colonist) => ({
      id: colonist.id,
      name: colonist.name,
      job: colonist.job,
      task: colonist.task,
      health: Math.floor(colonist.needs.health),
      hunger: Math.floor(colonist.needs.hunger),
      rest: Math.floor(colonist.needs.rest),
      morale: Math.floor(colonist.needs.morale),
    }));
}

