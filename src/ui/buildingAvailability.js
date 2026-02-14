export function canAffordBuildingCost(resources, cost) {
  return Object.entries(cost).every(
    ([resource, amount]) => (resources[resource] ?? 0) >= amount,
  );
}

export function getBuildingCardState(state, definition, isBuildingUnlocked, formatCost) {
  const unlocked = isBuildingUnlocked(state, definition);
  const canAfford = canAffordBuildingCost(state.resources, definition.cost);
  const subtitle = !unlocked
    ? `Requires ${definition.requiredTech}`
    : `${definition.buildTime}s · ${formatCost(definition.cost)}`;

  return {
    unlocked,
    canAfford,
    subtitle,
    warning: unlocked && !canAfford,
  };
}

