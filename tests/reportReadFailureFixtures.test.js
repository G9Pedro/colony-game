import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  buildArtifactPath,
  buildMissingArtifactPath,
  createInvalidJsonArtifact,
  createJsonArtifact,
  createTextArtifact,
  createUnreadableArtifactPath,
} from './helpers/reportReadFailureFixtures.js';

test('buildArtifactPath composes root directory and relative path', () => {
  const artifactPath = buildArtifactPath({
    rootDirectory: '/tmp/example-root',
    relativePath: 'reports/example.json',
  });
  assert.equal(artifactPath, '/tmp/example-root/reports/example.json');
});

test('buildMissingArtifactPath returns deterministic unresolved artifact path', () => {
  const artifactPath = buildMissingArtifactPath({
    rootDirectory: '/tmp/example-root',
    relativePath: 'reports/missing.json',
  });
  assert.equal(artifactPath, '/tmp/example-root/reports/missing.json');
});

test('createInvalidJsonArtifact writes malformed json fixture payload', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-fixtures-invalid-json-'));

  try {
    const artifactPath = await createInvalidJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/invalid.json',
      contents: '{"malformed": ',
    });
    const contents = await readFile(artifactPath, 'utf-8');
    assert.equal(contents, '{"malformed": ');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('createUnreadableArtifactPath creates directory at artifact path', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-fixtures-unreadable-'));

  try {
    const artifactPath = await createUnreadableArtifactPath({
      rootDirectory: tempDirectory,
      relativePath: 'reports/unreadable.json',
    });
    const metadata = await stat(artifactPath);
    assert.equal(metadata.isDirectory(), true);
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('createTextArtifact writes text fixture with parent directories', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-fixtures-text-'));

  try {
    const artifactPath = await createTextArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/smoke.md',
      contents: '# diagnostics smoke markdown',
    });
    const contents = await readFile(artifactPath, 'utf-8');
    assert.equal(contents, '# diagnostics smoke markdown');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});

test('createJsonArtifact writes pretty-printed json payload fixture', async () => {
  const tempDirectory = await mkdtemp(path.join(tmpdir(), 'read-failure-fixtures-json-'));

  try {
    const artifactPath = await createJsonArtifact({
      rootDirectory: tempDirectory,
      relativePath: 'reports/summary.json',
      payload: { name: 'diagnostics', count: 2 },
    });
    const contents = await readFile(artifactPath, 'utf-8');
    assert.equal(contents, '{\n  "name": "diagnostics",\n  "count": 2\n}');
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
});
