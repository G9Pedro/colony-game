import { isBuildingUnlocked } from './game/selectors.js';
import { isPlacementValid } from './systems/constructionSystem.js';

export function bindMainRendererInteractions(
  {
    renderer,
    engine,
    ui,
    notify,
    buildingDefinitions,
  },
  deps = {},
) {
  const isUnlocked = deps.isUnlocked ?? isBuildingUnlocked;
  const isPlacementAllowed = deps.isPlacementAllowed ?? isPlacementValid;

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

    const definition = buildingDefinitions[buildingType];
    if (!isUnlocked(engine.state, definition)) {
      renderer.updatePlacementMarker(point, false);
      return;
    }

    const placement = isPlacementAllowed(engine.state, buildingType, point.x, point.z);
    renderer.updatePlacementMarker(point, placement.valid);
  });

  renderer.setEntitySelectHandler((entity) => {
    ui.setSelectedEntity(entity);
  });
}
