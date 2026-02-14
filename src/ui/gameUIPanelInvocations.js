export function buildGameUIResearchPanelInvocation(gameUI, state, getAvailableResearch, onStartResearch) {
  return {
    currentElement: gameUI.el.researchCurrent,
    listElement: gameUI.el.researchList,
    state,
    researchDefinitions: gameUI.researchDefinitions,
    getAvailableResearch,
    onStartResearch,
  };
}

export function buildGameUIConstructionQueueInvocation(gameUI, state) {
  return {
    listElement: gameUI.el.constructionList,
    state,
    buildingDefinitions: gameUI.buildingDefinitions,
  };
}

export function buildGameUIColonistPanelInvocation(gameUI, state) {
  return {
    listElement: gameUI.el.colonistList,
    state,
    limit: 18,
  };
}

export function buildGameUIObjectivesPanelInvocation(
  gameUI,
  state,
  objectives,
  rewardMultiplier,
  formatObjectiveReward,
  getCurrentObjectiveIds,
) {
  return {
    listElement: gameUI.el.objectivesList,
    hintElement: gameUI.el.hintBadge,
    state,
    objectives,
    rewardMultiplier,
    formatObjectiveReward,
    getCurrentObjectiveIds,
  };
}

export function buildGameUIRunStatsPanelInvocation(gameUI, state) {
  return {
    metricsElement: gameUI.el.metricsSummary,
    historyElement: gameUI.el.runHistory,
    state,
    historyLimit: 3,
  };
}

export function buildGameUISelectionPanelInvocation(gameUI, selection, state) {
  return {
    titleElement: gameUI.el.infoPanelTitle,
    bodyElement: gameUI.el.infoPanelBody,
    selection,
    state,
    buildingDefinitions: gameUI.buildingDefinitions,
  };
}

