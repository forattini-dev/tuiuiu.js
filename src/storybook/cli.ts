#!/usr/bin/env node
/**
 * Tuiuiu CLI
 *
 * Usage:
 *   npx tuiuiu              # Run storybook (default)
 *   npx tuiuiu storybook    # Run storybook
 *   npx tuiuiu --version    # Show version
 *   npx tuiuiu --help       # Show help
 */

// Note: We use dynamic imports for app.js to avoid side effects (interceptConsole)
// being executed before we check command-line arguments.

import { getVersion } from '../version.js';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Version flag
  if (command === '--version' || command === '-v') {
    const version = await getVersion();
    console.log(`tuiuiu.js v${version}`);
    return;
  }

  // Help flag
  if (command === '--help' || command === '-h') {
    const version = await getVersion();
    console.log(`
tuiuiu.js v${version} - Zero-dependency Terminal UI library

Usage:
  tuiuiu                  Run the component storybook (default)
  tuiuiu storybook        Run the component storybook
  tuiuiu --version, -v    Show version
  tuiuiu --help, -h       Show this help message

Examples:
  npx tuiuiu              Start exploring components
  npx tuiuiu.js           Same as above

Documentation: https://github.com/forattini-dev/tuiuiu.js
`.trim());
    return;
  }

  // Unknown command
  if (command && command !== 'storybook' && !command.startsWith('-')) {
    console.error(`Unknown command: ${command}`);
    console.error('Run "tuiuiu --help" for usage information.');
    process.exit(1);
  }

  // Default: run storybook (dynamic import to avoid side effects)
  const { runStorybook } = await import('./app.js');
  await runStorybook();
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
