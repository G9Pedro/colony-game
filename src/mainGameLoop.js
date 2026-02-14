import { createMainLoopRuntimeState, runMainLoopFrame } from './mainLoop.js';

export function createMainGameLoop(
  {
    engine,
    renderer,
    ui,
    saveSnapshot,
    requestFrame,
  },
  deps = {},
) {
  const nowProvider = deps.nowProvider ?? (() => performance.now());
  const runFrame = deps.runFrame ?? runMainLoopFrame;
  const createRuntime = deps.createRuntime ?? createMainLoopRuntimeState;

  const runtime = createRuntime({ now: nowProvider() });
  const gameLoop = (timestamp) => {
    runFrame({
      timestamp,
      runtime,
      engine,
      renderer,
      ui,
      saveSnapshot,
    });
    requestFrame(gameLoop);
  };

  return {
    runtime,
    gameLoop,
    start: () => requestFrame(gameLoop),
  };
}
