import * as path from 'path';
import { CliOptions, PackageInfo, ResultRow } from '../types.js';
import { findPackageJsonFiles, resolveOutputPath } from '../utils/fileUtils.js';
import { collectDepsFromPackage } from '../utils/dependencyCollector.js';
import { getPackageMetaBatch } from '../services/npmApi.js';
import { writeCsvToFile } from '../utils/csvGenerator.js';

export async function processPackages(options: CliOptions): Promise<void> {
  const packageInfos = findPackageJsonFiles(options.input, options.recursive);
  
  if (packageInfos.length === 0) {
    throw new Error('No package.json files found');
  }

  console.log(`Found ${packageInfos.length} package.json file(s)`);
  
  const result = await buildResultRows(packageInfos, options);
  
  if (result.length === 0) {
    console.log('No dependencies found');
    return;
  }

  const outputPath = resolveOutputPath(options.output);
  if (outputPath) {
    writeCsvToFile(outputPath, result);
    console.log(`CSV written to ${outputPath}`);
  } else {
    console.table(result);
  }
}

async function buildResultRows(packageInfos: PackageInfo[], options: CliOptions): Promise<ResultRow[]> {
  const result: ResultRow[] = [];
  const allDependencyNames = new Set<string>();

  // Collect all unique dependency names for batch processing
  const packageDependencies = packageInfos.map(packageInfo => {
    console.log(`Processing ${packageInfo.name} (${packageInfo.path})`);
    const deps = collectDepsFromPackage(packageInfo.content, packageInfo, options);
    deps.forEach(dep => allDependencyNames.add(dep.name));
    return { packageInfo, deps };
  });

  // Batch fetch npm metadata if needed
  let npmMetaMap = new Map();
  if (options.latest || options.license || options.description || options.npmLink) {
    npmMetaMap = await getPackageMetaBatch(Array.from(allDependencyNames));
  }

  // Build result rows
  for (const { packageInfo, deps } of packageDependencies) {
    for (const dep of deps) {
      const meta = npmMetaMap.get(dep.name);
      
      result.push({
        projectName: packageInfo.name,
        projectPath: path.relative(process.cwd(), path.dirname(packageInfo.path)),
        package: dep.name,
        version: dep.version,
        type: dep.type,
        ...(options.latest && meta ? { latestVersion: meta.latestVersion } : {}),
        ...(options.license && meta ? { license: meta.license } : {}),
        ...(options.description && meta ? { description: meta.description } : {}),
        ...(options.npmLink && meta ? { npmLink: meta.npmLink } : {}),
      });
    }
  }

  return result;
}