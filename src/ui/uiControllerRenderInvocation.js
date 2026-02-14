export function buildUiControllerRenderInvocation(controller, state) {
  return {
    state,
    selectedBuildType: controller.selectedBuildType,
    selectedEntity: controller.selectedEntity,
    engine: controller.engine,
    renderer: controller.renderer,
    elements: controller.el,
    gameUI: controller.gameUI,
    minimap: controller.minimap,
    pushNotification: (payload) => controller.pushNotification(payload),
    setSelectedBuildType: (buildingType) => {
      controller.selectedBuildType = buildingType;
    },
    showBanner: (message) => controller.showBanner(message),
    hideBanner: () => controller.hideBanner(),
  };
}

