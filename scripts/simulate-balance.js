import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import {
  BALANCE_REGRESSION_CASES,
  BALANCE_REGRESSION_EXPECTATIONS,
} from '../src/content/balanceRegression.js';
import { buildBalanceProfileRegressionReport } from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_BALANCE_PATH ?? 'reports/simulation-balance.json';

const summaries = BALANCE_REGRESSION_CASES.map((testCase) =>
  runStrategy(testCase.scenarioId, testCase.seed, {
    balanceProfileId: testCase.balanceProfileId,
  }),
);

const report = buildBalanceProfileRegressionReport({
  summaries,
  expectations: BALANCE_REGRESSION_EXPECTATIONS,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

report.results.forEach((result) => {
  const status = result.passed ? 'ok' : 'failed';
  console.log(
    `[${result.key}] ${status}: status=${result.summary.status}, alive=${result.summary.alivePopulation}, research=${result.summary.completedResearch.join(',') || 'none'}`,
  );
  if (!result.passed) {
    result.failures.forEach((failure) => console.error(`  - ${failure}`));
  }
});

console.log(`Simulation balance report written to: ${outputPath}`);
if (!report.overallPassed) {
  process.exit(1);
}
