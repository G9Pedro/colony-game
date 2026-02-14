import { BUILDING_DEFINITIONS } from './content/buildings.js';
import { BALANCE_PROFILE_DEFINITIONS } from './content/balanceProfiles.js';
import { SCENARIO_DEFINITIONS } from './content/scenarios.js';
import { RESOURCE_DEFINITIONS } from './content/resources.js';
import { RESEARCH_DEFINITIONS } from './content/research.js';
import { GameEngine } from './game/gameEngine.js';
import { isBuildingUnlocked } from './game/selectors.js';
import { saveGameState } from './persistence/saveLoad.js';
import {
  createMainNotifier,
  emitMainStartupNotifications,
  registerEngineNotifications,
} from './mainNotifications.js';
import { createMainPersistenceCallbacks } from './mainPersistenceCallbacks.js';
import { FallbackRenderer } from './render/fallbackRenderer.js';
import { SceneRenderer } from './render/sceneRenderer.js';
import { isPlacementValid } from './systems/constructionSystem.js';
import { UIController } from './ui/uiController.js';

const sceneRoot = document.getElementById('scene-root');
const requestedSeed = new URLSearchParams(window.location.search).get('seed');
const requestedScenario = new URLSearchParams(window.location.search).get('scenario');
const requestedBalanceProfile = new URLSearchParams(window.location.search).get('balance');
const engine = new GameEngine({
  ...(requestedSeed ? { seed: requestedSeed } : {}),
  ...(requestedScenario ? { scenarioId: requestedScenario } : {}),
  ...(requestedBalanceProfile ? { balanceProfileId: requestedBalanceProfile } : {}),
});
let usingFallbackRenderer = false;
let renderer;
try {
  renderer = new SceneRenderer(sceneRoot);
} catch (error) {
  renderer = new FallbackRenderer(sceneRoot);
  usingFallbackRenderer = true;
}
const ui = new UIController({
  engine,
  buildingDefinitions: BUILDING_DEFINITIONS,
  researchDefinitions: RESEARCH_DEFINITIONS,
  resourceDefinitions: RESOURCE_DEFINITIONS,
});
ui.attachRenderer(renderer);
ui.setRendererModeOptions(renderer.getAvailableModes?.() ?? ['isometric'], renderer.getRendererMode?.() ?? 'isometric');
ui.setScenarioOptions(Object.values(SCENARIO_DEFINITIONS), engine.state.scenarioId);
ui.setBalanceProfileOptions(Object.values(BALANCE_PROFILE_DEFINITIONS), engine.state.balanceProfileId);

const notify = createMainNotifier({ ui });
registerEngineNotifications(engine, notify);
ui.setPersistenceCallbacks(createMainPersistenceCallbacks({
  engine,
  ui,
  renderer,
  notify,
}));

renderer.setGroundClickHandler((point) => {
  const buildingType = engine.state.selectedBuildingType;
  if (!buildingType) {
    notify({ kind: 'warn', message: 'Select a building first.' });
    return;
  }

  const result = engine.queueBuilding(buildingType, point.x, point.z);
  if (!result.ok) {
    notify({ kind: 'error', message: result.message });
    return;
  }

  engine.setSelectedBuildingType(null);
  ui.setSelectedBuildType(null);
  renderer.updatePlacementMarker(null, true);
});

renderer.setPlacementPreviewHandler((point) => {
  const buildingType = engine.state.selectedBuildingType;
  if (!buildingType) {
    renderer.updatePlacementMarker(null, false);
    return;
  }

  const definition = BUILDING_DEFINITIONS[buildingType];
  if (!isBuildingUnlocked(engine.state, definition)) {
    renderer.updatePlacementMarker(point, false);
    return;
  }
  const placement = isPlacementValid(engine.state, buildingType, point.x, point.z);
  renderer.updatePlacementMarker(point, placement.valid);
});
renderer.setEntitySelectHandler((entity) => {
  ui.setSelectedEntity(entity);
});

let lastFrame = performance.now();
let uiTimer = 0;
let autoSaveTimer = 0;

function gameLoop(timestamp) {
  const deltaSeconds = Math.min(0.1, (timestamp - lastFrame) / 1000);
  lastFrame = timestamp;

  engine.update(deltaSeconds);
  renderer.render(engine.state);

  uiTimer += deltaSeconds;
  autoSaveTimer += deltaSeconds;

  if (uiTimer >= 0.2) {
    ui.render(engine.state);
    uiTimer = 0;
  }

  if (autoSaveTimer >= 45) {
    saveGameState(engine.snapshot());
    autoSaveTimer = 0;
  }

  requestAnimationFrame(gameLoop);
}

ui.render(engine.state);
emitMainStartupNotifications({
  notify,
  rngSeed: engine.state.rngSeed,
  usingFallbackRenderer,
});
requestAnimationFrame(gameLoop);
