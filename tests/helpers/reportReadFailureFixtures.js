import path from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

export function buildArtifactPath({ rootDirectory, relativePath }) {
  return path.join(rootDirectory, relativePath);
}

export function buildMissingArtifactPath({ rootDirectory, relativePath }) {
  return buildArtifactPath({ rootDirectory, relativePath });
}

export async function createInvalidJsonArtifact({
  rootDirectory,
  relativePath,
  contents = '{"broken": ',
}) {
  const artifactPath = buildArtifactPath({ rootDirectory, relativePath });
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, contents, 'utf-8');
  return artifactPath;
}

export async function createUnreadableArtifactPath({ rootDirectory, relativePath }) {
  const artifactPath = buildArtifactPath({ rootDirectory, relativePath });
  await mkdir(artifactPath, { recursive: true });
  return artifactPath;
}

export async function createTextArtifact({ rootDirectory, relativePath, contents }) {
  const artifactPath = buildArtifactPath({ rootDirectory, relativePath });
  await mkdir(path.dirname(artifactPath), { recursive: true });
  await writeFile(artifactPath, contents, 'utf-8');
  return artifactPath;
}

export async function createJsonArtifact({
  rootDirectory,
  relativePath,
  payload,
}) {
  return createTextArtifact({
    rootDirectory,
    relativePath,
    contents: JSON.stringify(payload, null, 2),
  });
}
