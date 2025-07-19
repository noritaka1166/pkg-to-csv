import * as fs from 'fs';
import * as path from 'path';
import { PackageInfo, PackageJsonContent } from '../types.js';

/**
 * Finds and parses package.json files in the given path
 * @param inputPath - Path to a package.json file or directory
 * @param recursive - Whether to search subdirectories recursively
 * @returns Array of parsed package information
 * @throws {Error} When the input path doesn't exist
 */
export function findPackageJsonFiles(inputPath: string, recursive: boolean = false): PackageInfo[] {
  const packages: PackageInfo[] = [];
  const resolvedPath = path.resolve(process.cwd(), inputPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Cannot find ${resolvedPath}`);
  }

  const stat = fs.statSync(resolvedPath);
  
  if (stat.isFile() && path.basename(resolvedPath) === 'package.json') {
    const content = readPackageJson(resolvedPath);
    packages.push({
      path: resolvedPath,
      name: content.name ?? path.basename(path.dirname(resolvedPath)),
      content
    });
  } else if (stat.isDirectory()) {
    const packageJsonPath = path.join(resolvedPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const content = readPackageJson(packageJsonPath);
      packages.push({
        path: packageJsonPath,
        name: content.name ?? path.basename(resolvedPath),
        content
      });
    }

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

function readPackageJson(filePath: string): PackageJsonContent {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to read or parse ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Resolves the output path based on CLI options
 * @param output - Output option from CLI
 * @returns Resolved file path or null for console output
 */
export function resolveOutputPath(output?: string | boolean): string | null {
  if (output === undefined) {
    return null;
  }
  
  if (typeof output === 'string') {
    return path.resolve(process.cwd(), output);
  }
  
  if (output === true) {
    return path.resolve(process.cwd(), 'packages.csv');
  }
  
  return null;
}