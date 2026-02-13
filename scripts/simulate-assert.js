import { runStrategy } from './simulationMatrix.js';

const EXPECTATIONS = {
  frontier: {
    requiredStatus: 'playing',
    minAlivePopulation: 7,
    minBuildings: 8,
    requiredResearch: [],
  },
  prosperous: {
    requiredStatus: 'playing',
    minAlivePopulation: 9,
    minBuildings: 9,
    requiredResearch: ['masonry'],
  },
  harsh: {
    requiredStatus: 'playing',
    minAlivePopulation: 6,
    minBuildings: 7,
    requiredResearch: [],
  },
};

function evaluate(summary, expected) {
  const failures = [];
  if (summary.status !== expected.requiredStatus) {
    failures.push(`status expected "${expected.requiredStatus}" but was "${summary.status}"`);
  }
  if (summary.alivePopulation < expected.minAlivePopulation) {
    failures.push(`alive population expected >= ${expected.minAlivePopulation}, got ${summary.alivePopulation}`);
  }
  if (summary.buildings < expected.minBuildings) {
    failures.push(`building count expected >= ${expected.minBuildings}, got ${summary.buildings}`);
  }
  for (const researchId of expected.requiredResearch) {
    if (!summary.completedResearch.includes(researchId)) {
      failures.push(`required research "${researchId}" missing`);
    }
  }
  return failures;
}

let hasFailure = false;
for (const [scenarioId, expected] of Object.entries(EXPECTATIONS)) {
  const summary = runStrategy(scenarioId, `assert-${scenarioId}`);
  const failures = evaluate(summary, expected);
  if (failures.length > 0) {
    hasFailure = true;
    console.error(`[${scenarioId}] regression FAILED`);
    failures.forEach((failure) => console.error(`  - ${failure}`));
  } else {
    console.log(
      `[${scenarioId}] ok: status=${summary.status}, alive=${summary.alivePopulation}, buildings=${summary.buildings}, research=${summary.completedResearch.join(',') || 'none'}`,
    );
  }
}

if (hasFailure) {
  process.exit(1);
}
