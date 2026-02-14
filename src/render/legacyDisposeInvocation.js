export function buildLegacyDisposeInvocation(renderer) {
  return {
    unbindEvents: renderer.unbindEvents,
    setUnbindEvents: (value) => {
      renderer.unbindEvents = value;
    },
    buildingMeshes: renderer.buildingMeshes,
    colonistMeshes: renderer.colonistMeshes,
    renderer: renderer.renderer,
  };
}

