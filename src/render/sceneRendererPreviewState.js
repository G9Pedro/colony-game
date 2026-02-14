export function resolveSceneRendererPreviewUpdate(position, valid = true) {
  if (!position) {
    return {
      shouldClear: true,
      position: null,
      valid: true,
      preview: null,
    };
  }
  return {
    shouldClear: false,
    position,
    valid,
    preview: { position, valid },
  };
}

