import { bindLegacyRendererEvents } from './legacyRendererLifecycle.js';
import { buildLegacyEventSessionInvocation } from './legacyEventSessionInvocation.js';
import { createLegacyRendererEventSession } from './legacyRendererEvents.js';
import { applyLegacyRendererEventSession } from './legacyRendererEventState.js';

export function dispatchLegacyEventSessionBind(renderer, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildLegacyEventSessionInvocation;
  const createSession = deps.createSession ?? createLegacyRendererEventSession;
  const applySession = deps.applySession ?? applyLegacyRendererEventSession;
  const bindEvents = deps.bindEvents ?? bindLegacyRendererEvents;
  const windowObject = deps.windowObject ?? window;

  const session = createSession(buildInvocation(renderer, {
    windowObject,
    bindEvents,
  }));
  applySession(renderer, session);
  return session;
}

