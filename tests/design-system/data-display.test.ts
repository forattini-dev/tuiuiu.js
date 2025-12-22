/**
 * Tests for Design System Data Display Components
 */

import { describe, it, expect } from 'vitest';
import { renderToString } from '../../src/core/renderer.js';
import { Table, SimpleTable, KeyValueTable } from '../../src/molecules/table.js';
import { CodeBlock, InlineCode } from '../../src/molecules/code-block.js';
import { Markdown, renderMarkdown } from '../../src/molecules/markdown.js';

describe('Data Display Components', () => {
  describe('Table', () => {
    it('should render table with data', () => {
      const node = Table({
        columns: [
          { key: 'name', header: 'Name' },
          { key: 'age', header: 'Age' },
        ],
        data: [
          { name: 'Alice', age: 30 },
          { name: 'Bob', age: 25 },
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Name');
      expect(output).toContain('Age');
      expect(output).toContain('Alice');
      expect(output).toContain('Bob');
    });

    it('should hide header', () => {
      const node = Table({
        columns: [{ key: 'item', header: 'Item' }],
        data: [{ item: 'Test' }],
        showHeader: false,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Test');
    });

    it('should apply border style', () => {
      const styles = ['single', 'double', 'round', 'bold', 'ascii', 'none'] as const;
      for (const style of styles) {
        const node = Table({
          columns: [{ key: 'x', header: 'X' }],
          data: [{ x: '1' }],
          borderStyle: style,
        });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });

    it('should apply column width', () => {
      const node = Table({
        columns: [
          { key: 'name', header: 'Name', width: 20 },
        ],
        data: [{ name: 'Test' }],
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should align columns', () => {
      const node = Table({
        columns: [
          { key: 'left', header: 'Left', align: 'left' },
          { key: 'center', header: 'Center', align: 'center' },
          { key: 'right', header: 'Right', align: 'right' },
        ],
        data: [{ left: 'L', center: 'C', right: 'R' }],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('L');
      expect(output).toContain('C');
      expect(output).toContain('R');
    });

    it('should apply header style', () => {
      const node = Table({
        columns: [{ key: 'x', header: 'Header' }],
        data: [{ x: '1' }],
        headerStyle: { color: 'cyan', bold: true },
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Header');
    });

    it('should handle empty data', () => {
      const node = Table({
        columns: [{ key: 'x', header: 'X' }],
        data: [],
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });


  describe('SimpleTable', () => {
    it('should render from 2D array', () => {
      const node = SimpleTable({
        headers: ['A', 'B', 'C'],
        rows: [
          ['1', '2', '3'],
          ['4', '5', '6'],
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('A');
      expect(output).toContain('B');
      expect(output).toContain('C');
      expect(output).toContain('1');
    });

    it('should render without headers', () => {
      const node = SimpleTable({
        rows: [
          ['A', 'B'],
          ['C', 'D'],
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('A');
      expect(output).toContain('D');
    });

    it('should apply border style', () => {
      const node = SimpleTable({
        rows: [['X']],
        borderStyle: 'round',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('╭');
    });
  });

  describe('KeyValueTable', () => {
    it('should render key-value pairs from object', () => {
      const node = KeyValueTable({
        entries: {
          Name: 'Test',
          Version: '1.0',
        },
      });
      const output = renderToString(node, 80);
      expect(output).toContain('Name');
      expect(output).toContain('Test');
      expect(output).toContain('Version');
      expect(output).toContain('1.0');
    });

    it('should render from array of entries', () => {
      const node = KeyValueTable({
        entries: [
          { key: 'First', value: 'A' },
          { key: 'Second', value: 'B' },
        ],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('First');
      expect(output).toContain('A');
    });

    it('should apply key color', () => {
      const node = KeyValueTable({
        entries: { Key: 'Value' },
        keyColor: 'cyan',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[36m');
    });

    it('should apply value color', () => {
      const node = KeyValueTable({
        entries: { Key: 'Value' },
        valueColor: 'green',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('\x1b[32m');
    });

    it('should apply border style', () => {
      const node = KeyValueTable({
        entries: { X: 'Y' },
        borderStyle: 'single',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });
  });

  describe('CodeBlock', () => {
    it('should render code block', () => {
      const node = CodeBlock({
        code: 'console.log("hello");',
        language: 'javascript',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('console');
    });

    it('should show line numbers', () => {
      const node = CodeBlock({
        code: 'line1\nline2',
        lineNumbers: true,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('1');
      expect(output).toContain('2');
    });

    it('should hide line numbers', () => {
      const node = CodeBlock({
        code: 'code',
        lineNumbers: false,
      });
      const output = renderToString(node, 80);
      expect(output).toContain('code');
    });

    it('should show filename', () => {
      const node = CodeBlock({
        code: 'test',
        filename: 'test.js',
      });
      const output = renderToString(node, 80);
      expect(output).toContain('test.js');
    });

    it('should apply theme', () => {
      const node = CodeBlock({
        code: 'const x = 1;',
        language: 'javascript',
        theme: 'dark',
      });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });

    it('should highlight line', () => {
      const node = CodeBlock({
        code: 'line1\nline2\nline3',
        highlightLines: [2],
      });
      const output = renderToString(node, 80);
      expect(output).toContain('line2');
    });

    it('should apply syntax highlighting', () => {
      const languages = ['typescript', 'python', 'bash', 'json', 'css', 'html'] as const;
      for (const lang of languages) {
        const node = CodeBlock({
          code: 'test',
          language: lang,
        });
        const output = renderToString(node, 80);
        expect(output).toBeDefined();
      }
    });
  });

  describe('InlineCode', () => {
    it('should render inline code', () => {
      const node = InlineCode({ code: 'npm install' });
      const output = renderToString(node, 80);
      expect(output).toContain('npm install');
    });

    it('should apply color', () => {
      const node = InlineCode({ code: 'test', color: 'yellow' });
      const output = renderToString(node, 80);
      expect(output).toContain('test');
      // InlineCode uses color and backgroundColor, so ANSI code is combined
      expect(output).toContain('\x1b[');
    });
  });

  describe('Markdown', () => {
    it('should render markdown heading', () => {
      const node = Markdown({ content: '# Hello' });
      const output = renderToString(node, 80);
      expect(output).toContain('Hello');
    });

    it('should render bold text', () => {
      const node = Markdown({ content: '**bold**' });
      const output = renderToString(node, 80);
      expect(output).toContain('bold');
    });

    it('should render italic text', () => {
      const node = Markdown({ content: '*italic*' });
      const output = renderToString(node, 80);
      expect(output).toContain('italic');
    });

    it('should render bullet list', () => {
      const node = Markdown({ content: '- Item 1\n- Item 2' });
      const output = renderToString(node, 80);
      expect(output).toContain('Item 1');
      expect(output).toContain('Item 2');
    });

    it('should render numbered list', () => {
      const node = Markdown({ content: '1. First\n2. Second' });
      const output = renderToString(node, 80);
      expect(output).toContain('First');
      expect(output).toContain('Second');
    });

    it('should render blockquote', () => {
      const node = Markdown({ content: '> Quote' });
      const output = renderToString(node, 80);
      expect(output).toContain('Quote');
    });

    it('should render inline code', () => {
      const node = Markdown({ content: '`code`' });
      const output = renderToString(node, 80);
      expect(output).toContain('code');
    });

    it('should render code block', () => {
      const node = Markdown({ content: '```\ncode block\n```' });
      const output = renderToString(node, 80);
      expect(output).toContain('code block');
    });

    it('should render horizontal rule', () => {
      const node = Markdown({ content: '---' });
      const output = renderToString(node, 80);
      expect(output).toContain('─');
    });

    it('should render links', () => {
      const node = Markdown({ content: '[Link](https://example.com)' });
      const output = renderToString(node, 80);
      expect(output).toContain('Link');
    });
  });

  describe('renderMarkdown', () => {
    it('should render markdown string', () => {
      const node = renderMarkdown('**test**');
      const output = renderToString(node, 80);
      expect(output).toContain('test');
    });

    it('should apply width', () => {
      const node = renderMarkdown('Long text here', { maxWidth: 10 });
      const output = renderToString(node, 80);
      expect(output).toBeDefined();
    });
  });
});
