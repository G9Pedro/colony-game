import { BUILDING_DEFINITIONS } from './content/buildings.js';
import { BALANCE_PROFILE_DEFINITIONS } from './content/balanceProfiles.js';
import { SCENARIO_DEFINITIONS } from './content/scenarios.js';
import { RESOURCE_DEFINITIONS } from './content/resources.js';
import { RESEARCH_DEFINITIONS } from './content/research.js';
import { GameEngine } from './game/gameEngine.js';
import { isBuildingUnlocked } from './game/selectors.js';
import { loadGameState, saveGameState, validateSaveState, clearSavedGame } from './persistence/saveLoad.js';
import { downloadStateSnapshot, readStateFromFile } from './persistence/fileTransfer.js';
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
engine.on('objective-complete', notify);
engine.on('storage-overflow', notify);
engine.on('game-over', notify);
engine.on('game-reset', notify);
engine.on('state-loaded', notify);
engine.on('scenario-change', notify);
engine.on('balance-profile-change', notify);
engine.on('state-invalid', notify);

ui.setPersistenceCallbacks({
  onSave: () => {
    saveGameState(engine.snapshot());
    notify({ kind: 'success', message: 'Game saved.' });
  },
  onLoad: () => {
    const loaded = loadGameState();
    if (!loaded) {
      notify({ kind: 'error', message: 'No save found.' });
      return;
    }
    const validation = validateSaveState(loaded);
    if (!validation.ok) {
      notify({ kind: 'error', message: `Save invalid: ${validation.errors[0]}` });
      return;
    }
    const result = engine.loadState(loaded);
    if (!result.ok) {
      notify({ kind: 'error', message: `Failed to load save: ${result.message}` });
      return;
    }
    ui.setSelectedBuildType(null);
  },
  onExport: () => {
    downloadStateSnapshot(engine.snapshot());
    notify({ kind: 'success', message: 'Save exported to file.' });
  },
  onImport: async (file) => {
    try {
      const loaded = await readStateFromFile(file);
      const validation = validateSaveState(loaded);
      if (!validation.ok) {
        notify({ kind: 'error', message: `Imported save invalid: ${validation.errors[0]}` });
        return;
      }
      const result = engine.loadState(loaded);
      if (!result.ok) {
        notify({ kind: 'error', message: `Failed to load imported save: ${result.message}` });
        return;
      }
      ui.setSelectedBuildType(null);
      notify({ kind: 'success', message: 'Save imported successfully.' });
    } catch (error) {
      notify({ kind: 'error', message: error?.message ?? 'Failed to import save file.' });
    }
  },
  onReset: () => {
    clearSavedGame();
    engine.reset();
    ui.setSelectedBuildType(null);
  },
  onScenarioChange: (scenarioId) => {
    engine.setScenario(scenarioId);
    ui.setSelectedBuildType(null);
  },
  onBalanceProfileChange: (balanceProfileId) => {
    engine.setBalanceProfile(balanceProfileId);
    ui.setSelectedBuildType(null);
  },
  onRendererModeChange: (mode) => {
    const switched = renderer.setRendererMode?.(mode) ?? false;
    ui.attachRenderer(renderer);
    if (switched) {
      notify({
        kind: 'success',
        message: `Renderer switched to ${renderer.getRendererMode?.() ?? mode}.`,
      });
    }
    return switched;
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
notify({ kind: 'success', message: 'Colony simulation initialized.' });
notify({
  kind: 'warn',
  message: `Simulation seed: ${engine.state.rngSeed}`,
});
if (usingFallbackRenderer) {
  notify({
    kind: 'warn',
    message: 'WebGL unavailable. Running in fallback 2D renderer mode.',
  });
}
requestAnimationFrame(gameLoop);
