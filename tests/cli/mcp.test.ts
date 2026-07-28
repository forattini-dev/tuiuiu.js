import { describe, expect, it } from 'vitest';

import { parseArgs } from '../../src/cli/commands/mcp.js';

describe('MCP CLI options', () => {
  it('uses safe network defaults', () => {
    expect(parseArgs(['--http'])).toMatchObject({
      transport: 'http',
      host: '127.0.0.1',
      port: 3200,
      allowedOrigins: [],
      maxRequestBytes: 1024 * 1024,
    });
  });

  it('parses explicit hardening options', () => {
    expect(parseArgs([
      '--sse',
      '--host=0.0.0.0',
      '--port=4321',
      '--token=secret',
      '--allow-origin=https://app.example',
      '--max-request-bytes=4096',
    ])).toMatchObject({
      transport: 'sse',
      host: '0.0.0.0',
      port: 4321,
      authToken: 'secret',
      allowedOrigins: ['https://app.example'],
      maxRequestBytes: 4096,
    });
  });

  it.each([
    ['--port=-1'],
    ['--port=65536'],
    ['--port=not-a-number'],
  ])('rejects an invalid port (%s)', (port) => {
    expect(() => parseArgs(['--http', port])).toThrow(/Invalid MCP port/u);
  });

  it('rejects conflicting transports', () => {
    expect(() => parseArgs(['--http', '--sse'])).toThrow(/only one/u);
  });
});
