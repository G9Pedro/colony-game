import { getBuildingCardState } from './buildingAvailability.js';
import { buildBuildCardRows, buildCategoryPillRows } from './buildMenuViewState.js';
import { renderGameUIBuildCards, renderGameUIBuildCategories } from './gameUIBuildMenuDom.js';
import { createBuildCardElement, createBuildCategoryButton } from './gameUICardElements.js';
import { formatCost } from './uiFormatting.js';

export function dispatchGameUIBuildMenu(
  gameUI,
  {
    state,
    selectedBuildType,
    onToggleBuildType,
    onSelectCategory,
    categories,
    isBuildingUnlocked,
  },
  deps = {},
) {
  const renderCategories = deps.renderCategories ?? renderGameUIBuildCategories;
  const renderCards = deps.renderCards ?? renderGameUIBuildCards;
  const categoryRowsBuilder = deps.categoryRowsBuilder ?? buildCategoryPillRows;
  const buildRowsBuilder = deps.buildRowsBuilder ?? buildBuildCardRows;
  const categoryButtonBuilder = deps.categoryButtonBuilder ?? createBuildCategoryButton;
  const buildCardBuilder = deps.buildCardBuilder ?? createBuildCardElement;
  const costFormatter = deps.costFormatter ?? formatCost;
  const cardStateResolver = deps.cardStateResolver ?? getBuildingCardState;

  renderCategories({
    elements: gameUI.el,
    categories,
    selectedCategory: state.selectedCategory,
    buildCategoryPillRows: categoryRowsBuilder,
    createBuildCategoryButton: categoryButtonBuilder,
    onSelectCategory,
  });

  renderCards({
    elements: gameUI.el,
    state,
    selectedBuildType,
    isBuildingUnlocked,
    buildingDefinitions: gameUI.buildingDefinitions,
    formatCost: costFormatter,
    getBuildingCardState: cardStateResolver,
    buildBuildCardRows: buildRowsBuilder,
    spriteFactory: gameUI.spriteFactory,
    createBuildCardElement: buildCardBuilder,
    onToggleBuildType,
  });
}

