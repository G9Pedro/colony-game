import { BUILDING_DEFINITIONS } from './content/buildings.js';
import { BALANCE_PROFILE_DEFINITIONS } from './content/balanceProfiles.js';
import { SCENARIO_DEFINITIONS } from './content/scenarios.js';
import { RESOURCE_DEFINITIONS } from './content/resources.js';
import { RESEARCH_DEFINITIONS } from './content/research.js';
import { GameEngine } from './game/gameEngine.js';
import { createMainGameLoop } from './mainGameLoop.js';
import { buildMainEngineOptions, parseMainLaunchParams } from './mainLaunchOptions.js';
import { saveGameState } from './persistence/saveLoad.js';
import {
  createMainNotifier,
  emitMainStartupNotifications,
  registerEngineNotifications,
} from './mainNotifications.js';
import { createMainPersistenceCallbacks } from './mainPersistenceCallbacks.js';
import { createMainRenderer } from './mainRendererBootstrap.js';
import { bindMainRendererInteractions } from './mainRendererBindings.js';
import { bootstrapMainUI } from './mainUIBootstrap.js';
import { FallbackRenderer } from './render/fallbackRenderer.js';
import { SceneRenderer } from './render/sceneRenderer.js';
import { UIController } from './ui/uiController.js';

const sceneRoot = document.getElementById('scene-root');
const launchParams = parseMainLaunchParams(window.location.search);
const engine = new GameEngine(buildMainEngineOptions(launchParams));
const {
  renderer,
  usingFallbackRenderer,
} = createMainRenderer(sceneRoot, {
  createSceneRenderer: (target) => new SceneRenderer(target),
  createFallbackRenderer: (target) => new FallbackRenderer(target),
});
const ui = new UIController({
  engine,
  buildingDefinitions: BUILDING_DEFINITIONS,
  researchDefinitions: RESEARCH_DEFINITIONS,
  resourceDefinitions: RESOURCE_DEFINITIONS,
});
bootstrapMainUI({
  ui,
  renderer,
  engine,
  scenarioDefinitions: SCENARIO_DEFINITIONS,
  balanceProfileDefinitions: BALANCE_PROFILE_DEFINITIONS,
});

const notify = createMainNotifier({ ui });
registerEngineNotifications(engine, notify);
ui.setPersistenceCallbacks(createMainPersistenceCallbacks({
  engine,
  ui,
  renderer,
  notify,
}));
bindMainRendererInteractions({
  renderer,
  engine,
  ui,
  notify,
  buildingDefinitions: BUILDING_DEFINITIONS,
});

const mainLoop = createMainGameLoop({
  engine,
  renderer,
  ui,
  saveSnapshot: saveGameState,
  requestFrame: requestAnimationFrame,
});

ui.render(engine.state);
emitMainStartupNotifications({
  notify,
  rngSeed: engine.state.rngSeed,
  usingFallbackRenderer,
});
mainLoop.start();
