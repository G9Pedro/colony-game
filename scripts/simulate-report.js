import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { DEFAULT_REGRESSION_EXPECTATIONS, buildRegressionReport } from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_REPORT_PATH ?? 'reports/simulation-regression.json';
const scenarios = Object.keys(DEFAULT_REGRESSION_EXPECTATIONS);

const summaries = scenarios.map((scenarioId) => runStrategy(scenarioId, `assert-${scenarioId}`));
const report = buildRegressionReport({
  summaries,
  expectations: DEFAULT_REGRESSION_EXPECTATIONS,
  seedPrefix: 'assert',
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

console.log(`Simulation regression report written to: ${outputPath}`);
if (!report.overallPassed) {
  process.exit(1);
}
