import test from 'node:test';
import assert from 'node:assert/strict';
import { buildUIGlobalActionInvocation } from '../src/ui/uiGlobalActionInvocation.js';

test('buildUIGlobalActionInvocation maps controller dependencies and delegates notifications', () => {
  const notifications = [];
  const controller = {
    el: { pauseBtn: {} },
    engine: { togglePause: () => {} },
    callbacks: { onSave: () => {} },
    pushNotification: (payload) => notifications.push(payload),
  };

  const invocation = buildUIGlobalActionInvocation(controller);
  const payload = { kind: 'warn', message: 'No storage' };

  assert.equal(invocation.elements, controller.el);
  assert.equal(invocation.engine, controller.engine);
  assert.equal(invocation.getCallbacks(), controller.callbacks);

  invocation.pushNotification(payload);
  assert.deepEqual(notifications, [payload]);
});

test('buildUIGlobalActionInvocation getCallbacks reads latest callback object', () => {
  const controller = {
    el: {},
    engine: {},
    callbacks: { onSave: () => 'old' },
    pushNotification: () => {},
  };
  const invocation = buildUIGlobalActionInvocation(controller);

  const nextCallbacks = { onSave: () => 'new' };
  controller.callbacks = nextCallbacks;

  assert.equal(invocation.getCallbacks(), nextCallbacks);
});

