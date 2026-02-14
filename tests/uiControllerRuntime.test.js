import test from 'node:test';
import assert from 'node:assert/strict';
import { createUIControllerRuntime } from '../src/ui/uiControllerRuntime.js';

test('createUIControllerRuntime wires UI dependencies with shared sprite factory', () => {
  const calls = [];
  class SpriteFactoryMock {
    constructor(options) {
      this.options = options;
      calls.push({ method: 'spriteFactory', options });
    }
  }
  class GameUIMock {
    constructor(options) {
      this.options = options;
      calls.push({ method: 'gameUI', options });
    }
  }
  class NotificationCenterMock {
    constructor(target) {
      this.target = target;
      calls.push({ method: 'notifications', target });
    }
  }
  class MinimapMock {
    constructor(canvas, options) {
      this.canvas = canvas;
      this.options = options;
      calls.push({ method: 'minimap', canvas, options });
    }
  }

  const elements = {
    notifications: { id: 'notifications' },
    minimapCanvas: { id: 'minimap-canvas' },
  };
  const onCenterCalls = [];
  const runtime = createUIControllerRuntime({
    elements,
    buildingDefinitions: [{ id: 'hut' }],
    researchDefinitions: [{ id: 'agriculture' }],
    resourceDefinitions: [{ id: 'wood' }],
    onCenterRequest: (point) => onCenterCalls.push(point),
    dependencies: {
      SpriteFactoryClass: SpriteFactoryMock,
      GameUIClass: GameUIMock,
      MinimapClass: MinimapMock,
      NotificationCenterClass: NotificationCenterMock,
    },
  });

  assert.equal(runtime.spriteFactory instanceof SpriteFactoryMock, true);
  assert.equal(runtime.gameUI instanceof GameUIMock, true);
  assert.equal(runtime.notifications instanceof NotificationCenterMock, true);
  assert.equal(runtime.minimap instanceof MinimapMock, true);
  assert.deepEqual(runtime.spriteFactory.options, { quality: 'balanced' });
  assert.equal(runtime.gameUI.options.spriteFactory, runtime.spriteFactory);
  assert.equal(runtime.notifications.target, elements.notifications);
  assert.equal(runtime.minimap.canvas, elements.minimapCanvas);

  runtime.minimap.options.onCenterRequest({ x: 2, z: 3 });
  assert.deepEqual(onCenterCalls, [{ x: 2, z: 3 }]);

  assert.deepEqual(calls.map((entry) => entry.method), [
    'spriteFactory',
    'gameUI',
    'notifications',
    'minimap',
  ]);
});

test('createUIControllerRuntime tolerates missing center callback', () => {
  class MinimapMock {
    constructor(_canvas, options) {
      this.options = options;
    }
  }
  const runtime = createUIControllerRuntime({
    elements: { notifications: {}, minimapCanvas: {} },
    buildingDefinitions: [],
    researchDefinitions: [],
    resourceDefinitions: [],
    dependencies: {
      SpriteFactoryClass: class {},
      GameUIClass: class {},
      MinimapClass: MinimapMock,
      NotificationCenterClass: class {},
    },
  });

  assert.doesNotThrow(() => {
    runtime.minimap.options.onCenterRequest({ x: 1, z: 1 });
  });
});

