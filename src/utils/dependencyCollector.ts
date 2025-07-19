import { Dependency, PackageInfo, CliOptions, PackageJsonContent } from '../types/index.js';

/**
 * Collects dependencies from a package.json file based on CLI options
 * @param pkgJson - Parsed package.json content
 * @param packageInfo - Package information
 * @param options - CLI options specifying which dependencies to include
 * @returns Array of dependencies
 */
export function collectDepsFromPackage(pkgJson: PackageJsonContent, packageInfo: PackageInfo, options: CliOptions): Dependency[] {
  const deps: Dependency[] = [];
  
  function collectDeps(dependencies: Record<string, string> | undefined, type: 'dependencies' | 'devDependencies'): void {
    if (!dependencies) return;
    for (const [name, version] of Object.entries(dependencies)) {
      deps.push({ name, version, type });
    }
  }

  if (options.devOnly) {
    collectDeps(pkgJson.devDependencies, 'devDependencies');
  } else if (options.depsOnly) {
    collectDeps(pkgJson.dependencies, 'dependencies');
  } else {
    collectDeps(pkgJson.dependencies, 'dependencies');
    collectDeps(pkgJson.devDependencies, 'devDependencies');
  }

  return deps;
}