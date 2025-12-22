#!/usr/bin/env node
/**
 * Tuiuiu CLI
 *
 * Usage:
 *   npx tuiuiu              # Run storybook (default)
 *   npx tuiuiu storybook    # Run storybook
 *   npx tuiuiu mcp          # Start MCP server (stdio)
 *   npx tuiuiu mcp --http   # Start MCP server (HTTP)
 *   npx tuiuiu --version    # Show version
 *   npx tuiuiu --help       # Show help
 */

// Note: We use dynamic imports for app.js and mcp to avoid side effects
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
  tuiuiu mcp              Start MCP server for AI assistants (stdio)
  tuiuiu mcp --http       Start MCP server with HTTP transport
  tuiuiu mcp --port=3200  Set HTTP port (default: 3200)
  tuiuiu mcp --debug      Enable debug logging
  tuiuiu --version, -v    Show version
  tuiuiu --help, -h       Show this help message

Examples:
  npx tuiuiu              Start exploring components
  npx tuiuiu mcp          Serve docs to Claude Code

Documentation: https://github.com/forattini-dev/tuiuiu.js
`.trim());
    return;
  }

  // MCP command
  if (command === 'mcp') {
    const mcpArgs = args.slice(1);
    const isHttp = mcpArgs.includes('--http') || mcpArgs.includes('-H');
    const isDebug = mcpArgs.includes('--debug') || mcpArgs.includes('-d');
    const portArg = mcpArgs.find(a => a.startsWith('--port='));
    const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3200;

    const { runMcpServer } = await import('../mcp/index.js');
    await runMcpServer({
      transport: isHttp ? 'http' : 'stdio',
      port,
      debug: isDebug,
    });
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
