import { dispatchGameUIBuildMenu } from './gameUIBuildMenuDispatch.js';
import { dispatchGameUIBalanceProfileOptions, dispatchGameUIScenarioOptions } from './gameUIOptionsDispatch.js';
import {
  dispatchGameUIResourceBar,
  dispatchGameUIResourceRateSampling,
  dispatchGameUISpeedButtons,
  dispatchGameUITopState,
} from './gameUIHudDispatch.js';
import {
  dispatchGameUIColonistPanel,
  dispatchGameUIConstructionQueuePanel,
  dispatchGameUIObjectivesPanel,
  dispatchGameUIResearchPanel,
  dispatchGameUIRunStatsPanel,
  dispatchGameUISelectionPanel,
} from './gameUIPanelDispatch.js';
import { createGameUIRuntime } from './gameUIRuntime.js';

export class GameUI {
  constructor({ elements, buildingDefinitions, researchDefinitions, resourceDefinitions, spriteFactory }) {
    this.el = elements;
    this.buildingDefinitions = buildingDefinitions;
    this.researchDefinitions = researchDefinitions;
    this.resourceDefinitions = resourceDefinitions;
    this.spriteFactory = spriteFactory;
    Object.assign(this, createGameUIRuntime());
  }

  setScenarioOptions(scenarios, currentScenarioId) {
    dispatchGameUIScenarioOptions(this, scenarios, currentScenarioId);
  }

  setBalanceProfileOptions(profiles, currentProfileId) {
    dispatchGameUIBalanceProfileOptions(this, profiles, currentProfileId);
  }

  updateResourceRates(state) {
    dispatchGameUIResourceRateSampling(this, state);
  }

  renderTopState(state, { populationText, morale, storageText }) {
    dispatchGameUITopState(this, state, {
      populationText,
      morale,
      storageText,
    });
  }

  renderSpeedButtons(state) {
    dispatchGameUISpeedButtons(this, state);
  }

  renderResourceBar(state) {
    dispatchGameUIResourceBar(this, state);
  }

  renderBuildList({
    state,
    selectedBuildType,
    onToggleBuildType,
    onSelectCategory,
    categories,
    isBuildingUnlocked,
  }) {
    dispatchGameUIBuildMenu(this, {
      state,
      selectedBuildType,
      onToggleBuildType,
      onSelectCategory,
      categories,
      isBuildingUnlocked,
    });
  }

  renderResearch(state, getAvailableResearch, onStartResearch) {
    dispatchGameUIResearchPanel(this, state, getAvailableResearch, onStartResearch);
  }

  renderConstructionQueue(state) {
    dispatchGameUIConstructionQueuePanel(this, state);
  }

  renderColonists(state) {
    dispatchGameUIColonistPanel(this, state);
  }

  renderObjectives(state, objectives, rewardMultiplier, formatObjectiveReward, getCurrentObjectiveIds) {
    dispatchGameUIObjectivesPanel(
      this,
      state,
      objectives,
      rewardMultiplier,
      formatObjectiveReward,
      getCurrentObjectiveIds,
    );
  }

  renderRunStats(state) {
    dispatchGameUIRunStatsPanel(this, state);
  }

  renderSelection(selection, state) {
    dispatchGameUISelectionPanel(this, selection, state);
  }
}

