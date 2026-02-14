import { InteractionController } from './interactionController.js';

export function createIsometricInteractionSession({
  renderer,
  InteractionControllerClass = InteractionController,
}) {
  return new InteractionControllerClass({
    canvas: renderer.canvas,
    camera: renderer.camera,
    onPreview: (point) => {
      if (renderer.onPlacementPreview) {
        renderer.onPlacementPreview({ x: point.tile.x, z: point.tile.z });
      }
    },
    onHover: (point) => {
      renderer.updateHoverSelection(point.local.x, point.local.y);
    },
    onClick: (point) => {
      renderer.handleClick(point.local.x, point.local.y, point.tile);
    },
  });
}

