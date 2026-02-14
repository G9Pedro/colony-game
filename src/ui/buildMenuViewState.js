export function buildCategoryPillRows(categories, selectedCategory) {
  return categories.map((category) => ({
    id: category,
    label: category,
    active: category === selectedCategory,
  }));
}

export function buildBuildCardRows({
  state,
  selectedBuildType,
  buildingDefinitions,
  isBuildingUnlocked,
  formatCost,
  getBuildingCardState,
}) {
  return Object.values(buildingDefinitions)
    .filter((definition) => definition.category === state.selectedCategory)
    .map((definition) => {
      const cardState = getBuildingCardState(state, definition, isBuildingUnlocked, formatCost);
      return {
        id: definition.id,
        name: definition.name,
        subtitle: cardState.subtitle,
        warning: !!cardState.warning,
        unlocked: cardState.unlocked,
        active: selectedBuildType === definition.id,
      };
    });
}

