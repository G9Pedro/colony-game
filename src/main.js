import { BUILDING_DEFINITIONS } from './content/buildings.js';
import { RESOURCE_DEFINITIONS } from './content/resources.js';
import { RESEARCH_DEFINITIONS } from './content/research.js';
import { GameEngine } from './game/gameEngine.js';
import { isBuildingUnlocked } from './game/selectors.js';
import { loadGameState, saveGameState, isLikelyValidState, clearSavedGame } from './persistence/saveLoad.js';
import { FallbackRenderer } from './render/fallbackRenderer.js';
import { SceneRenderer } from './render/sceneRenderer.js';
import { isPlacementValid } from './systems/constructionSystem.js';
import { UIController } from './ui/uiController.js';

const sceneRoot = document.getElementById('scene-root');
const engine = new GameEngine();
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

const recentMessages = new Map();

function notify(payload) {
  const key = payload.message;
  const now = Date.now();
  const lastShown = recentMessages.get(key) ?? 0;
  if (now - lastShown < 1800) {
    return;
  }
  recentMessages.set(key, now);
  ui.pushNotification(payload);
}

engine.on('construction-complete', notify);
engine.on('construction-queued', notify);
engine.on('colonist-hired', notify);
engine.on('colonist-death', notify);
engine.on('research-started', notify);
engine.on('research-complete', notify);
engine.on('storage-overflow', notify);
engine.on('game-over', notify);
engine.on('game-reset', notify);
engine.on('state-loaded', notify);

ui.setPersistenceCallbacks({
  onSave: () => {
    saveGameState(engine.snapshot());
    notify({ kind: 'success', message: 'Game saved.' });
  },
  onLoad: () => {
    const loaded = loadGameState();
    if (!loaded || !isLikelyValidState(loaded)) {
      notify({ kind: 'error', message: 'No valid save found.' });
      return;
    }
    engine.loadState(loaded);
    ui.setSelectedBuildType(null);
  },
  onReset: () => {
    clearSavedGame();
    engine.reset();
    ui.setSelectedBuildType(null);
  },
});

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
notify({ kind: 'success', message: 'Colony simulation initialized.' });
if (usingFallbackRenderer) {
  notify({
    kind: 'warn',
    message: 'WebGL unavailable. Running in fallback 2D renderer mode.',
  });
}
requestAnimationFrame(gameLoop);
