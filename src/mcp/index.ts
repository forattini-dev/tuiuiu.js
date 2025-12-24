/**
 * Tuiuiu MCP (Model Context Protocol) Server
 *
 * Provides AI assistants with access to Tuiuiu documentation.
 *
 * Features:
 * - Tools: 9 documentation tools
 * - Resources: Component, hook, theme, and guide resources
 * - Resource Templates: Dynamic URIs for flexible access
 * - Prompts: 15+ pre-defined prompts for common tasks
 * - Completions: Argument autocompletion for tools and prompts
 * - Logging: Structured logging to clients
 *
 * Usage:
 *   npx tuiuiu.js@latest mcp              # Start stdio server (for Claude Code)
 *   npx tuiuiu.js@latest mcp --http       # Start HTTP server
 */

// Server
export { MCPServer, runMcpServer } from './server.js';
export type { MCPServerOptions } from './server.js';

// Documentation data
export {
  allComponents,
  allHooks,
  allThemes,
  categories,
} from './docs-data.js';

// Prompts
export { prompts, getPromptResult } from './prompts.js';
export type { MCPPrompt, MCPPromptResult, MCPPromptMessage } from './prompts.js';

// Resources
export {
  getStaticResources,
  getResourceTemplates,
  readResource,
} from './resources.js';
export type { MCPResourceTemplate, MCPResourceContents } from './resources.js';

// Completions
export {
  getPromptCompletions,
  getResourceCompletions,
  getToolCompletions,
} from './completions.js';
export type { MCPCompletionRequest, MCPCompletionResult } from './completions.js';

// Logging
export {
  createMCPLogger,
  nullLogger,
  createProgressReporter,
  createResourceNotifier,
} from './logging.js';
export type {
  MCPLogLevel,
  MCPLogMessage,
  LogSender,
} from './logging.js';

// Types
export type {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcNotification,
  MCPTool,
  MCPToolResult,
  MCPResource,
  MCPCapabilities,
  MCPInitializeResult,
  ComponentDoc,
  HookDoc,
  ThemeDoc,
} from './types.js';
