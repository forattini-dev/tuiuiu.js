#!/usr/bin/env node
/**
 * Tuiuiu CLI - Main entry point
 *
 * Usage:
 *   npx tuiuiu              # Show help
 *   npx tuiuiu storybook    # Run component storybook
 *   npx tuiuiu mcp          # Start MCP server (stdio)
 *   npx tuiuiu mcp --http   # Start MCP server (HTTP)
 *   npx tuiuiu --version    # Show version
 *   npx tuiuiu --help       # Show help
 */

import { showHelp } from './commands/help.js';
import { runStorybookCommand } from './commands/storybook.js';
import { runMcpCommand } from './commands/mcp.js';

const args = process.argv.slice(2);
const command = args[0];

async function main() {
  // Version flag
  if (command === '--version' || command === '-v') {
    const { getVersion } = await import('../version.js');
    const version = await getVersion();
    console.log(`tuiuiu.js v${version}`);
    return;
  }

  // Help flag or no command (default behavior)
  if (!command || command === '--help' || command === '-h') {
    await showHelp();
    return;
  }

  // Storybook command
  if (command === 'storybook') {
    await runStorybookCommand();
    return;
  }

  // MCP command
  if (command === 'mcp') {
    await runMcpCommand(args.slice(1));
    return;
  }

  // Unknown command
  console.error(`Unknown command: ${command}`);
  console.error('Run "tuiuiu --help" for usage information.');
  process.exit(1);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
