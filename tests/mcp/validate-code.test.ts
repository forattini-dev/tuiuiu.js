import { describe, expect, it } from 'vitest';

import { formatValidationResult, validateTuiuiuCode } from '../../src/mcp/validate-code.js';

describe('MCP code validation', () => {
  it('detects createSignal inside component render', () => {
    const result = validateTuiuiuCode(`
      function App() {
        const [count, setCount] = createSignal(0);
        return Text({}, String(count()));
      }
    `);

    expect(result.ok).toBe(false);
    expect(result.issues.some((issue) => issue.code === 'signals-inside-component-render')).toBe(true);
  });

  it('allows reactive theme switching after render', () => {
    const result = validateTuiuiuCode(`
      const app = render(App);
      setTheme(darkTheme);
    `);

    expect(result.ok).toBe(true);
  });

  it('detects API pattern mismatches', () => {
    const result = validateTuiuiuCode(`
      Page({ title: 'Home' }, Content());
      ScrollList({ items, children: Text({}, 'wrong') });
      Tabs({ tabs, children: Text({}, 'wrong') });
    `);

    const apiIssues = result.issues.filter((issue) => issue.code === 'api-pattern-mismatch');
    expect(apiIssues.length).toBeGreaterThanOrEqual(3);
  });

  it('returns ok for a clean snippet', () => {
    const result = validateTuiuiuCode(`
      setTheme(darkTheme);

      function App() {
        const [count, setCount] = useState(0);
        useShortcut('up', () => setCount(c => c + 1));
        return Page({ title: 'Home', children: Text({}, String(count())) });
      }

      render(App);
    `);

    expect(result.ok).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('formats validation output with references', () => {
    const output = formatValidationResult(validateTuiuiuCode(`
      function App() {
        const [count] = createSignal(0);
        return Text({}, String(count()));
      }
    `));

    expect(output).toContain('Validation Result');
    expect(output).toContain('Signals Inside Component Render');
    expect(output).toContain('tuiuiu://guide/common-mistakes');
  });
});
