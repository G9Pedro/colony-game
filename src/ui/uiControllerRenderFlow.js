import { BUILDING_CATEGORIES } from '../content/buildings.js';
import {
  getAvailableResearch,
  getAverageMorale,
  getPopulationCapacity,
  getStorageCapacity,
  getUsedStorage,
  isBuildingUnlocked,
} from '../game/selectors.js';
import {
  formatObjectiveReward,
  getCurrentObjectiveIds,
  getObjectiveDefinitions,
  getObjectiveRewardMultiplier,
} from '../systems/objectiveSystem.js';
import { formatRenderStatsLabel } from './renderStatsLabel.js';
import { applyHudStateToElements, syncBannerState } from './uiControllerDomState.js';
import { buildUiControllerHudState, toggleBuildSelection } from './uiControllerViewState.js';
import { buildTopSummary, getStatusBannerMessage } from './uiViewState.js';

export function runUiControllerRender({
  state,
  selectedBuildType,
  selectedEntity,
  engine,
  renderer,
  elements,
  gameUI,
  minimap,
  pushNotification,
  setSelectedBuildType,
  showBanner,
  hideBanner,
  dependencies = {},
}) {
  const {
    buildTopSummaryFn = buildTopSummary,
    getPopulationCapacityFn = getPopulationCapacity,
    getAverageMoraleFn = getAverageMorale,
    getUsedStorageFn = getUsedStorage,
    getStorageCapacityFn = getStorageCapacity,
    buildingCategories = BUILDING_CATEGORIES,
    isBuildingUnlockedFn = isBuildingUnlocked,
    toggleBuildSelectionFn = toggleBuildSelection,
    getAvailableResearchFn = getAvailableResearch,
    getObjectiveDefinitionsFn = getObjectiveDefinitions,
    getObjectiveRewardMultiplierFn = getObjectiveRewardMultiplier,
    formatObjectiveRewardFn = formatObjectiveReward,
    getCurrentObjectiveIdsFn = getCurrentObjectiveIds,
    buildUiControllerHudStateFn = buildUiControllerHudState,
    formatRenderStatsLabelFn = formatRenderStatsLabel,
    getStatusBannerMessageFn = getStatusBannerMessage,
    applyHudStateToElementsFn = applyHudStateToElements,
    syncBannerStateFn = syncBannerState,
  } = dependencies;

  const topSummary = buildTopSummaryFn(state, {
    getPopulationCapacity: getPopulationCapacityFn,
    getAverageMorale: getAverageMoraleFn,
    getUsedStorage: getUsedStorageFn,
    getStorageCapacity: getStorageCapacityFn,
  });

  gameUI.renderTopState(state, {
    populationText: topSummary.populationText,
    morale: topSummary.moraleText,
    storageText: topSummary.storageText,
  });
  gameUI.renderSpeedButtons(state);
  gameUI.renderResourceBar(state);
  gameUI.renderBuildList({
    state,
    selectedBuildType,
    onToggleBuildType: (buildingType) => {
      const nextSelectedBuildType = toggleBuildSelectionFn(selectedBuildType, buildingType);
      setSelectedBuildType(nextSelectedBuildType);
      engine.setSelectedBuildingType(nextSelectedBuildType);
    },
    onSelectCategory: (category) => engine.setSelectedCategory(category),
    categories: buildingCategories,
    isBuildingUnlocked: isBuildingUnlockedFn,
  });
  gameUI.renderResearch(
    state,
    getAvailableResearchFn,
    (researchId) => {
      const result = engine.beginResearch(researchId);
      if (!result.ok) {
        pushNotification({ kind: 'error', message: result.message });
      }
    },
  );
  gameUI.renderObjectives(
    state,
    getObjectiveDefinitionsFn(),
    getObjectiveRewardMultiplierFn(state),
    formatObjectiveRewardFn,
    getCurrentObjectiveIdsFn,
  );
  gameUI.renderConstructionQueue(state);
  gameUI.renderColonists(state);
  gameUI.renderRunStats(state);
  gameUI.renderSelection(selectedEntity, state);

  minimap.render(state, renderer?.getCameraState?.(), selectedEntity);

  const hudState = buildUiControllerHudStateFn({
    state,
    renderer,
    formatRenderStatsLabel: formatRenderStatsLabelFn,
    getStatusBannerMessage: getStatusBannerMessageFn,
  });
  applyHudStateToElementsFn(elements, hudState);
  syncBannerStateFn({
    bannerMessage: hudState.bannerMessage,
    showBanner,
    hideBanner,
  });
  return hudState;
}

