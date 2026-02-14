import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildClockLabel,
  buildPauseButtonLabel,
  buildSpeedButtonStates,
} from '../src/ui/topBarViewState.js';

test('buildClockLabel renders paused and running variants', () => {
  assert.equal(buildClockLabel({ day: 4, paused: true, speed: 2 }), 'Day 4 · Paused');
  assert.equal(buildClockLabel({ day: 7, paused: false, speed: 4 }), 'Day 7 · 4x');
});

test('buildPauseButtonLabel reflects current pause state', () => {
  assert.equal(buildPauseButtonLabel(true), '▶ Resume');
  assert.equal(buildPauseButtonLabel(false), '⏸ Pause');
});

test('buildSpeedButtonStates marks active speed by value', () => {
  assert.deepEqual(buildSpeedButtonStates(2), [
    { speed: 1, active: false },
    { speed: 2, active: true },
    { speed: 4, active: false },
  ]);
  assert.deepEqual(buildSpeedButtonStates(3, [1, 3, 5]), [
    { speed: 1, active: false },
    { speed: 3, active: true },
    { speed: 5, active: false },
  ]);
});

