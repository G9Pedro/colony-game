export function renderGameUIBuildCategories({
  elements,
  categories,
  selectedCategory,
  buildCategoryPillRows,
  createBuildCategoryButton,
  onSelectCategory,
}) {
  elements.buildCategories.innerHTML = '';
  const rows = buildCategoryPillRows(categories, selectedCategory);
  rows.forEach((row) => {
    const button = createBuildCategoryButton({
      row,
      onSelectCategory,
    });
    elements.buildCategories.appendChild(button);
  });
}

export function renderGameUIBuildCards({
  elements,
  state,
  selectedBuildType,
  buildingDefinitions,
  isBuildingUnlocked,
  formatCost,
  getBuildingCardState,
  buildBuildCardRows,
  spriteFactory,
  createBuildCardElement,
  onToggleBuildType,
}) {
  elements.buildList.innerHTML = '';
  const rows = buildBuildCardRows({
    state,
    selectedBuildType,
    buildingDefinitions,
    isBuildingUnlocked,
    formatCost,
    getBuildingCardState,
  });

  rows.forEach((row) => {
    const thumbnail = spriteFactory.getBuildingThumbnail(row.id, 58);
    const card = createBuildCardElement({
      row,
      thumbnail,
      onToggleBuildType,
    });
    elements.buildList.appendChild(card);
  });
}

