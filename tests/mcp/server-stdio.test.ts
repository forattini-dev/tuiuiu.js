import { PassThrough } from 'node:stream';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MCPServer } from '../../src/mcp/server.js';

interface StdioHarness {
  server: MCPServer;
  input: PassThrough;
  readMessages: () => unknown[];
}

const runningServers: MCPServer[] = [];

async function createHarness(maxRequestBytes = 1024): Promise<StdioHarness> {
  const input = new PassThrough();
  const output = new PassThrough();
  let received = '';
  output.on('data', chunk => {
    received += chunk.toString('utf8');
  });

  const server = new MCPServer({
    transport: 'stdio',
    stdioInput: input,
    stdioOutput: output,
    maxRequestBytes,
  });
  runningServers.push(server);
  await server.start();

  return {
    server,
    input,
    readMessages: () => received
      .split('\n')
      .filter(Boolean)
      .map(line => JSON.parse(line) as unknown),
  };
}

afterEach(async () => {
  await Promise.all(runningServers.splice(0).map(server => server.stop()));
});

describe('MCP stdio transport', () => {
  it('processes a valid JSON-RPC request', async () => {
    const harness = await createHarness();

    harness.input.write('{"jsonrpc":"2.0","id":7,"method":"ping"}\n');

    await vi.waitFor(() => expect(harness.readMessages()).toHaveLength(1));
    expect(harness.readMessages()[0]).toEqual({
      jsonrpc: '2.0',
      id: 7,
      result: {},
    });
  });

  it('flushes a final unterminated request before closing stdio output', async () => {
    const harness = await createHarness();

    harness.input.end('{"jsonrpc":"2.0","id":8,"method":"ping"}');

    await vi.waitFor(() => expect(harness.readMessages()).toHaveLength(1));
    expect(harness.readMessages()[0]).toMatchObject({ id: 8, result: {} });
  });

  it('does not emit responses for notifications', async () => {
    const harness = await createHarness();

    harness.input.write('{"jsonrpc":"2.0","method":"notifications/initialized"}\n');
    await new Promise<void>(resolve => setImmediate(resolve));
    await new Promise<void>(resolve => setImmediate(resolve));

    expect(harness.readMessages()).toEqual([]);
  });

  it('distinguishes parse errors from invalid requests', async () => {
    const harness = await createHarness();

    harness.input.write('{\n');
    harness.input.write('{"jsonrpc":"1.0","id":1,"method":"ping"}\n');

    await vi.waitFor(() => expect(harness.readMessages()).toHaveLength(2));
    expect(harness.readMessages()).toMatchObject([
      { id: null, error: { code: -32700, message: 'Parse error' } },
      { id: null, error: { code: -32600, message: 'Invalid JSON-RPC request' } },
    ]);
  });

  it('bounds line size and recovers at the next frame', async () => {
    const harness = await createHarness(64);

    harness.input.write(`${'x'.repeat(100)}\n`);
    harness.input.write('{"jsonrpc":"2.0","id":9,"method":"ping"}\n');

    await vi.waitFor(() => expect(harness.readMessages()).toHaveLength(2));
    expect(harness.readMessages()[0]).toMatchObject({
      id: null,
      error: { code: -32001, message: 'Request body too large' },
    });
    expect(harness.readMessages()[1]).toMatchObject({ id: 9, result: {} });
  });

  it('returns invalid-params errors without misreporting them as parse errors', async () => {
    const harness = await createHarness();

    harness.input.write(
      '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":[]}\n',
    );

    await vi.waitFor(() => expect(harness.readMessages()).toHaveLength(1));
    expect(harness.readMessages()[0]).toMatchObject({
      id: 3,
      error: { code: -32602 },
    });
  });
});
