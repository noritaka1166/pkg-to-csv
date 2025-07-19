#!/usr/bin/env node

import { setupCli } from './cli/setup.js';
import { processPackages } from './core/processor.js';

async function main(): Promise<void> {
  try {
    const options = setupCli();
    await processPackages(options);
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();