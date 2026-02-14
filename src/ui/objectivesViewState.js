export function buildObjectiveRows({
  objectives,
  completedObjectiveIds,
  rewardMultiplier,
  formatObjectiveReward,
}) {
  const completedSet = new Set(completedObjectiveIds);
  return objectives.map((objective) => ({
    id: objective.id,
    title: objective.title,
    description: objective.description,
    completed: completedSet.has(objective.id),
    rewardLabel: formatObjectiveReward(objective, rewardMultiplier),
  }));
}

export function buildObjectiveHint({
  state,
  objectives,
  getCurrentObjectiveIds,
}) {
  const remaining = getCurrentObjectiveIds(state);
  const current = objectives.find((objective) => objective.id === remaining[0]);
  if (!current) {
    return 'All objectives complete. Charter victory is within reach.';
  }
  return `Current objective: ${current.title}`;
}

