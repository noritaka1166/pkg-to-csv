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
  description: string;
  npmLink: string;
}

interface ResultRow {
  projectName: string;
  projectPath: string;
  package: string;
  version: string;
  type: string;
  latestVersion?: string;
  license?: string;
  description?: string;
  npmLink?: string;
}

interface PackageInfo {
  path: string;
  name: string;
  content: any;
}

program
  .option('-i, --input <path>', 'Path to package.json or directory containing package.json files', 'package.json')
  .option('-o, --output [path]', 'Output CSV file (default: packages.csv)')
  .option('--latest', 'Include latest version info from npm')
  .option('--license', 'Include license info from npm')
  .option('--description', 'Include description from npm')
  .option('--npm-link', 'Include npm package link')
  .option('--deps-only', 'Include only dependencies (exclude devDependencies)')
  .option('--dev-only', 'Include only devDependencies (exclude dependencies)')
  .option('--recursive', 'Recursively search for package.json files in subdirectories')
  .parse(process.argv);

const options = program.opts();

// package.jsonファイルを検索する関数
function findPackageJsonFiles(inputPath: string, recursive: boolean = false): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolvedPath)) {
    console.error(`Error: Cannot find ${resolvedPath}`);
    process.exit(1);
  }

  const stat = fs.statSync(resolvedPath);
  
  if (stat.isFile() && path.basename(resolvedPath) === 'package.json') {
    // 単一のpackage.jsonファイル
    const content = JSON.parse(fs.readFileSync(resolvedPath, 'utf-8'));
    packages.push({
      path: resolvedPath,
      name: content.name ?? path.basename(path.dirname(resolvedPath)),
      content
    });
  } else if (stat.isDirectory()) {
    // ディレクトリの場合
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      packages.push({
        path: packageJsonPath,
        name: content.name ?? path.basename(resolvedPath),
        content
      });
    }

    // 再帰的検索が有効な場合
    if (recursive) {
      const entries = fs.readdirSync(resolvedPath, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
          const subPackages = findPackageJsonFiles(path.join(resolvedPath, entry.name), true);
          packages.push(...subPackages);
        }
      }
    }
  }

  return packages;
}

// package.jsonファイルを検索
const packageInfos = findPackageJsonFiles(options.input, options.recursive);

if (packageInfos.length === 0) {
  console.error('Error: No package.json files found');
  process.exit(1);
}

console.log(`Found ${packageInfos.length} package.json file(s)`);

// 🔽 デフォルト出力ファイル名を設定
let outputPath: string | null = null;
if (options.output !== undefined) {
  if (typeof options.output === 'string') {
    outputPath = path.resolve(process.cwd(), options.output);
  } else if (options.output === true) {
    outputPath = path.resolve(process.cwd(), 'packages.csv');
  }
}

function collectDepsFromPackage(pkgJson: any, packageInfo: PackageInfo): Dependency[] {
  const deps: Dependency[] = [];
  
  function collectDeps(dependencies: Record<string, string> | undefined, type: string): void {
    if (!dependencies) return;
    for (const [name, version] of Object.entries(dependencies)) {
      deps.push({ name, version, type });
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

  return deps;
}

async function getPackageMeta(name: string): Promise<PackageMeta> {
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`);
    if (!res.ok) throw new Error();
    const data: any = await res.json();
    const latestVersion: string = data['dist-tags']?.latest ?? '';
    const license: string = data.license ?? (data.versions?.[latestVersion]?.license ?? '');
    const description = data.description ?? '';
    const npmLink = `https://www.npmjs.com/package/${name}`;
    return { latestVersion, license, description, npmLink };
  } catch {
    return { latestVersion: '', license: '', description: '', npmLink: '' };
  }
}

(async (): Promise<void> => {
  const result: ResultRow[] = [];

  for (const packageInfo of packageInfos) {
    console.log(`Processing ${packageInfo.name} (${packageInfo.path})`);
    
    const allDeps = collectDepsFromPackage(packageInfo.content, packageInfo);
    
    for (const dep of allDeps) {
      let latestVersion = '';
      let license = '';
      let description = '';
      let npmLink = '';

      if (options.latest || options.license || options.description || options.npmLink) {
        const meta = await getPackageMeta(dep.name);
        if (options.latest) latestVersion = meta.latestVersion;
        if (options.license) license = meta.license;
        if (options.description) description = meta.description;
        if (options.npmLink) npmLink = meta.npmLink;
      }

      result.push({
        projectName: packageInfo.name,
        projectPath: path.relative(process.cwd(), path.dirname(packageInfo.path)),
        package: dep.name,
        version: dep.version,
        type: dep.type,
        ...(options.latest ? { latestVersion } : {}),
        ...(options.license ? { license } : {}),
        ...(options.description ? { description } : {}),
        ...(options.npmLink ? { npmLink } : {}),
      });
    }
  }

  if (result.length === 0) {
    console.log('No dependencies found');
    return;
  }

  if (outputPath) {
    const headers: string[] = Object.keys(result[0]);
    const rows: string[] = [headers.join(',')];

    for (const row of result) {
      rows.push(headers.map(h => {
        const value = (row as any)[h] ?? '';
        // CSVエスケープ処理（カンマや改行を含む場合はダブルクォートで囲む）
        return typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))
          ? `"${value.replace(/"/g, '""')}"`
          : value;
      }).join(','));
    }

    fs.writeFileSync(outputPath, rows.join('\n'));
    console.log(`CSV written to ${outputPath}`);
  } else {
    console.table(result);
  }
})();