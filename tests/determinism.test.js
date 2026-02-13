import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/game/gameEngine.js';

function snapshotKeyMetrics(state) {
  return {
    rngState: state.rngState,
    resources: Object.fromEntries(
      Object.entries(state.resources).map(([key, value]) => [key, Number(value.toFixed(4))]),
    ),
    colonists: state.colonists.map((colonist) => ({
      id: colonist.id,
      alive: colonist.alive,
      job: colonist.job,
      x: Number(colonist.position.x.toFixed(4)),
      z: Number(colonist.position.z.toFixed(4)),
      hunger: Number(colonist.needs.hunger.toFixed(4)),
      rest: Number(colonist.needs.rest.toFixed(4)),
      morale: Number(colonist.needs.morale.toFixed(4)),
    })),
    constructionQueue: state.constructionQueue.length,
  };
}

test('simulation is deterministic when seed and inputs match', () => {
  const engineA = new GameEngine({ seed: 'deterministic-seed' });
  const engineB = new GameEngine({ seed: 'deterministic-seed' });

  for (let index = 0; index < 120; index += 1) {
    engineA.step(0.2);
    engineB.step(0.2);
  }

  assert.deepEqual(snapshotKeyMetrics(engineA.state), snapshotKeyMetrics(engineB.state));
});

test('different seeds diverge simulation state', () => {
  const engineA = new GameEngine({ seed: 'seed-a' });
  const engineB = new GameEngine({ seed: 'seed-b' });

  for (let index = 0; index < 30; index += 1) {
    engineA.step(0.2);
    engineB.step(0.2);
  }

  assert.notDeepEqual(snapshotKeyMetrics(engineA.state), snapshotKeyMetrics(engineB.state));
});
