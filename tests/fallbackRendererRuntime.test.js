import test from 'node:test';
import assert from 'node:assert/strict';
import { createFallbackRendererDelegate, getFallbackRendererOptions } from '../src/render/fallbackRendererRuntime.js';

test('getFallbackRendererOptions returns low-quality isometric defaults', () => {
  const options = getFallbackRendererOptions();
  assert.deepEqual(options, {
    quality: 'low',
    effectsEnabled: false,
    cameraTileWidth: 58,
    cameraTileHeight: 29,
  });
});

test('getFallbackRendererOptions returns a new copy each call', () => {
  const first = getFallbackRendererOptions();
  const second = getFallbackRendererOptions();

  assert.notEqual(first, second);
  first.quality = 'high';
  assert.equal(second.quality, 'low');
});

test('createFallbackRendererDelegate creates renderer with default options', () => {
  const rootElement = { id: 'root' };
  const calls = [];
  const delegate = { render: () => {} };

  const result = createFallbackRendererDelegate({
    rootElement,
    createIsometricRenderer: (target, options) => {
      calls.push({ target, options });
      return delegate;
    },
  });

  assert.equal(result, delegate);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].target, rootElement);
  assert.deepEqual(calls[0].options, {
    quality: 'low',
    effectsEnabled: false,
    cameraTileWidth: 58,
    cameraTileHeight: 29,
  });
});

test('createFallbackRendererDelegate forwards custom options when provided', () => {
  const rootElement = { id: 'root' };
  const customOptions = { quality: 'medium' };
  const calls = [];

  createFallbackRendererDelegate({
    rootElement,
    options: customOptions,
    createIsometricRenderer: (target, options) => {
      calls.push({ target, options });
      return { target, options };
    },
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].options, customOptions);
});

