/**
 * MCP command - starts the Model Context Protocol server
 *
 * Supported transports:
 * - stdio (default): Communication via stdin/stdout - for Claude Code, Codex CLI
 * - http: HTTP POST requests - for web integrations
 * - sse: Server-Sent Events - for streaming web clients
 */

export interface McpOptions {
  transport: 'stdio' | 'http' | 'sse';
  port: number;
  debug: boolean;
}

export function parseArgs(args: string[]): McpOptions {
  const isHttp = args.includes('--http') || args.includes('-H');
  const isSse = args.includes('--sse') || args.includes('-S');
  const isDebug = args.includes('--debug') || args.includes('-d');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3200;

  // Determine transport (priority: sse > http > stdio)
  let transport: 'stdio' | 'http' | 'sse' = 'stdio';
  if (isSse) {
    transport = 'sse';
  } else if (isHttp) {
    transport = 'http';
  }

  return {
    transport,
    port,
    debug: isDebug,
  };
}

export async function runMcpCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);

  // Dynamic import to avoid loading MCP dependencies until needed
  const { runMcpServer } = await import('../../mcp/index.js');
  await runMcpServer(options);
}
