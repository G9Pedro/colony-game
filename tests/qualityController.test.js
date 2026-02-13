import test from 'node:test';
import assert from 'node:assert/strict';
import { FrameQualityController } from '../src/render/qualityController.js';

test('quality controller reduces quality under sustained low fps', () => {
  const controller = new FrameQualityController({
    enabled: true,
    adjustIntervalSeconds: 0.5,
    lowThreshold: 50,
    highThreshold: 70,
  });
  for (let idx = 0; idx < 40; idx += 1) {
    controller.recordFrame(1 / 25);
  }
  assert.ok(controller.getQuality() < 1);
});

test('quality controller recovers quality when fps is high', () => {
  const controller = new FrameQualityController({
    enabled: true,
    adjustIntervalSeconds: 0.5,
    lowThreshold: 50,
    highThreshold: 55,
  });
  for (let idx = 0; idx < 40; idx += 1) {
    controller.recordFrame(1 / 20);
  }
  const lowered = controller.getQuality();
  for (let idx = 0; idx < 360; idx += 1) {
    controller.recordFrame(1 / 120);
  }
  assert.ok(controller.getQuality() > lowered);
});

test('quality controller can be disabled', () => {
  const controller = new FrameQualityController({ enabled: false });
  const baseline = controller.getQuality();
  for (let idx = 0; idx < 200; idx += 1) {
    controller.recordFrame(1 / 10);
  }
  assert.equal(controller.getQuality(), baseline);
});

