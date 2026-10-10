import { afterEach, describe, expect, it } from 'vitest';
import { RichText } from '../../src/primitives/rich-text.js';
import { Box } from '../../src/primitives/nodes.js';
import { createFrameSnapshot } from '../../src/core/frame.js';
import { renderFrameToCellBuffer } from '../../src/core/delta-render.js';
import { createTestHarness } from '../../src/dev-tools/testing.js';
import { fitTextToWidth } from '../../src/utils/text-utils.js';
import { layoutTextSpans, normalizeTextSpans } from '../../src/utils/styled-text.js';

const apps: ReturnType<typeof createTestHarness>[] = [];
afterEach(() => { for (const app of apps.splice(0)) app.cleanup(); });
const raster = (node: ReturnType<typeof RichText>, width = 12) =>
  renderFrameToCellBuffer(createFrameSnapshot(node, { width, height: 8 }));

describe('structured RichText', () => {
  it('retains structured runs in the frame and wraps independently of style boundaries', () => {
    const node = RichText({ color: 'green' }, 'hello ', { text: 'world', style: { color: 'red', bold: true } }, ' again');
    const frame = createFrameSnapshot(node, { width: 12, height: 8 });
    expect(frame.drawCommands[0]).toMatchObject({ text: 'hello world again', textSpans: node.props.__textSpans });
    const buffer = renderFrameToCellBuffer(frame);
    expect(buffer.get(6, 0)).toMatchObject({ char: 'w', fg: 'red', attrs: { bold: true } });
    expect(buffer.get(0, 1)).toMatchObject({ char: 'a', fg: 'green' });
    expect(buffer.get(0, 1)!.attrs.bold).not.toBe(true);
  });
  it('snapshots caller-owned styles, resolves colors and permits explicit false overrides', () => {
    const span = { text: 'abc', style: { color: '#ff0000', bold: false, underline: 'curly' as const, underlineColor: '#00ff00' } };
    const node = RichText({ bold: true }, span, { text: 'd', style: { color: 'primary' } });
    span.text = 'changed'; span.style.color = 'blue';
    const buffer = raster(node);
    expect(buffer.get(0, 0)).toMatchObject({ char: 'a', fg: '#ff0000',
      attrs: { bold: false, underline: 'curly', underlineColor: '#00ff00' } });
    expect(buffer.get(3, 0)!.fg).toBeDefined();
    expect(buffer.get(3, 0)!.attrs.bold).toBe(true);
    expect(Object.isFrozen(node.props.__textSpans)).toBe(true);
    expect(Object.isFrozen(node.props.__textSpans[0].style)).toBe(true);
  });
  it('keeps a grapheme whole even when a style boundary falls inside it', () => {
    const buffer = raster(RichText({}, { text: 'e', style: { color: 'red' } },
      { text: '\u0301界', style: { color: 'blue' } }, '👩‍💻'), 5);
    expect(buffer.get(0, 0)).toMatchObject({ char: 'e\u0301', fg: 'red' });
    expect(buffer.get(1, 0)).toMatchObject({ char: '界', fg: 'blue' });
    expect(buffer.get(2, 0)!.isWide).toBe(true);
    expect(buffer.get(3, 0)!.char).toBe('👩‍💻');
  });
  it('inherits parent backgrounds, clips wide cells and strips terminal protocols from spans', () => {
    const node = RichText({}, { text: '\x1b[31mabc\x1b[0m\x1b]52;c;secret\x07界', style: { color: 'white' } });
    expect(node.props.children).toBe('abc界');
    const buffer = renderFrameToCellBuffer(createFrameSnapshot(Box({ width: 4, height: 1, overflow: 'hidden', backgroundColor: 'blue' }, node), { width: 8, height: 3 }));
    expect(buffer.get(0, 0)).toMatchObject({ char: 'a', fg: 'white', bg: 'blue' });
    expect(buffer.get(4, 0)!.char).toBe(' ');
  });
  it.each(['truncate', 'truncate-end', 'truncate-start', 'truncate-middle'] as const)('maps retained span styles through %s', wrap => {
    const spans = normalizeTextSpans([{ text: 'abcdef', style: { color: 'red' } }, { text: 'ghijkl', style: { color: 'blue' } }]);
    const row = layoutTextSpans(spans, 5, wrap)[0]!;
    expect(row.map(span => span.text).join('')).toBe(fitTextToWidth('abcdefghijkl', 5, wrap)[0]);
    for (const span of row) {
      if (span.text === '…') expect(span.style).toBeUndefined();
      else expect(span.style?.color).toBe('abcdef'.includes(span.text) ? 'red' : 'blue');
    }
  });
  it('uses identical text geometry for widths, blank lines, repeated spaces and long words', () => {
    for (const source of ['hello world again', 'abc abc abc', ' a  b   c ', 'abcdefghijklmnop', 'e\u0301界👩‍💻', '\n\n', 'one\ntwo\n']) {
      for (let width = 1; width < 14; width++) {
        const spans = normalizeTextSpans([...source].map(text => ({ text, style: { color: 'red' } })));
        expect(layoutTextSpans(spans, width).map(row => row.map(span => span.text).join('')))
          .toEqual(fitTextToWidth(source, width));
      }
    }
  });
  it('distinguishes a generated truncation marker from identical literal text', () => {
    const spans = normalizeTextSpans([{ text: 'ab…def', style: { color: 'red' } }]);
    expect(layoutTextSpans(spans, 3, 'truncate-end')[0]!.map(span => span.style?.color))
      .toEqual(['red', 'red', undefined]);
    expect(layoutTextSpans(spans, 5, 'truncate-middle')[0]!.map(span => span.style?.color))
      .toEqual(['red', 'red', undefined, 'red', 'red']);
  });
  it.each(['left', 'right', 'up', 'down'] as const)('preserves span geometry under a %s reveal', direction => {
    const node = RichText({ __compositor: { key: 'reveal-rich', transforms: [{ kind: 'reveal', direction, progress: 0.5 }] } } as any,
      { text: 'abcd', style: { color: 'red' } }, { text: 'efgh', style: { color: 'blue' } });
    const buffer = raster(node, 8);
    if (direction === 'left') {
      expect(buffer.get(0, 0)).toMatchObject({ char: 'a', fg: 'red' });
      expect(buffer.get(4, 0)!.char).toBe(' ');
    } else if (direction === 'right') {
      expect(buffer.get(0, 0)!.char).toBe(' ');
      expect(buffer.get(4, 0)).toMatchObject({ char: 'e', fg: 'blue' });
    } else expect(buffer.get(4, 0)).toMatchObject({ char: 'e', fg: 'blue' });
  });
  it('applies fade and shimmer to spans without mutating their source styles', () => {
    const parts = [{ text: 'text', style: { bold: true, dim: false, inverse: false } }];
    const fade = raster(RichText({ __compositor: { key: 'fade-rich', transforms: [{ kind: 'fade', opacity: 0.3 }] } } as any, ...parts));
    expect(fade.get(0, 0)!.attrs).toMatchObject({ dim: true, bold: false });
    const shimmer = raster(RichText({ __compositor: { key: 'shimmer-rich', transforms: [{ kind: 'shimmer', phase: 0.5, span: 1 }] } } as any, ...parts));
    expect(shimmer.get(0, 0)!.attrs).toMatchObject({ bold: true, inverse: true });
    expect(parts[0]!.style).toEqual({ bold: true, dim: false, inverse: false });
  });
  it.each([true, false])('updates style-only changes in real presentation (delta=%s)', async useDeltaRenderer => {
    const app = createTestHarness({ columns: 12, rows: 4, renderOptions: { useDeltaRenderer } });
    apps.push(app);
    let color = 'red';
    app.render(() => RichText({}, { text: 'unchanged', style: { color } }));
    const before = app.getFrame()!;
    color = 'blue';
    await app.flush();
    const after = app.getFrame()!;
    expect(renderFrameToCellBuffer(after).get(0, 0)!.fg).toBe('blue');
    expect(after.drawCommands).not.toBe(before.drawCommands);
    expect(app.getScreen()[0]!.trim()).toBe('unchanged');
    expect(app.terminal.getCell(0, 0)?.fg).toBe('blue');
    const repeated = after.drawCommands;
    await app.flush();
    expect(app.getFrame()!.drawCommands).toBe(repeated);
  });
});
