export function bindLegacyRendererEvents({
  windowObject,
  domElement,
  onResize,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onWheel,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}) {
  windowObject.addEventListener('resize', onResize);
  domElement.addEventListener('pointerdown', onPointerDown);
  domElement.addEventListener('pointermove', onPointerMove);
  domElement.addEventListener('pointerup', onPointerUp);
  domElement.addEventListener('wheel', onWheel, { passive: false });
  domElement.addEventListener('touchstart', onTouchStart, { passive: false });
  domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  domElement.addEventListener('touchend', onTouchEnd, { passive: false });

  return () => {
    windowObject.removeEventListener('resize', onResize);
    domElement.removeEventListener('pointerdown', onPointerDown);
    domElement.removeEventListener('pointermove', onPointerMove);
    domElement.removeEventListener('pointerup', onPointerUp);
    domElement.removeEventListener('wheel', onWheel);
    domElement.removeEventListener('touchstart', onTouchStart);
    domElement.removeEventListener('touchmove', onTouchMove);
    domElement.removeEventListener('touchend', onTouchEnd);
  };
}

export function disposeMeshMap(meshMap) {
  for (const mesh of meshMap.values()) {
    mesh?.geometry?.dispose?.();
    if (Array.isArray(mesh?.material)) {
      mesh.material.forEach((material) => material?.dispose?.());
    } else {
      mesh?.material?.dispose?.();
    }
  }
  meshMap.clear();
}

