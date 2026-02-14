import { buildObjectiveHint, buildObjectiveRows } from './objectivesViewState.js';
import { buildRunStatsPanelViewModel } from './runStatsPanelViewState.js';
import { buildSelectionPanelViewModel } from './selectionPanelViewState.js';
import { buildBuildingSelectionDetails, buildColonistSelectionDetails } from './selectionDetails.js';

export function renderObjectivesPanel({
  listElement,
  hintElement,
  state,
  objectives,
  rewardMultiplier,
  formatObjectiveReward,
  getCurrentObjectiveIds,
  buildRows = buildObjectiveRows,
  buildHint = buildObjectiveHint,
  documentObject = document,
}) {
  listElement.innerHTML = '';
  const rows = buildRows({
    objectives,
    completedObjectiveIds: state.objectives.completed,
    rewardMultiplier,
    formatObjectiveReward,
  });
  rows.forEach((row) => {
    const card = documentObject.createElement('div');
    card.className = `panel-card ${row.completed ? 'completed' : ''}`;
    card.innerHTML = `
      <div class="kv"><strong>${row.title}</strong><small>${row.completed ? 'Done' : 'Active'}</small></div>
      <small>${row.description}</small>
      <small class="reward-label">Reward: ${row.rewardLabel}</small>
    `;
    listElement.appendChild(card);
  });

  hintElement.textContent = buildHint({
    state,
    objectives,
    getCurrentObjectiveIds,
  });
}

export function renderRunStatsPanel({
  metricsElement,
  historyElement,
  state,
  historyLimit = 3,
  buildPanel = buildRunStatsPanelViewModel,
  documentObject = document,
}) {
  const panel = buildPanel(state, historyLimit);
  const metricsMarkup = panel.metricsRows
    .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
    .join('');
  metricsElement.innerHTML = `
    <div class="panel-card">
      ${metricsMarkup}
    </div>
  `;
  if (panel.warningMessage) {
    const warning = documentObject.createElement('div');
    warning.className = 'panel-card warning';
    warning.textContent = panel.warningMessage;
    metricsElement.appendChild(warning);
  }

  historyElement.innerHTML = '';
  if (panel.historyRows.length === 0) {
    historyElement.innerHTML = '<div class="panel-card"><small>No previous runs yet.</small></div>';
    return;
  }
  panel.historyRows.forEach((run) => {
    const card = documentObject.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="kv"><strong>${run.outcomeLabel}</strong><small>${run.dayLabel}</small></div>
      <small>${run.summary}</small>
    `;
    historyElement.appendChild(card);
  });
}

export function renderSelectionPanel({
  titleElement,
  bodyElement,
  selection,
  state,
  buildingDefinitions,
  buildViewModel = buildSelectionPanelViewModel,
  buildBuildingDetails = buildBuildingSelectionDetails,
  buildColonistDetails = buildColonistSelectionDetails,
}) {
  const panel = buildViewModel({
    selection,
    state,
    buildingDefinitions,
    buildBuildingSelectionDetails: buildBuildingDetails,
    buildColonistSelectionDetails: buildColonistDetails,
  });
  titleElement.textContent = panel.title;
  if (panel.message) {
    bodyElement.innerHTML = `<small>${panel.message}</small>`;
    return;
  }
  bodyElement.innerHTML = panel.rows
    .map((row) => `<div class="kv"><span>${row.label}</span><strong>${row.value}</strong></div>`)
    .join('');
}

