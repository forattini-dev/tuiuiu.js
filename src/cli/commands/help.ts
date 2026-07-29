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
  tuiuiu init [directory] Create a minimal TypeScript project
  tuiuiu init app --jsx   Create a project with the optional JSX runtime
  tuiuiu storybook        Run the component storybook
  tuiuiu mcp              Start MCP server (stdio transport)
  tuiuiu --version, -v    Show version
  tuiuiu --help, -h       Show this help message

Commands:
  init         Scaffold a safe, minimal Tuiuiu project
  storybook    Interactive component explorer with live previews
  mcp          Model Context Protocol server for AI assistants

MCP Transports:
  tuiuiu mcp              stdio (default) - for Claude Code, Codex CLI
  tuiuiu mcp --http, -H   HTTP POST - for web integrations
  tuiuiu mcp --sse, -S    Server-Sent Events - for streaming clients

MCP Options:
  --port=<number>         Set server port (default: 3200)
  --host=<address>        Bind address (default: 127.0.0.1)
  --token=<secret>        Bearer token (prefer TUIUIU_MCP_AUTH_TOKEN)
  --allow-origin=<origin> Allow an exact browser Origin (repeatable)
  --max-request-bytes=<n> Maximum JSON request size (default: 1048576)
  --debug, -d             Enable debug logging to stderr

Examples:
  # Create a functional-API project
  npx tuiuiu.js init my-tui

  # Create a JSX project
  npx tuiuiu.js init my-tui --jsx

  # For Claude Code (stdio)
  npx tuiuiu.js mcp

  # For Codex CLI (stdio)
  npx tuiuiu.js mcp

  # For web integrations (HTTP)
  npx tuiuiu.js mcp --http --port=3200

  # For streaming clients (SSE)
  npx tuiuiu.js mcp --sse --port=3200

  # Remote bind requires authentication
  TUIUIU_MCP_AUTH_TOKEN=replace-me npx tuiuiu.js mcp --http --host=0.0.0.0

  # Run storybook
  npx tuiuiu storybook

Client Configuration:

  Claude Code (~/.claude/settings.json):
    {
      "mcpServers": {
        "tuiuiu": { "command": "npx", "args": ["tuiuiu.js", "mcp"] }
      }
    }

  Codex CLI (~/.codex/config.toml):
    [mcp_servers.tuiuiu]
    command = "npx"
    args = ["tuiuiu.js", "mcp"]

  Cursor/Continue (SSE):
    http://localhost:3200/sse

Documentation: https://github.com/forattini-dev/tuiuiu.js
`.trim());
}
