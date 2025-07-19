/**
 * Represents a dependency from a package.json file
 */
export interface Dependency {
  readonly name: string;
  readonly version: string;
  readonly type: 'dependencies' | 'devDependencies';
}

/**
 * Metadata retrieved from npm registry for a package
 */
export interface PackageMeta {
  readonly latestVersion: string;
  readonly license: string;
  readonly description: string;
  readonly npmLink: string;
}

/**
 * A row in the output CSV/table representing a dependency
 */
export interface ResultRow {
  readonly projectName: string;
  readonly projectPath: string;
  readonly package: string;
  readonly version: string;
  readonly type: string;
  readonly latestVersion?: string;
  readonly license?: string;
  readonly description?: string;
  readonly npmLink?: string;
}

/**
 * Information about a package.json file
 */
export interface PackageInfo {
  readonly path: string;
  readonly name: string;
  readonly content: PackageJsonContent;
}

/**
 * Structure of a package.json file
 */
export interface PackageJsonContent {
  readonly name?: string;
  readonly version?: string;
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly [key: string]: unknown;
}

/**
 * Command line options for the application
 */
export interface CliOptions {
  readonly input: string;
  readonly output?: string | boolean;
  readonly latest?: boolean;
  readonly license?: boolean;
  readonly description?: boolean;
  readonly npmLink?: boolean;
  readonly depsOnly?: boolean;
  readonly devOnly?: boolean;
  readonly recursive?: boolean;
}