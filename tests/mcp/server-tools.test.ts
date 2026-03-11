import { describe, expect, it } from 'vitest';

import { MCPServer } from '../../src/mcp/server.js';

describe('MCP server tools', () => {
  it('lists tuiuiu_validate_code as an available tool', async () => {
    const server = new MCPServer();
    const response = await (server as any).handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list',
    });

    const tools = response.result.tools as Array<{ name: string }>;
    expect(tools.some((tool) => tool.name === 'tuiuiu_validate_code')).toBe(true);
  });

  it('runs tuiuiu_validate_code through the tool call path', async () => {
    const server = new MCPServer();
    const response = await (server as any).handleToolCall(1, {
      name: 'tuiuiu_validate_code',
      arguments: {
        code: `
          function App() {
            const [count] = createSignal(0);
            return Text({}, String(count()));
          }
        `,
      },
    });

    const text = response.result.content[0].text as string;
    expect(response.result.isError).toBe(true);
    expect(text).toContain('Signals Inside Component Render');
    expect(text).toContain('tuiuiu://guide/common-mistakes');
  });

  it('enriches component docs with structured symbol metadata', async () => {
    const server = new MCPServer();
    const response = await (server as any).handleToolCall(1, {
      name: 'tuiuiu_get_component',
      arguments: {
        name: 'Page',
      },
    });

    const text = response.result.content[0].text as string;
    expect(text).toContain('Structured Metadata');
    expect(text).toContain('Pattern: `props`');
    expect(text).toContain('api-pattern-mismatch');
  });

  it('surfaces structured symbol matches in search results', async () => {
    const server = new MCPServer();
    const response = await (server as any).handleToolCall(1, {
      name: 'tuiuiu_search',
      arguments: {
        query: 'createSignal',
      },
    });

    const text = response.result.content[0].text as string;
    expect(text).toContain('createSignal');
    expect(text).toContain('tuiuiu://guide/common-mistakes');
  });
});
