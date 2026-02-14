export const ENGINE_NOTIFICATION_EVENTS = Object.freeze([
  'construction-complete',
  'construction-queued',
  'colonist-hired',
  'colonist-death',
  'research-started',
  'research-complete',
  'objective-complete',
  'storage-overflow',
  'game-over',
  'game-reset',
  'state-loaded',
  'scenario-change',
  'balance-profile-change',
  'state-invalid',
]);

export function createMainNotifier({
  ui,
  dedupeWindowMs = 1800,
  nowProvider = () => Date.now(),
  recentMessages = new Map(),
}) {
  return function notify(payload) {
    const key = payload.message;
    const now = nowProvider();
    const lastShown = recentMessages.get(key);
    if (recentMessages.has(key) && now - lastShown < dedupeWindowMs) {
      return;
    }
    recentMessages.set(key, now);
    ui.pushNotification(payload);
  };
}

export function registerEngineNotifications(
  engine,
  notify,
  events = ENGINE_NOTIFICATION_EVENTS,
) {
  events.forEach((eventName) => {
    engine.on(eventName, notify);
  });
}

export function emitMainStartupNotifications({
  notify,
  rngSeed,
  usingFallbackRenderer,
}) {
  notify({ kind: 'success', message: 'Colony simulation initialized.' });
  notify({
    kind: 'warn',
    message: `Simulation seed: ${rngSeed}`,
  });
  if (usingFallbackRenderer) {
    notify({
      kind: 'warn',
      message: 'WebGL unavailable. Running in fallback 2D renderer mode.',
    });
  }
}
