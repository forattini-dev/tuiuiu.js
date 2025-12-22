/**
 * MCP command - starts the Model Context Protocol server
 */

export interface McpOptions {
  transport: 'stdio' | 'http';
  port: number;
  debug: boolean;
}

export function parseArgs(args: string[]): McpOptions {
  const isHttp = args.includes('--http') || args.includes('-H');
  const isDebug = args.includes('--debug') || args.includes('-d');
  const portArg = args.find(a => a.startsWith('--port='));
  const port = portArg ? parseInt(portArg.split('=')[1], 10) : 3200;

  return {
    transport: isHttp ? 'http' : 'stdio',
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
