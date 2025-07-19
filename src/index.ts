#!/usr/bin/env node

import React from 'react';
import { render } from 'ink';
import { setupCli } from './cli/setup.js';
import { processPackages } from './core/processor.js';
import InteractiveApp from './ui/InteractiveApp.js';
import { CliOptions } from './types/index.js';

async function main(): Promise<void> {
  try {
    const options = setupCli();
    
    if (options.interactive || process.argv.length <= 2) {
      const app = render(React.createElement(InteractiveApp, {
        onComplete: async (interactiveOptions: CliOptions) => {
          // Move cursor to end of current content before unmounting
          process.stdout.write('\n'.repeat(1));
          app.unmount();
          await processPackages(interactiveOptions);
          process.exit(0);
        }
      }), {
        patchConsole: false,
        exitOnCtrlC: true
      });
    } else {
      await processPackages(options as CliOptions);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

main();