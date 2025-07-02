#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import fetch from 'node-fetch';
import { program } from 'commander';

interface Dependency {
  name: string;
  version: string;
  type: string;
}

interface PackageMeta {
  latestVersion: string;
  license: string;
}

interface ResultRow {
  package: string;
  version: string;
  type: string;
  latestVersion?: string;
  license?: string;
}

program
  .option('-i, --input <path>', 'Path to package.json', 'package.json')
  .option('-o, --output [path]', 'Output CSV file (default: <repo>_package.csv)')
  .option('--latest', 'Include latest version info from npm')
  .option('--license', 'Include license info from npm')
  .option('--deps-only', 'Include only dependencies (exclude devDependencies)')
  .option('--dev-only', 'Include only devDependencies (exclude dependencies)')
  .parse(process.argv);

const options = program.opts();

const pkgPath: string = path.resolve(process.cwd(), options.input);
if (!fs.existsSync(pkgPath)) {
  console.error(`Error: Cannot find ${pkgPath}`);
  process.exit(1);
}

// 🔽 デフォルト出力ファイル名を設定
let outputPath: string | null = null;
if (options.output !== undefined) {
  if (typeof options.output === 'string') {
    outputPath = path.resolve(process.cwd(), options.output);
  } else if (options.output === true) {
    const repoName: string = path.basename(path.dirname(pkgPath));
    outputPath = path.resolve(process.cwd(), `${repoName}_package.csv`);
  }
}

const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));

const allDeps: Dependency[] = [];

function collectDeps(deps: Record<string, string> | undefined, type: string): void {
  if (!deps) return;
  for (const [name, version] of Object.entries(deps)) {
    allDeps.push({ name, version, type });
  }
}

// オプションに基づいて依存関係を収集
if (options.devOnly) {
  // devDependencies のみ
  collectDeps(pkgJson.devDependencies, 'devDependencies');
} else if (options.depsOnly) {
  // dependencies のみ
  collectDeps(pkgJson.dependencies, 'dependencies');
} else {
  // 両方（デフォルト）
  collectDeps(pkgJson.dependencies, 'dependencies');
  collectDeps(pkgJson.devDependencies, 'devDependencies');
}

async function getPackageMeta(name: string): Promise<PackageMeta> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`);
    if (!res.ok) throw new Error();
    const data: any = await res.json();
    const latestVersion: string = data['dist-tags']?.latest || '';
    const license: string = data.license || (data.versions?.[latestVersion]?.license || '');
    return { latestVersion, license };
  } catch {
    return { latestVersion: '', license: '' };
  }
}

(async (): Promise<void> => {
  const result: ResultRow[] = [];

  for (const dep of allDeps) {
    let latestVersion = '';
    let license = '';
    if (options.latest || options.license) {
      const meta = await getPackageMeta(dep.name);
      if (options.latest) latestVersion = meta.latestVersion;
      if (options.license) license = meta.license;
    }

    result.push({
      package: dep.name,
      version: dep.version,
      type: dep.type,
      ...(options.latest ? { latestVersion } : {}),
      ...(options.license ? { license } : {}),
    });
  }

  if (outputPath) {
    const headers: string[] = Object.keys(result[0]);
    const rows: string[] = [headers.join(',')];

    for (const row of result) {
      rows.push(headers.map(h => (row as any)[h] ?? '').join(','));
    }

    fs.writeFileSync(outputPath, rows.join('\n'));
    console.log(`CSV written to ${outputPath}`);
  } else {
    console.table(result);
  }
})();