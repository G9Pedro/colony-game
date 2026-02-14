import test from 'node:test';
import assert from 'node:assert/strict';
import { renderObjectivesPanel, renderRunStatsPanel, renderSelectionPanel } from '../src/ui/infoPanelsDom.js';

function createMockDocument() {
  return {
    createElement(tagName) {
      return {
        tagName,
        className: '',
        textContent: '',
        innerHTML: '',
        children: [],
        append(...children) {
          this.children.push(...children);
        },
        appendChild(child) {
          this.children.push(child);
        },
      };
    },
  };
}

function createElement() {
  return {
    textContent: '',
    innerHTML: '',
    children: [],
    appendChild(node) {
      this.children.push(node);
    },
  };
}

test('renderObjectivesPanel renders rows and objective hint', () => {
  const listElement = createElement();
  const hintElement = createElement();
  renderObjectivesPanel({
    listElement,
    hintElement,
    state: { objectives: { completed: ['obj-1'] } },
    objectives: [],
    rewardMultiplier: 1,
    formatObjectiveReward: () => 'reward',
    getCurrentObjectiveIds: () => ['obj-2'],
    documentObject: createMockDocument(),
    buildRows: () => [
      { title: 'Goal', description: 'Do thing', rewardLabel: '10 wood', completed: false },
    ],
    buildHint: () => 'Keep building',
  });

  assert.equal(listElement.children.length, 1);
  assert.equal(listElement.children[0].className, 'panel-card ');
  assert.match(listElement.children[0].innerHTML, /Goal/);
  assert.equal(hintElement.textContent, 'Keep building');
});

test('renderRunStatsPanel renders metrics, warning, and history', () => {
  const metricsElement = createElement();
  const historyElement = createElement();
  renderRunStatsPanel({
    metricsElement,
    historyElement,
    state: {},
    documentObject: createMockDocument(),
    buildPanel: () => ({
      metricsRows: [{ label: 'Runs', value: '3' }],
      warningMessage: 'Invariant breached',
      historyRows: [{ outcomeLabel: 'Victory', dayLabel: 'Day 8', summary: 'Stable colony' }],
    }),
  });

  assert.match(metricsElement.innerHTML, /Runs/);
  assert.equal(metricsElement.children.length, 1);
  assert.equal(metricsElement.children[0].className, 'panel-card warning');
  assert.equal(metricsElement.children[0].textContent, 'Invariant breached');
  assert.equal(historyElement.children.length, 1);
  assert.match(historyElement.children[0].innerHTML, /Victory/);
});

test('renderSelectionPanel renders message and row variants', () => {
  const titleElement = createElement();
  const bodyElement = createElement();

  renderSelectionPanel({
    titleElement,
    bodyElement,
    selection: null,
    state: {},
    buildingDefinitions: {},
    buildViewModel: () => ({
      title: 'Selection',
      message: 'Select an entity',
    }),
  });
  assert.equal(titleElement.textContent, 'Selection');
  assert.equal(bodyElement.innerHTML, '<small>Select an entity</small>');

  renderSelectionPanel({
    titleElement,
    bodyElement,
    selection: { type: 'building' },
    state: {},
    buildingDefinitions: {},
    buildViewModel: () => ({
      title: 'Farm',
      rows: [{ label: 'Workers', value: '2/3' }],
    }),
  });
  assert.equal(titleElement.textContent, 'Farm');
  assert.match(bodyElement.innerHTML, /Workers/);
  assert.match(bodyElement.innerHTML, /2\/3/);
});

