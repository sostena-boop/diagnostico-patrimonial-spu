import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const repositoryName = 'diagnostico-patrimonial-spu';
const sourceDirectory = 'dist/client';
const prefixedAssetsDirectory = join(sourceDirectory, repositoryName);
const outputDirectory = 'docs';

if (!existsSync(join(sourceDirectory, 'index.html'))) {
  throw new Error('O build estatico nao foi encontrado em dist/client.');
}

rmSync(outputDirectory, { force: true, recursive: true });
mkdirSync(outputDirectory, { recursive: true });

for (const entry of readdirSync(sourceDirectory)) {
  if (entry === repositoryName) continue;
  cpSync(join(sourceDirectory, entry), join(outputDirectory, entry), {
    recursive: true,
  });
}

if (existsSync(prefixedAssetsDirectory)) {
  for (const entry of readdirSync(prefixedAssetsDirectory)) {
    cpSync(join(prefixedAssetsDirectory, entry), join(outputDirectory, entry), {
      recursive: true,
    });
  }
}

console.log('Pacote do GitHub Pages preparado em docs/.');
