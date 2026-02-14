import { renderColonistPanel, renderConstructionQueuePanel, renderResearchPanels } from './colonyPanelsDom.js';
import { renderObjectivesPanel, renderRunStatsPanel, renderSelectionPanel } from './infoPanelsDom.js';
import {
  buildGameUIColonistPanelInvocation,
  buildGameUIConstructionQueueInvocation,
  buildGameUIObjectivesPanelInvocation,
  buildGameUIResearchPanelInvocation,
  buildGameUIRunStatsPanelInvocation,
  buildGameUISelectionPanelInvocation,
} from './gameUIPanelInvocations.js';

export function dispatchGameUIResearchPanel(gameUI, state, getAvailableResearch, onStartResearch, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildGameUIResearchPanelInvocation;
  const renderPanel = deps.renderPanel ?? renderResearchPanels;
  renderPanel(buildInvocation(gameUI, state, getAvailableResearch, onStartResearch));
}

export function dispatchGameUIConstructionQueuePanel(gameUI, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildGameUIConstructionQueueInvocation;
  const renderPanel = deps.renderPanel ?? renderConstructionQueuePanel;
  renderPanel(buildInvocation(gameUI, state));
}

export function dispatchGameUIColonistPanel(gameUI, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildGameUIColonistPanelInvocation;
  const renderPanel = deps.renderPanel ?? renderColonistPanel;
  renderPanel(buildInvocation(gameUI, state));
}

export function dispatchGameUIObjectivesPanel(
  gameUI,
  state,
  objectives,
  rewardMultiplier,
  formatObjectiveReward,
  getCurrentObjectiveIds,
  deps = {},
) {
  const buildInvocation = deps.buildInvocation ?? buildGameUIObjectivesPanelInvocation;
  const renderPanel = deps.renderPanel ?? renderObjectivesPanel;
  renderPanel(buildInvocation(
    gameUI,
    state,
    objectives,
    rewardMultiplier,
    formatObjectiveReward,
    getCurrentObjectiveIds,
  ));
}

export function dispatchGameUIRunStatsPanel(gameUI, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildGameUIRunStatsPanelInvocation;
  const renderPanel = deps.renderPanel ?? renderRunStatsPanel;
  renderPanel(buildInvocation(gameUI, state));
}

export function dispatchGameUISelectionPanel(gameUI, selection, state, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildGameUISelectionPanelInvocation;
  const renderPanel = deps.renderPanel ?? renderSelectionPanel;
  renderPanel(buildInvocation(gameUI, selection, state));
}

