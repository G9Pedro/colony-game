import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCost, formatRate, percent } from '../src/ui/uiFormatting.js';

test('formatCost joins resource cost entries in display order', () => {
  assert.equal(formatCost({ wood: 10, stone: 5 }), '10 wood, 5 stone');
});

test('percent clamps lower and upper bounds', () => {
  assert.equal(percent(5, 10), 50);
  assert.equal(percent(-2, 10), 0);
  assert.equal(percent(20, 10), 100);
  assert.equal(percent(3, 0), 0);
});

test('formatRate formats positive, negative, and near-zero values', () => {
  assert.equal(formatRate(2.36), '+2.4/day');
  assert.equal(formatRate(-1.24), '-1.2/day');
  assert.equal(formatRate(0.01), '±0/day');
});

