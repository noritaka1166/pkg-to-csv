import { program } from 'commander';
import { CliOptions } from '../types/index.js';

export function setupCli(): CliOptions {
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
    .option('--interactive', 'Launch interactive mode')
    .parse(process.argv);

  return program.opts() as CliOptions;
}