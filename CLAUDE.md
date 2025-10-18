# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Testing
- `npm run build` - Compile TypeScript to JavaScript in `dist/` directory
- `npm run dev` - Build and run the tool (equivalent to build + start)
- `npm run clean` - Remove the `dist/` directory
- `npm test` - Run all tests (builds first, then runs all test suites)

### Specific Test Commands
- `npm run test:unit` - Run unit tests only (`test/unit.test.js`)
- `npm run test:integration` - Run integration tests only (`test/index.test.js`)
- `npm run test:error` - Run error handling tests only (`test/error-handling.test.js`)
- `npm run test:npm` - Run npm registry integration tests only (`test/npm-integration.test.js`)

### Coverage
- `npm run test:coverage` - Generate test coverage with text and HTML output
- `npm run test:coverage:lcov` - Generate LCOV coverage format for SonarQube
- `npm run test:coverage:sonar` - Run coverage and format for SonarQube analysis

### Running the Tool
- `npm start` - Run the built tool from `dist/index.js`
- `node dist/index.js [options]` - Direct execution with CLI options

## Architecture Overview

This is a CLI tool that extracts dependencies from package.json files and outputs them in CSV format. The codebase is organized in a modular architecture with clear separation of concerns.

### Core Architecture

**Entry Point (`src/index.ts`)**: Ultra-minimal main file that orchestrates CLI setup and processing

**Processing Pipeline**:
1. **CLI Setup** (`src/cli/setup.ts`) - Parses command line arguments using Commander.js
2. **Core Processor** (`src/core/processor.ts`) - Main business logic coordinator that:
   - Discovers package.json files via file utilities
   - Collects dependencies from each package
   - Batches npm API calls for metadata
   - Builds result rows and outputs CSV/table

### Key Modules

**File Operations** (`src/utils/fileUtils.ts`):
- Recursive package.json discovery with monorepo support
- JSON parsing with proper error handling
- Output path resolution

**NPM Integration** (`src/services/npmApi.ts`):
- Registry API calls with caching (5-minute TTL)
- Batch processing for concurrent requests
- Retry logic with exponential backoff
- Timeout handling (10-second limit)

**Data Processing**:
- `src/utils/dependencyCollector.ts` - Extracts dependencies based on CLI options (deps-only, dev-only)
- `src/utils/csvGenerator.ts` - CSV formatting with proper escaping for special characters

**Error Handling** (`src/utils/errorHandler.ts`):
- Custom `AppError` class for application-specific errors
- `withRetry()` utility for resilient async operations
- Async operation wrapper with proper error context

### Type System (`src/types.ts`)

All interfaces use `readonly` properties for immutability:
- `PackageInfo` - Represents discovered package.json files
- `Dependency` - Individual dependency with strict type constraint ('dependencies' | 'devDependencies')
- `PackageMeta` - npm registry metadata
- `ResultRow` - Output CSV row structure
- `PackageJsonContent` - Typed package.json structure

### Performance Optimizations

**Concurrent Processing**: npm API calls are batched and executed in parallel rather than sequentially
**Caching**: npm metadata is cached to avoid redundant API calls
**Streaming**: Large datasets are processed without loading everything into memory simultaneously

## Technology Stack

- **Runtime**: ES2020 modules with Node.js
- **Build**: TypeScript with strict mode enabled
- **CLI**: Commander.js for argument parsing
- **HTTP**: node-fetch for npm registry API calls
- **Testing**: Node.js built-in test runner with c8 for coverage
- **Quality**: SonarQube analysis via GitHub Actions

## Key Patterns

**Error Boundaries**: Each module handles its own errors and provides meaningful context
**Dependency Injection**: Utilities are passed as parameters rather than imported directly in business logic
**Functional Style**: Pure functions where possible, immutable data structures
**Async/Await**: Consistent promise handling throughout the codebase