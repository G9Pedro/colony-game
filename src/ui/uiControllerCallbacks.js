export function mergeUIControllerCallbacks(currentCallbacks, nextCallbacks) {
  return {
    ...currentCallbacks,
    ...nextCallbacks,
  };
}

export function applyUIControllerPersistenceCallbacks(controller, callbacks) {
  controller.callbacks = mergeUIControllerCallbacks(controller.callbacks, callbacks);
}

