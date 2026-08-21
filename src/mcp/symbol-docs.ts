import {
  getCommonMistake,
  getCommonMistakeDocsPath,
  type CommonMistakeEntry,
} from '../core/common-mistakes.js';
import type { SymbolDoc, SymbolDocGotcha } from './types.js';

function gotcha(code: CommonMistakeEntry['code']): SymbolDocGotcha {
  const mistake = getCommonMistake(code);
  return {
    code,
    summary: mistake.summary,
    fix: mistake.rightExample,
    references: [getCommonMistakeDocsPath(code), 'tuiuiu://guide/common-mistakes'],
  };
}

export const symbolDocs: SymbolDoc[] = [
  {
    name: 'Box',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Primary layout primitive. Compose most trees with Box + Text.',
    pattern: 'variadic',
    related: ['Text', 'Page', 'AppShell'],
    stability: 'stable',
  },
  {
    name: 'Page',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Full-screen props-pattern layout entry point.',
    pattern: 'props',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['AppShell', 'Box', 'Text'],
    stability: 'stable',
  },
  {
    name: 'AppShell',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Props-pattern shell for header/sidebar/footer application layouts.',
    pattern: 'props',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['Page', 'Box'],
    stability: 'stable',
  },
  {
    name: 'Modal',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Props-pattern overlay component that expects `content`, not `children`.',
    pattern: 'props',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['AlertBox', 'ConfirmDialog'],
    stability: 'stable',
  },
  {
    name: 'ScrollList',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Render-function list primitive for scrollable content.',
    pattern: 'render',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['Static', 'Tabs'],
    stability: 'stable',
  },
  {
    name: 'Static',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Render-function component that freezes previously rendered items in place.',
    pattern: 'render',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['ScrollList'],
    stability: 'advanced',
  },
  {
    name: 'Tabs',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Data-driven tab component. Content belongs in tab objects, not top-level children.',
    pattern: 'data',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['Accordion', 'ScrollList'],
    stability: 'stable',
  },
  {
    name: 'Accordion',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Data-driven collapsible sections component.',
    pattern: 'data',
    gotchas: [gotcha('api-pattern-mismatch')],
    related: ['Tabs'],
    stability: 'stable',
  },
  {
    name: 'useState',
    kind: 'hook',
    importPath: 'tuiuiu.js',
    summary: 'Preferred component-local state hook. Persists across rerenders.',
    related: ['createSignal', 'useShortcut', 'useInteraction'],
    stability: 'stable',
  },
  {
    name: 'useCompositor',
    kind: 'hook',
    importPath: 'tuiuiu.js',
    summary: 'Attach post-layout slide, fade, shimmer, spring, and reveal transforms to a component.',
    related: ['useAnimation', 'createSpring', 'useTerminalFocus'],
    stability: 'advanced',
  },
  {
    name: 'createSignal',
    kind: 'hook',
    importPath: 'tuiuiu.js',
    summary: 'Core reactive primitive. Best used at module scope or shared-state boundaries.',
    gotchas: [gotcha('signals-inside-component-render')],
    related: ['useState', 'createMemo', 'batch'],
    stability: 'stable',
  },
  {
    name: 'setTheme',
    kind: 'utility',
    importPath: 'tuiuiu.js',
    summary: 'Set or switch the active runtime theme reactively.',
    related: ['render', 'useTheme'],
    stability: 'stable',
  },
  {
    name: 'render',
    kind: 'utility',
    importPath: 'tuiuiu.js',
    summary: 'Mount the application runtime and start the render loop.',
    related: ['setTheme', 'useApp'],
    stability: 'stable',
  },
  {
    name: 'TerminalImage',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Terminal image component with protocol-backed rendering and halfblock fallback.',
    pattern: 'props',
    related: ['createTerminalImage'],
    stability: 'advanced',
  },
  {
    name: 'configurePerfInspector',
    kind: 'utility',
    importPath: 'tuiuiu.js',
    summary: 'Configure the committed-frame perf inspector ring buffer and frame budgets.',
    defaults: {
      enabled: 'true',
      maxFrames: '120',
      'budget.frameMs': '16.67',
      'budget.slowFrameMs': '33.34',
    },
    related: ['getPerfInspectorSummary', 'onSlowFrame', 'PerfOverlay'],
    stability: 'advanced',
  },
  {
    name: 'getPerfInspectorSummary',
    kind: 'utility',
    importPath: 'tuiuiu.js',
    summary: 'Read aggregate metrics for recent committed frames, including p95, output bytes, and phase averages.',
    related: ['configurePerfInspector', 'getPerfFrames', 'PerfOverlay'],
    stability: 'advanced',
  },
  {
    name: 'PerfOverlay',
    kind: 'component',
    importPath: 'tuiuiu.js',
    summary: 'Optional overlay component that renders the current perf inspector summary inside the UI tree.',
    pattern: 'props',
    related: ['configurePerfInspector', 'getPerfInspectorSummary'],
    stability: 'advanced',
  },
];

export function getSymbolDoc(name: string): SymbolDoc | undefined {
  return symbolDocs.find((doc) => doc.name.toLowerCase() === name.toLowerCase());
}

export function searchSymbolDocs(query: string): SymbolDoc[] {
  const needle = query.toLowerCase();
  return symbolDocs.filter((doc) =>
    doc.name.toLowerCase().includes(needle) ||
    doc.summary.toLowerCase().includes(needle) ||
    doc.importPath.toLowerCase().includes(needle) ||
    doc.related?.some((related) => related.toLowerCase().includes(needle)) ||
    doc.gotchas?.some((entry) => entry.summary.toLowerCase().includes(needle) || entry.code.includes(needle))
  );
}

export function formatSymbolDocSections(symbol: SymbolDoc): string {
  const lines: string[] = [];

  lines.push('## Structured Metadata');
  lines.push('');
  lines.push(`- Import: \`import { ${symbol.name} } from '${symbol.importPath}';\``);
  if (symbol.pattern) {
    lines.push(`- Pattern: \`${symbol.pattern}\``);
  }
  if (symbol.stability) {
    lines.push(`- Stability: \`${symbol.stability}\``);
  }
  lines.push('');

  if (symbol.gotchas && symbol.gotchas.length > 0) {
    lines.push('## Gotchas');
    lines.push('');
    for (const entry of symbol.gotchas) {
      lines.push(`- \`${entry.code}\`: ${entry.summary}`);
      if (entry.references && entry.references.length > 0) {
        lines.push(`  References: ${entry.references.join(', ')}`);
      }
    }
    lines.push('');
  }

  if (symbol.related && symbol.related.length > 0) {
    lines.push(`## Related Symbols\n\n${symbol.related.join(', ')}\n`);
  }

  return lines.join('\n').trim();
}
