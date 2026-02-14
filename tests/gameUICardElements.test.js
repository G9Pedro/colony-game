import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createBuildCardElement,
  createBuildCategoryButton,
  createResourceChipElement,
} from '../src/ui/gameUICardElements.js';

function createMockDocument() {
  return {
    createElement(tagName) {
      const node = {
        tagName,
        className: '',
        textContent: '',
        disabled: false,
        type: '',
        width: 0,
        height: 0,
        children: [],
        listeners: {},
        drawImageCalls: [],
        classList: {
          tokens: [],
          add(token) {
            this.tokens.push(token);
          },
        },
        append(...children) {
          this.children.push(...children);
        },
        appendChild(child) {
          this.children.push(child);
        },
        addEventListener(eventName, handler) {
          this.listeners[eventName] = handler;
        },
        getContext() {
          return {
            drawImage: (...args) => {
              node.drawImageCalls.push(args);
            },
          };
        },
      };
      return node;
    },
  };
}

test('createResourceChipElement renders icon and formatted resource values', () => {
  const documentObject = createMockDocument();
  const card = createResourceChipElement({
    row: {
      label: 'Wood',
      roundedValue: 42,
      rate: 1.23,
      rateClassName: 'good',
    },
    icon: { width: 16, height: 20 },
    formatRate: (rate) => `+${rate.toFixed(2)}`,
    documentObject,
  });

  assert.equal(card.className, 'resource-chip');
  assert.equal(card.children.length, 2);
  const [iconNode, meta] = card.children;
  assert.equal(iconNode.className, 'resource-icon');
  assert.equal(iconNode.width, 16);
  assert.equal(iconNode.height, 20);
  assert.equal(iconNode.drawImageCalls.length, 1);

  assert.equal(meta.className, 'resource-meta');
  assert.equal(meta.children.length, 3);
  assert.equal(meta.children[0].textContent, 'Wood');
  assert.equal(meta.children[1].textContent, '42');
  assert.equal(meta.children[2].textContent, '+1.23');
  assert.equal(meta.children[2].className, 'good');
});

test('createBuildCategoryButton wires click callback and active class', () => {
  const documentObject = createMockDocument();
  const selected = [];
  const button = createBuildCategoryButton({
    row: { id: 'housing', label: 'Housing', active: true },
    onSelectCategory: (categoryId) => selected.push(categoryId),
    documentObject,
  });

  assert.equal(button.className, 'category-pill active');
  assert.equal(button.textContent, 'Housing');
  button.listeners.click();
  assert.deepEqual(selected, ['housing']);
});

test('createBuildCardElement renders metadata and warning class', () => {
  const documentObject = createMockDocument();
  const clicked = [];
  const card = createBuildCardElement({
    row: {
      id: 'farm',
      name: 'Farm',
      subtitle: 'Needs water',
      warning: true,
      unlocked: false,
      active: true,
    },
    thumbnail: { width: 58, height: 58 },
    onToggleBuildType: (buildingId) => clicked.push(buildingId),
    documentObject,
  });

  assert.equal(card.className, 'build-card active');
  assert.equal(card.disabled, true);
  assert.equal(card.type, 'button');
  assert.equal(card.children.length, 2);
  const [thumbnailNode, meta] = card.children;
  assert.equal(thumbnailNode.className, 'build-thumb');
  assert.equal(thumbnailNode.drawImageCalls.length, 1);
  assert.equal(meta.className, 'build-meta');
  assert.equal(meta.children[0].textContent, 'Farm');
  assert.equal(meta.children[1].textContent, 'Needs water');
  assert.deepEqual(meta.children[1].classList.tokens, ['warning']);
  card.listeners.click();
  assert.deepEqual(clicked, ['farm']);
});

