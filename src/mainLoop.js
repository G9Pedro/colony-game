export function createMainLoopRuntimeState({ now } = {}) {
  return {
    lastFrame: now,
    uiTimer: 0,
    autoSaveTimer: 0,
  };
}

export function runMainLoopFrame(
  {
    timestamp,
    runtime,
    engine,
    renderer,
    ui,
    saveSnapshot,
  },
  {
    maxDeltaSeconds = 0.1,
    uiRenderIntervalSeconds = 0.2,
    autoSaveIntervalSeconds = 45,
  } = {},
) {
  const deltaSeconds = Math.min(maxDeltaSeconds, (timestamp - runtime.lastFrame) / 1000);
  runtime.lastFrame = timestamp;

  engine.update(deltaSeconds);
  renderer.render(engine.state);

  runtime.uiTimer += deltaSeconds;
  runtime.autoSaveTimer += deltaSeconds;

  if (runtime.uiTimer >= uiRenderIntervalSeconds) {
    ui.render(engine.state);
    runtime.uiTimer = 0;
  }

  if (runtime.autoSaveTimer >= autoSaveIntervalSeconds) {
    saveSnapshot(engine.snapshot());
    runtime.autoSaveTimer = 0;
  }
}
