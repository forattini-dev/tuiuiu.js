import * as http from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { MCPServer } from '../../src/mcp/server.js';

const runningServers: MCPServer[] = [];

async function startServer(options: ConstructorParameters<typeof MCPServer>[0]): Promise<{
  server: MCPServer;
  baseUrl: string;
}> {
  const server = new MCPServer({ port: 0, ...options });
  runningServers.push(server);
  await server.start();
  const address = server.getAddress();
  if (!address) throw new Error('MCP server did not expose an address');
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

interface SseClient {
  request: http.ClientRequest;
  response: http.IncomingMessage;
  sessionId: string;
  read: () => string;
}

function connectSse(url: string): Promise<SseClient> {
  return new Promise((resolve, reject) => {
    const request = http.get(url);
    request.once('error', reject);
    request.once('response', (response) => {
      let received = '';
      const onData = (chunk: Buffer) => {
        received += chunk.toString('utf8');
        const match = /"sessionId":"([^"]+)"/u.exec(received);
        if (!match) return;
        response.off('data', onData);
        response.on('data', (nextChunk: Buffer) => {
          received += nextChunk.toString('utf8');
        });
        resolve({
          request,
          response,
          sessionId: match[1]!,
          read: () => received,
        });
      };
      response.on('data', onData);
    });
  });
}

afterEach(async () => {
  vi.restoreAllMocks();
  await Promise.all(runningServers.splice(0).map((server) => server.stop()));
});

describe('MCP network transports', () => {
  it('binds HTTP to loopback and rejects unapproved browser origins', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { server, baseUrl } = await startServer({ transport: 'http' });

    expect(server.getAddress()?.address).toBe('127.0.0.1');
    const forbidden = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://attacker.example' },
    });
    expect(forbidden.status).toBe(403);

    const health = await fetch(`${baseUrl}/health`);
    expect(health.status).toBe(200);
  });

  it('allows only an explicitly configured browser origin', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({
      transport: 'http',
      allowedOrigins: ['https://app.example'],
    });

    const preflight = await fetch(`${baseUrl}/mcp`, {
      method: 'OPTIONS',
      headers: { Origin: 'https://app.example' },
    });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-origin')).toBe('https://app.example');

    const lookalike = await fetch(`${baseUrl}/health`, {
      headers: { Origin: 'https://app.example.attacker.test' },
    });
    expect(lookalike.status).toBe(403);
  });

  it('requires the configured bearer token', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({
      transport: 'http',
      authToken: 'correct-horse-battery-staple',
    });

    expect((await fetch(`${baseUrl}/health`)).status).toBe(401);
    const authorized = await fetch(`${baseUrl}/health`, {
      headers: { Authorization: 'Bearer correct-horse-battery-staple' },
    });
    expect(authorized.status).toBe(200);
  });

  it('rejects oversized bodies before parsing JSON', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({
      transport: 'http',
      maxRequestBytes: 32,
    });

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
        padding: 'x'.repeat(100),
      }),
    });

    expect(response.status).toBe(413);
    expect((await response.json()) as object).toMatchObject({
      error: { code: -32001 },
    });
  });

  it('rejects invalid media types, JSON, RPC envelopes, methods, and paths', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({ transport: 'http' });

    const wrongType = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      body: '{}',
    });
    expect(wrongType.status).toBe(415);

    const invalidJson = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(invalidJson.status).toBe(400);

    const invalidRpc = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: 'ping' }),
    });
    expect(invalidRpc.status).toBe(400);

    const unknownMethod = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 3, method: 'unknown' }),
    });
    expect(unknownMethod.status).toBe(200);
    expect(await unknownMethod.json()).toMatchObject({
      id: 3,
      error: { code: -32601 },
    });

    expect((await fetch(`${baseUrl}/health?shadow=true`)).status).toBe(404);
    expect((await fetch(`${baseUrl}/mcp/extra`)).status).toBe(404);
  });

  it('returns no JSON-RPC body for notifications', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({ transport: 'http' });

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'notifications/initialized',
      }),
    });

    expect(response.status).toBe(202);
    expect(await response.text()).toBe('');
  });

  it('reports malformed method parameters as JSON-RPC errors', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({ transport: 'http' });

    const response = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/call',
        params: [],
      }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      id: 4,
      error: { code: -32602 },
    });
  });

  it('limits concurrent requests while a handler is active', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { server, baseUrl } = await startServer({
      transport: 'http',
      maxConcurrentRequests: 1,
    });

    let releaseFirst!: () => void;
    const blocked = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });
    const dispatch = vi
      .spyOn(server as any, 'dispatchRequest')
      .mockImplementationOnce(async (...args: unknown[]) => {
        const request = args[0] as { id: number };
        await blocked;
        return { jsonrpc: '2.0', id: request.id, result: {} };
      });

    const first = fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    });
    await vi.waitFor(() => expect(dispatch).toHaveBeenCalledTimes(1));

    const second = await fetch(`${baseUrl}/mcp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }),
    });
    expect(second.status).toBe(503);

    releaseFirst();
    expect((await first).status).toBe(200);
  });

  it('refuses a non-loopback bind without authentication', async () => {
    const server = new MCPServer({
      transport: 'http',
      host: '0.0.0.0',
      port: 0,
    });

    await expect(server.start()).rejects.toThrow(/requires authToken/u);
  });

  it('routes an SSE response only to the requesting session', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({ transport: 'sse' });
    const clientA = await connectSse(`${baseUrl}/sse`);
    const clientB = await connectSse(`${baseUrl}/sse`);

    try {
      const response = await fetch(
        `${baseUrl}/message?sessionId=${encodeURIComponent(clientA.sessionId)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 73, method: 'ping' }),
        },
      );
      expect(response.status).toBe(200);
      await new Promise<void>((resolve) => setImmediate(resolve));

      expect(clientA.read()).toContain('"id":73');
      expect(clientB.read()).not.toContain('"id":73');
    } finally {
      clientA.response.destroy();
      clientA.request.destroy();
      clientB.response.destroy();
      clientB.request.destroy();
    }
  });

  it('bounds SSE sessions and rejects unknown session identifiers', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { baseUrl } = await startServer({
      transport: 'sse',
      maxSseConnections: 1,
    });
    const client = await connectSse(`${baseUrl}/sse`);

    try {
      const extra = await fetch(`${baseUrl}/sse`);
      expect(extra.status).toBe(503);

      const unknown = await fetch(`${baseUrl}/message?sessionId=not-a-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
      });
      expect(unknown.status).toBe(404);
    } finally {
      client.response.destroy();
      client.request.destroy();
    }
  });

  it('stops network transports idempotently', async () => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    const { server } = await startServer({ transport: 'http' });
    await server.stop();
    await server.stop();
    expect(server.getAddress()).toBeNull();
  });

  it('rejects unsafe or nonsensical server options eagerly', () => {
    expect(() => new MCPServer({ maxRequestBytes: 0 })).toThrow(/positive integer/);
    expect(() => new MCPServer({ requestTimeoutMs: Number.NaN })).toThrow(/positive integer/);
    expect(() => new MCPServer({ port: 70_000 })).toThrow(/port/);
    expect(() => new MCPServer({ authToken: '' })).toThrow(/authToken/);
    expect(() => new MCPServer({ allowedOrigins: ['https://app.example/path'] }))
      .toThrow(/exact HTTP/);
  });
});
