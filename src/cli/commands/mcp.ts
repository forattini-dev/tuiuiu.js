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
  host: string;
  authToken?: string;
  allowedOrigins: string[];
  maxRequestBytes: number;
  debug: boolean;
}

export function parseArgs(args: string[]): McpOptions {
  const isHttp = args.includes('--http') || args.includes('-H');
  const isSse = args.includes('--sse') || args.includes('-S');
  if (isHttp && isSse) {
    throw new Error('Choose only one MCP network transport: --http or --sse');
  }
  const isDebug = args.includes('--debug') || args.includes('-d');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3200;
  if (!Number.isInteger(port) || port < 0 || port > 65_535) {
    throw new Error(`Invalid MCP port: ${portArg?.split('=')[1] ?? ''}`);
  }
  const hostArg = args.find(a => a.startsWith('--host='));
  const host = hostArg?.slice('--host='.length) || '127.0.0.1';
  const tokenArg = args.find(a => a.startsWith('--token='));
  const authToken = tokenArg?.slice('--token='.length) || process.env.TUIUIU_MCP_AUTH_TOKEN;
  const allowedOrigins = args
    .filter(a => a.startsWith('--allow-origin='))
    .map(a => a.slice('--allow-origin='.length))
    .filter(Boolean);
  const maxBytesArg = args.find(a => a.startsWith('--max-request-bytes='));
  const maxRequestBytes = maxBytesArg
    ? parseInt(maxBytesArg.slice('--max-request-bytes='.length), 10)
    : 1024 * 1024;
  if (!Number.isInteger(maxRequestBytes) || maxRequestBytes < 1) {
    throw new Error('Invalid --max-request-bytes value');
  }

  // Determine transport.
  let transport: 'stdio' | 'http' | 'sse' = 'stdio';
  if (isSse) {
    transport = 'sse';
  } else if (isHttp) {
    transport = 'http';
  }

  return {
    transport,
    port,
    host,
    authToken,
    allowedOrigins,
    maxRequestBytes,
    debug: isDebug,
  };
}

export async function runMcpCommand(args: string[]): Promise<void> {
  const options = parseArgs(args);

  // Dynamic import to avoid loading MCP dependencies until needed
  const { runMcpServer } = await import('../../mcp/index.js');
  await runMcpServer(options);
}
