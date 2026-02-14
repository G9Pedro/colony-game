import { buildColonistRows, buildConstructionQueueRows } from './colonyPanelsViewState.js';
import { buildActiveResearchViewModel, buildResearchOptionViewModels } from './researchViewState.js';
import { percent } from './uiFormatting.js';

export function renderResearchPanels({
  currentElement,
  listElement,
  state,
  researchDefinitions,
  getAvailableResearch,
  onStartResearch,
  documentObject = document,
  buildActiveResearch = buildActiveResearchViewModel,
  buildResearchOptions = buildResearchOptionViewModels,
}) {
  currentElement.innerHTML = '';
  const activeResearch = buildActiveResearch(
    state.research,
    researchDefinitions,
    percent,
  );
  if (activeResearch) {
    currentElement.innerHTML = `
      <div class="panel-card">
        <div class="kv"><strong>${activeResearch.name}</strong><small>${Math.floor(activeResearch.progress)}%</small></div>
        <div class="progress-track"><span style="width:${activeResearch.progress}%"></span></div>
      </div>
    `;
  } else {
    currentElement.innerHTML = '<div class="panel-card"><small>No active research</small></div>';
  }

  listElement.innerHTML = '';
  const options = buildResearchOptions({
    state,
    researchDefinitions,
    getAvailableResearch,
  });
  options.forEach((item) => {
    const card = documentObject.createElement('div');
    card.className = 'panel-card';
    const button = documentObject.createElement('button');
    button.type = 'button';
    button.className = 'secondary';
    button.textContent = `Research ${item.name}`;
    button.disabled = item.disabled;
    button.addEventListener('click', () => onStartResearch(item.id));
    const text = documentObject.createElement('small');
    text.textContent = `${item.description} · ${item.cost} knowledge`;
    card.append(button, text);
    listElement.appendChild(card);
  });
}

export function renderConstructionQueuePanel({
  listElement,
  state,
  buildingDefinitions,
  buildQueueRows = buildConstructionQueueRows,
  documentObject = document,
}) {
  listElement.innerHTML = '';
  if (state.constructionQueue.length === 0) {
    listElement.innerHTML = '<div class="panel-card"><small>No active construction</small></div>';
    return;
  }
  const rows = buildQueueRows(state.constructionQueue, buildingDefinitions, percent);
  rows.forEach((row) => {
    const card = documentObject.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="kv"><strong>${row.name}</strong><small>${Math.floor(row.progress)}%</small></div>
      <div class="progress-track"><span style="width:${row.progress}%"></span></div>
    `;
    listElement.appendChild(card);
  });
}

export function renderColonistPanel({
  listElement,
  state,
  limit = 18,
  buildRows = buildColonistRows,
  documentObject = document,
}) {
  listElement.innerHTML = '';
  const rows = buildRows(state.colonists, limit);
  rows.forEach((row) => {
    const card = documentObject.createElement('div');
    card.className = 'panel-card';
    card.innerHTML = `
      <div class="kv"><strong>${row.name}</strong><small>${row.job}</small></div>
      <small>${row.task} · H${row.health} F${row.hunger} R${row.rest} M${row.morale}</small>
    `;
    listElement.appendChild(card);
  });
}

