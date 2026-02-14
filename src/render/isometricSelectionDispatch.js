import { handleIsometricClickSelection, updateIsometricHoverSelection } from './isometricInteractionHandlers.js';
import {
  applyIsometricSelectedEntity,
  buildIsometricClickSelectionInvocation,
  buildIsometricHoverSelectionInvocation,
} from './isometricSelectionState.js';

export function dispatchIsometricHoverSelection(renderer, localX, localY, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricHoverSelectionInvocation;
  const handleHover = deps.handleHover ?? updateIsometricHoverSelection;
  handleHover(buildInvocation(renderer, localX, localY));
}

export function dispatchIsometricEntitySelection(renderer, entity, deps = {}) {
  const applySelection = deps.applySelection ?? applyIsometricSelectedEntity;
  applySelection(renderer, entity);
}

export function dispatchIsometricClickSelection(renderer, localX, localY, tile, deps = {}) {
  const buildInvocation = deps.buildInvocation ?? buildIsometricClickSelectionInvocation;
  const handleClick = deps.handleClick ?? handleIsometricClickSelection;
  handleClick(buildInvocation(renderer, localX, localY, tile));
}

