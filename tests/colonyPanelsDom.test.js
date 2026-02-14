import test from 'node:test';
import assert from 'node:assert/strict';
import {
  renderColonistPanel,
  renderConstructionQueuePanel,
  renderResearchPanels,
} from '../src/ui/colonyPanelsDom.js';

function createMockDocument() {
  return {
    createElement(tagName) {
      return {
        tagName,
        className: '',
        textContent: '',
        innerHTML: '',
        disabled: false,
        type: '',
        children: [],
        listeners: {},
        append(...children) {
          this.children.push(...children);
        },
        appendChild(child) {
          this.children.push(child);
        },
        addEventListener(eventName, handler) {
          this.listeners[eventName] = handler;
        },
      };
    },
  };
}

function createListElement() {
  return {
    innerHTML: '',
    children: [],
    appendChild(node) {
      this.children.push(node);
    },
  };
}

test('renderResearchPanels renders active research and option cards', () => {
  const documentObject = createMockDocument();
  const currentElement = createListElement();
  const listElement = createListElement();
  const startedResearchIds = [];

  renderResearchPanels({
    currentElement,
    listElement,
    state: { research: {}, researched: [] },
    researchDefinitions: {},
    getAvailableResearch: () => [],
    onStartResearch: (researchId) => startedResearchIds.push(researchId),
    documentObject,
    buildActiveResearch: () => ({ name: 'Masonry', progress: 55.2 }),
    buildResearchOptions: () => [
      { id: 'masonry', name: 'Masonry', description: 'Stone walls', cost: 40, disabled: false },
    ],
  });

  assert.match(currentElement.innerHTML, /Masonry/);
  assert.equal(listElement.children.length, 1);
  const card = listElement.children[0];
  assert.equal(card.className, 'panel-card');
  const [button, text] = card.children;
  assert.equal(button.className, 'secondary');
  assert.equal(button.textContent, 'Research Masonry');
  assert.equal(button.disabled, false);
  assert.equal(text.textContent, 'Stone walls · 40 knowledge');
  button.listeners.click();
  assert.deepEqual(startedResearchIds, ['masonry']);
});

test('renderConstructionQueuePanel renders empty message and queue cards', () => {
  const documentObject = createMockDocument();
  const listElement = createListElement();

  renderConstructionQueuePanel({
    listElement,
    state: { constructionQueue: [] },
    buildingDefinitions: {},
    documentObject,
    buildQueueRows: () => {
      throw new Error('should not be called for empty queue');
    },
  });
  assert.match(listElement.innerHTML, /No active construction/);

  listElement.innerHTML = '';
  listElement.children = [];
  renderConstructionQueuePanel({
    listElement,
    state: { constructionQueue: [{ id: 'q1' }] },
    buildingDefinitions: {},
    documentObject,
    buildQueueRows: () => [{ name: 'Hut', progress: 45.7 }],
  });
  assert.equal(listElement.children.length, 1);
  assert.match(listElement.children[0].innerHTML, /Hut/);
});

test('renderColonistPanel renders mapped colonist rows', () => {
  const documentObject = createMockDocument();
  const listElement = createListElement();

  renderColonistPanel({
    listElement,
    state: { colonists: [{}] },
    limit: 5,
    documentObject,
    buildRows: (_colonists, limit) => {
      assert.equal(limit, 5);
      return [
        {
          name: 'Ava',
          job: 'builder',
          task: 'Building',
          health: 91,
          hunger: 10,
          rest: 20,
          morale: 85,
        },
      ];
    },
  });

  assert.equal(listElement.children.length, 1);
  assert.match(listElement.children[0].innerHTML, /Ava/);
  assert.match(listElement.children[0].innerHTML, /H91 F10 R20 M85/);
});

