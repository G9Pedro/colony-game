export class FallbackRenderer {
  constructor(rootElement) {
    this.rootElement = rootElement;
    this.onGroundClick = null;
    this.onPlacementPreview = null;
    this.preview = null;

    this.canvas = document.createElement('canvas');
    this.canvas.width = rootElement.clientWidth;
    this.canvas.height = rootElement.clientHeight;
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.display = 'block';
    rootElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    this.canvas.addEventListener('click', (event) => {
      const point = this.screenToWorld(event.clientX, event.clientY);
      this.onGroundClick?.(point);
    });
    this.canvas.addEventListener('mousemove', (event) => {
      const point = this.screenToWorld(event.clientX, event.clientY);
      this.onPlacementPreview?.(point);
    });

    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  resize() {
    this.canvas.width = this.rootElement.clientWidth;
    this.canvas.height = this.rootElement.clientHeight;
  }

  screenToWorld(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    const normalizedX = (clientX - rect.left) / rect.width;
    const normalizedY = (clientY - rect.top) / rect.height;
    return {
      x: (normalizedX - 0.5) * 54,
      z: (normalizedY - 0.5) * 54,
    };
  }

  setGroundClickHandler(handler) {
    this.onGroundClick = handler;
  }

  setPlacementPreviewHandler(handler) {
    this.onPlacementPreview = handler;
  }

  updatePlacementMarker(position, valid) {
    if (!position) {
      this.preview = null;
      return;
    }
    this.preview = { ...position, valid };
  }

  worldToCanvas(x, z) {
    return {
      x: this.canvas.width * (x / 54 + 0.5),
      y: this.canvas.height * (z / 54 + 0.5),
    };
  }

  render(state) {
    const { ctx } = this;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#07223d';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (const building of state.buildings) {
      const p = this.worldToCanvas(building.x, building.z);
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(p.x - 6, p.y - 6, 12, 12);
    }

    for (const colonist of state.colonists) {
      if (!colonist.alive) {
        continue;
      }
      const p = this.worldToCanvas(colonist.position.x, colonist.position.z);
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.preview) {
      const p = this.worldToCanvas(this.preview.x, this.preview.z);
      ctx.strokeStyle = this.preview.valid ? '#22c55e' : '#ef4444';
      ctx.lineWidth = 2;
      ctx.strokeRect(p.x - 8, p.y - 8, 16, 16);
    }
  }
}
