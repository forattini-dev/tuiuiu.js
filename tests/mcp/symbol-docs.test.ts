import { describe, expect, it } from 'vitest';

import { formatSymbolDocSections, getSymbolDoc, searchSymbolDocs } from '../../src/mcp/symbol-docs.js';

describe('MCP structured symbol docs', () => {
  it('returns structured metadata for Page', () => {
    const doc = getSymbolDoc('Page');

    expect(doc).toBeDefined();
    expect(doc?.pattern).toBe('props');
    expect(doc?.gotchas?.some((gotcha) => gotcha.code === 'api-pattern-mismatch')).toBe(true);
  });

  it('searches symbols by gotcha keywords', () => {
    const results = searchSymbolDocs('createSignal');
    expect(results.some((doc) => doc.name === 'createSignal')).toBe(true);
  });

  it('includes perf inspector symbols in structured search', () => {
    const results = searchSymbolDocs('perf inspector');
    expect(results.some((doc) => doc.name === 'configurePerfInspector')).toBe(true);
    expect(results.some((doc) => doc.name === 'PerfOverlay')).toBe(true);
  });

  it('formats structured sections with import and gotchas', () => {
    const doc = getSymbolDoc('ScrollList');
    const output = formatSymbolDocSections(doc!);

    expect(output).toContain('Structured Metadata');
    expect(output).toContain(`import { ScrollList } from 'tuiuiu.js'`);
    expect(output).toContain('api-pattern-mismatch');
  });
});
