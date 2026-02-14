import test from 'node:test';
import assert from 'node:assert/strict';
import { appendColonistRenderables } from '../src/render/entityColonistRenderables.js';

function createCamera() {
  return {
    zoom: 1,
    viewportWidth: 800,
    viewportHeight: 600,
    worldToScreen: (x, z) => ({
      x: 200 + x * 20,
      y: 200 + z * 20,
    }),
  };
}

test('appendColonistRenderables includes only alive colonists with render-state entries', () => {
  const renderables = [];
  const interactiveEntities = [];
  const spriteCalls = [];
  appendColonistRenderables({
    state: {
      timeSeconds: 12,
      colonists: [
        { id: 'c1', alive: true, age: 4, job: 'builder', task: 'Idle' },
        { id: 'c2', alive: false, age: 4, job: 'builder', task: 'Idle' },
        { id: 'c3', alive: true, age: 1, job: 'builder', task: 'Working' },
      ],
    },
    camera: createCamera(),
    spriteFactory: {
      getColonistSprite: (...args) => {
        spriteCalls.push(args);
        return { width: 20, height: 30 };
      },
    },
    colonistRenderState: new Map([
      ['c1', { x: 1, z: 2 }],
    ]),
    renderables,
    interactiveEntities,
  });

  assert.equal(spriteCalls.length, 1);
  assert.equal(spriteCalls[0][0], 'builder');
  assert.equal(spriteCalls[0][2].idle, true);
  assert.equal(renderables.length, 1);
  assert.equal(interactiveEntities.length, 1);
  assert.equal(interactiveEntities[0].entity.type, 'colonist');
  assert.equal(interactiveEntities[0].entity.id, 'c1');
});
