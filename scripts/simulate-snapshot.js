import { mkdir, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { EXPECTED_SUMMARY_SIGNATURES, SNAPSHOT_CASES } from '../src/content/regressionSnapshots.js';
import { buildSnapshotRegressionReport } from '../src/game/regression.js';
import { runStrategy } from './simulationMatrix.js';

const outputPath = process.env.SIM_SNAPSHOT_PATH ?? 'reports/simulation-snapshot.json';
const enforce = process.env.SIM_SNAPSHOT_ENFORCE === '1';

const summaries = SNAPSHOT_CASES.map((snapshotCase) =>
  runStrategy(snapshotCase.scenarioId, snapshotCase.seed, {
    balanceProfileId: snapshotCase.balanceProfileId,
  }),
);

const report = buildSnapshotRegressionReport({
  summaries,
  expectedSignatures: EXPECTED_SUMMARY_SIGNATURES,
});

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, JSON.stringify(report, null, 2), 'utf-8');

report.results.forEach((result) => {
  const status = result.passed ? 'ok' : 'mismatch';
  console.log(`[${result.key}] ${status}: signature=${result.signature}`);
});

console.log(`Simulation snapshot report written to: ${outputPath}`);
if (!report.overallPassed && enforce) {
  process.exit(1);
}
