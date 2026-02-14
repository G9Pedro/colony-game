import test from 'node:test';
import assert from 'node:assert/strict';
import { dispatchLegacyEventSessionBind } from '../src/render/legacyEventSessionDispatch.js';

test('dispatchLegacyEventSessionBind builds, creates, applies, and returns event session', () => {
  const renderer = { id: 'legacy-renderer' };
  const bindEvents = () => {};
  const windowObject = { devicePixelRatio: 2 };
  const callOrder = [];
  const invocation = { token: 'invocation' };
  const session = { token: 'session' };

  const result = dispatchLegacyEventSessionBind(renderer, {
    windowObject,
    bindEvents,
    buildInvocation: (target, options) => {
      callOrder.push('buildInvocation');
      assert.equal(target, renderer);
      assert.equal(options.windowObject, windowObject);
      assert.equal(options.bindEvents, bindEvents);
      return invocation;
    },
    createSession: (payload) => {
      callOrder.push('createSession');
      assert.equal(payload, invocation);
      return session;
    },
    applySession: (target, payload) => {
      callOrder.push('applySession');
      assert.equal(target, renderer);
      assert.equal(payload, session);
    },
  });

  assert.equal(result, session);
  assert.deepEqual(callOrder, ['buildInvocation', 'createSession', 'applySession']);
});

