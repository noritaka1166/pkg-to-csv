# pkg-to-csv

A tool to extract dependencies from package.json files and output them in CSV format. It supports monorepos and multiple repositories, allowing you to identify which project the dependencies belong to.

**日本語版 README は[こちら](README.ja.md)**

## Features

- Extract dependencies from single or multiple package.json files
- Monorepo support (recursive search)
- Output includes project name and path
- Fetch latest version, license, and description from npm registry
- Selective output of dependencies and devDependencies
- CSV format output or console display

## Installation

```bash
npm install -g pkg-to-csv
```

## Usage

### Basic Usage

```bash
# Process package.json in current directory
pkg-to-csv

# Specify a package.json file
pkg-to-csv -i path/to/package.json

# Specify a directory (processes package.json in that directory)
pkg-to-csv -i path/to/project

# Recursively search for package.json files (monorepo support)
pkg-to-csv -i . --recursive

# CSV output
pkg-to-csv -o packages.csv
```

### Options

- `-i, --input <path>`: Path to package.json file or directory (default: package.json)
- `-o, --output [path]`: Output CSV file (default: packages.csv)
- `--recursive`: Recursively search subdirectories for package.json files
- `--latest`: Fetch latest version information from npm
- `--license`: Fetch license information from npm
- `--description`: Fetch description from npm
- `--npm-link`: Include npm package links
- `--deps-only`: Include only dependencies (exclude devDependencies)
- `--dev-only`: Include only devDependencies (exclude dependencies)

### Output Format

The CSV output includes the following columns:

- `projectName`: The name field from package.json
- `projectPath`: Relative path to the project
- `package`: Package name
- `version`: Installed version
- `type`: Dependency type (dependencies or devDependencies)
- `latestVersion`: Latest version (when --latest option is used)
- `license`: License (when --license option is used)
- `description`: Description (when --description option is used)
- `npmLink`: npm link (when --npm-link option is used)

### Examples

```bash
# Output all dependencies from a monorepo with latest version info to CSV
pkg-to-csv -i . --recursive --latest --license -o all-packages.csv

# Production dependencies only from a specific project
pkg-to-csv -i packages/frontend --deps-only -o frontend-deps.csv

# Development dependencies only displayed in console
pkg-to-csv --dev-only
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run in development mode
npm run dev

# Clean up
npm run clean
```
