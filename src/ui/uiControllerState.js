export function attachUIRenderer(controller, renderer) {
  controller.renderer = renderer;
  controller.el.rendererModeSelect.value = renderer.getRendererMode?.() ?? 'isometric';
}

export function applyUIControllerSelectedEntity(controller, entity) {
  controller.selectedEntity = entity;
}

export function applyUIControllerSelectedBuildType(controller, buildingType) {
  controller.selectedBuildType = buildingType;
}

export function showUIControllerBanner(controller, message) {
  controller.el.messageBanner.classList.remove('hidden');
  controller.el.messageBanner.textContent = message;
}

export function hideUIControllerBanner(controller) {
  controller.el.messageBanner.classList.add('hidden');
}

export function pushUIControllerNotification(controller, payload) {
  controller.notifications.push(payload);
}

