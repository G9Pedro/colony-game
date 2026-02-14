export function disposeLegacyMaterial(material) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry?.dispose?.());
    return;
  }
  material?.dispose?.();
}

export function disposeLegacyMesh(mesh) {
  mesh?.geometry?.dispose?.();
  disposeLegacyMaterial(mesh?.material);
}

