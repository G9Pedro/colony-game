import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createMainNotifier,
  emitMainStartupNotifications,
  ENGINE_NOTIFICATION_EVENTS,
  registerEngineNotifications,
} from '../src/mainNotifications.js';

test('createMainNotifier deduplicates repeated messages inside cooldown window', () => {
  const notifications = [];
  let now = 1000;
  const notify = createMainNotifier({
    ui: {
      pushNotification: (payload) => notifications.push(payload),
    },
    dedupeWindowMs: 1800,
    nowProvider: () => now,
  });

  notify({ kind: 'warn', message: 'Low food' });
  notify({ kind: 'warn', message: 'Low food' });
  now += 1801;
  notify({ kind: 'warn', message: 'Low food' });

  assert.deepEqual(notifications, [
    { kind: 'warn', message: 'Low food' },
    { kind: 'warn', message: 'Low food' },
  ]);
});

test('registerEngineNotifications binds notifier to all configured events', () => {
  const registrations = [];
  const engine = {
    on: (eventName, handler) => registrations.push({ eventName, handler }),
  };
  const notify = () => {};

  registerEngineNotifications(engine, notify);

  assert.deepEqual(
    registrations.map(({ eventName }) => eventName),
    [...ENGINE_NOTIFICATION_EVENTS],
  );
  assert.ok(registrations.every(({ handler }) => handler === notify));
});

test('emitMainStartupNotifications sends seed and fallback startup messages', () => {
  const messages = [];
  const notify = (payload) => messages.push(payload);

  emitMainStartupNotifications({
    notify,
    rngSeed: 'seed-123',
    usingFallbackRenderer: true,
  });

  assert.deepEqual(messages, [
    { kind: 'success', message: 'Colony simulation initialized.' },
    { kind: 'warn', message: 'Simulation seed: seed-123' },
    { kind: 'warn', message: 'WebGL unavailable. Running in fallback 2D renderer mode.' },
  ]);
});

test('emitMainStartupNotifications omits fallback warning when not needed', () => {
  const messages = [];
  emitMainStartupNotifications({
    notify: (payload) => messages.push(payload),
    rngSeed: 'seed-999',
    usingFallbackRenderer: false,
  });

  assert.equal(messages.length, 2);
  assert.equal(messages[1].message, 'Simulation seed: seed-999');
});
