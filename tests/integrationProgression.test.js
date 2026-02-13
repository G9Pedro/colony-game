import test from 'node:test';
import assert from 'node:assert/strict';
import { GameEngine } from '../src/game/gameEngine.js';
import { runScriptedSimulation } from '../src/game/simulationHarness.js';

test('scripted prosperous run reaches construction and research milestones', () => {
  const engine = new GameEngine({ scenarioId: 'prosperous', seed: 'integration-seed' });

  const initialBuildings = engine.state.buildings.length;
  runScriptedSimulation({
    engine,
    steps: 900,
    onStep: ({ step }) => {
      if (step === 0) {
        assert.equal(engine.queueBuilding('hut', 14, -14).ok, true);
        assert.equal(engine.queueBuilding('farm', -14, -14).ok, true);
      }
      if (step === 20) {
        assert.equal(engine.queueBuilding('lumberCamp', -15, 14).ok, true);
      }
      if (step === 90) {
        assert.equal(engine.queueBuilding('school', 14, 0).ok, true);
      }
      if (step === 140) {
        engine.hireColonist();
      }
      if (step === 220) {
        engine.hireColonist();
      }
      if (step >= 300 && !engine.state.research.current && !engine.state.research.completed.includes('masonry')) {
        engine.beginResearch('masonry');
      }
    },
  });

  const alivePopulation = engine.state.colonists.filter((colonist) => colonist.alive).length;
  assert.equal(engine.state.status, 'playing');
  assert.ok(engine.state.buildings.length >= initialBuildings + 3);
  assert.ok(engine.state.research.completed.includes('masonry'));
  assert.ok(alivePopulation >= 7);
});
