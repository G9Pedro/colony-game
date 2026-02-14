import { createSpriteCanvas, getSpriteContext2D } from './spriteCanvasFactory.js';

export function createSpriteEntrySurface({ width, height }, deps = {}) {
  const createCanvas = deps.createCanvas ?? createSpriteCanvas;
  const getContext = deps.getContext ?? getSpriteContext2D;
  const canvas = createCanvas(width, height);
  const ctx = getContext(canvas);
  return {
    canvas,
    ctx,
  };
}
