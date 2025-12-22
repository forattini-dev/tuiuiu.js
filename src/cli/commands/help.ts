/**
 * Help command - displays usage information
 */

import { getVersion } from '../../version.js';

export async function showHelp(): Promise<void> {
  const version = await getVersion();

  console.log(`
tuiuiu.js v${version} - Zero-dependency Terminal UI library

Usage:
  tuiuiu                  Show this help message
  tuiuiu storybook        Run the component storybook
  tuiuiu mcp              Start MCP server for AI assistants (stdio)
  tuiuiu mcp --http       Start MCP server with HTTP transport
  tuiuiu mcp --port=3200  Set HTTP port (default: 3200)
  tuiuiu mcp --debug      Enable debug logging
  tuiuiu --version, -v    Show version
  tuiuiu --help, -h       Show this help message

Commands:
  storybook    Interactive component explorer with live previews
  mcp          Model Context Protocol server for AI assistants

Examples:
  npx tuiuiu storybook    Start exploring components
  npx tuiuiu.js@latest mcp          Serve docs to Claude Code

Documentation: https://github.com/forattini-dev/tuiuiu.js
`.trim());
}
