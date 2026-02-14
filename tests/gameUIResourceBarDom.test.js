import test from 'node:test';
import assert from 'node:assert/strict';
import { renderGameUIResourceBar } from '../src/ui/gameUIResourceBarDom.js';

function createResourceBarElements() {
  const appended = [];
  return {
    elements: {
      resourceList: {
        innerHTML: 'occupied',
        appendChild: (node) => appended.push(node),
      },
    },
    appended,
  };
}

test('renderGameUIResourceBar clears container and appends resource cards', () => {
  const { elements, appended } = createResourceBarElements();
  const rowCalls = [];
  const tweenCalls = [];
  const iconCalls = [];
  const cardCalls = [];
  const rows = [
    { id: 'wood', roundedValue: 10, rate: 1.5, rateClassName: 'positive' },
    { id: 'food', roundedValue: 8, rate: -0.5, rateClassName: 'negative' },
  ];

  renderGameUIResourceBar({
    elements,
    resourceDefinitions: { wood: {}, food: {} },
    resources: { wood: 10, food: 8 },
    resourceRates: { wood: 1.5, food: -0.5 },
    valueAnimator: {
      tweenValue: (key, value) => {
        tweenCalls.push({ key, value });
        return value;
      },
    },
    spriteFactory: {
      getResourceIcon: (id, size) => {
        iconCalls.push({ id, size });
        return `${id}-${size}`;
      },
    },
    buildResourceBarRows: (payload) => {
      rowCalls.push({
        resourceDefinitions: payload.resourceDefinitions,
        resources: payload.resources,
        resourceRates: payload.resourceRates,
      });
      payload.mapDisplayedValue('wood', 10);
      payload.mapDisplayedValue('food', 8);
      return rows;
    },
    createResourceChipElement: ({ row, icon, formatRate }) => {
      cardCalls.push({ row, icon, formatRate });
      return { id: row.id };
    },
    formatRate: (value) => `${value}`,
  });

  assert.equal(elements.resourceList.innerHTML, '');
  assert.deepEqual(rowCalls, [{
    resourceDefinitions: { wood: {}, food: {} },
    resources: { wood: 10, food: 8 },
    resourceRates: { wood: 1.5, food: -0.5 },
  }]);
  assert.deepEqual(tweenCalls, [
    { key: 'resource:wood', value: 10 },
    { key: 'resource:food', value: 8 },
  ]);
  assert.deepEqual(iconCalls, [
    { id: 'wood', size: 20 },
    { id: 'food', size: 20 },
  ]);
  assert.equal(cardCalls.length, 2);
  assert.deepEqual(appended, [{ id: 'wood' }, { id: 'food' }]);
});

