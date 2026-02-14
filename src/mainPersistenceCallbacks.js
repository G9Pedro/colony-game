import { downloadStateSnapshot, readStateFromFile } from './persistence/fileTransfer.js';
import {
  clearSavedGame,
  loadGameState,
  saveGameState,
  validateSaveState,
} from './persistence/saveLoad.js';

export function createMainPersistenceCallbacks(
  {
    engine,
    ui,
    renderer,
    notify,
  },
  deps = {},
) {
  const saveSnapshot = deps.saveSnapshot ?? saveGameState;
  const loadSnapshot = deps.loadSnapshot ?? loadGameState;
  const validateSnapshot = deps.validateSnapshot ?? validateSaveState;
  const clearSnapshot = deps.clearSnapshot ?? clearSavedGame;
  const exportSnapshot = deps.exportSnapshot ?? downloadStateSnapshot;
  const importSnapshot = deps.importSnapshot ?? readStateFromFile;
  return {
    onSave: () => {
      saveSnapshot(engine.snapshot());
      notify({ kind: 'success', message: 'Game saved.' });
    },
    onLoad: () => {
      const loaded = loadSnapshot();
      if (!loaded) {
        notify({ kind: 'error', message: 'No save found.' });
        return;
      }
      const validation = validateSnapshot(loaded);
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
      exportSnapshot(engine.snapshot());
      notify({ kind: 'success', message: 'Save exported to file.' });
    },
    onImport: async (file) => {
      try {
        const loaded = await importSnapshot(file);
        const validation = validateSnapshot(loaded);
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
      clearSnapshot();
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
  };
}
