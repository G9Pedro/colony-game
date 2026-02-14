export function createIsometricPreviewState(position, valid = true) {
  if (!position) {
    return null;
  }
  return {
    x: position.x,
    z: position.z,
    valid,
  };
}

export function resolveIsometricPreviewUpdate(position, valid = true) {
  return createIsometricPreviewState(position, valid);
}

