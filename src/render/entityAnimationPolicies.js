export function getColonistAnimationFrame(timeSeconds, age, {
  fps = 6,
  frameCount = 3,
} = {}) {
  return Math.floor((timeSeconds * fps + age) % frameCount);
}

export function computeColonistBobOffset(timeSeconds, age, idle) {
  if (idle) {
    return Math.sin((timeSeconds + age) * 2.5) * 1.5;
  }
  return Math.sin((timeSeconds + age) * 11) * 1.4;
}

