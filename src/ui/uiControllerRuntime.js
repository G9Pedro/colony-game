import { SpriteFactory } from '../render/spriteFactory.js';
import { GameUI } from './gameUI.js';
import { Minimap } from './minimap.js';
import { NotificationCenter } from './notifications.js';

export function createUIControllerRuntime({
  elements,
  buildingDefinitions,
  researchDefinitions,
  resourceDefinitions,
  onCenterRequest,
  dependencies = {},
}) {
  const {
    SpriteFactoryClass = SpriteFactory,
    GameUIClass = GameUI,
    MinimapClass = Minimap,
    NotificationCenterClass = NotificationCenter,
  } = dependencies;

  const spriteFactory = new SpriteFactoryClass({ quality: 'balanced' });
  const gameUI = new GameUIClass({
    elements,
    buildingDefinitions,
    researchDefinitions,
    resourceDefinitions,
    spriteFactory,
  });
  const notifications = new NotificationCenterClass(elements.notifications);
  const minimap = new MinimapClass(elements.minimapCanvas, {
    onCenterRequest: (point) => {
      onCenterRequest?.(point);
    },
  });

  return {
    spriteFactory,
    gameUI,
    notifications,
    minimap,
  };
}

