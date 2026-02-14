export function createLegacyCameraRig(three, options = {}) {
  const {
    fov = 65,
    aspect = 1,
    near = 0.1,
    far = 300,
    radius = 42,
    yaw = Math.PI / 4,
    pitch = 0.72,
  } = options;
  return {
    camera: new three.PerspectiveCamera(fov, aspect, near, far),
    cameraTarget: new three.Vector3(0, 0, 0),
    cameraPolar: {
      radius,
      yaw,
      pitch,
    },
  };
}

export function createLegacyWebGLRenderer({
  rootElement,
  three,
  windowObject = window,
  maxPixelRatio = 2,
}) {
  const renderer = new three.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(windowObject.devicePixelRatio, maxPixelRatio));
  renderer.shadowMap.enabled = false;
  rootElement.appendChild(renderer.domElement);
  return renderer;
}

export function createLegacyInteractionState(three) {
  return {
    raycaster: new three.Raycaster(),
    mouse: new three.Vector2(),
    groundPlane: null,
    previewMarker: null,
    dragState: {
      active: false,
      moved: false,
      lastX: 0,
      lastY: 0,
    },
    touchState: {
      isPinching: false,
      pinchDistance: 0,
    },
    buildingMeshes: new Map(),
    colonistMeshes: new Map(),
  };
}

