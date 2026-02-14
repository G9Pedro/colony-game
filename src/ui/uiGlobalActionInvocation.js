export function buildUIGlobalActionInvocation(controller) {
  return {
    elements: controller.el,
    engine: controller.engine,
    getCallbacks: () => controller.callbacks,
    pushNotification: (payload) => {
      controller.pushNotification(payload);
    },
  };
}

