/**
 * Tuiuiu MCP (Model Context Protocol) Server
 *
 * Provides AI assistants with access to Tuiuiu documentation.
 *
 * Usage:
 *   npx tuiuiu mcp              # Start stdio server (for Claude Code)
 *   npx tuiuiu mcp --http       # Start HTTP server
 */

export { MCPServer, runMcpServer } from './server.js';
export type { MCPServerOptions } from './server.js';

export {
  allComponents,
  allHooks,
  allThemes,
  categories,
} from './docs-data.js';

export type {
  JsonRpcRequest,
  JsonRpcResponse,
  MCPTool,
  MCPToolResult,
  ComponentDoc,
  HookDoc,
  ThemeDoc,
} from './types.js';
