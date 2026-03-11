/**
 * Delta Renderer Tests
 *
 * Tests for the optimized delta rendering system that uses double buffering
 * and cell-level diffing for efficient terminal updates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TerminalImage, createTerminalImage } from '../../src/atoms/terminal-image.js';
import {
  createDeltaRenderer,
  resetDeltaRenderer,
  type DeltaRenderer,
} from '../../src/core/delta-render.js';
import { createFrameSnapshot, resetFrameSequenceForTesting } from '../../src/core/frame.js';
import { createSolidImage } from '../../src/core/graphics.js';
import { renderFrameToString } from '../../src/core/renderer.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { stringWidth } from '../../src/utils/text-utils.js';
import type { VNode } from '../../src/utils/types.js';

function normalizeAnsiSgrOrder(output: string): string {
  let normalized = output;

  // Collapse adjacent SGR codes with no text between them into one canonical sequence.
  let previous: string;
  do {
    previous = normalized;
    normalized = normalized.replace(
      /\x1b\[([0-9;]+)m\x1b\[([0-9;]+)m/g,
      (_match, left: string, right: string) => {
        const merged = [...left.split(';'), ...right.split(';')]
          .filter(Boolean)
          .sort((a, b) => Number(a) - Number(b))
          .join(';');
        return `\x1b[${merged}m`;
      },
    );
  } while (normalized !== previous);

  return normalized.replace(/\x1b\[([0-9;]+)m/g, (_match, codes: string) => {
    const normalized = codes
      .split(';')
      .filter(Boolean)
      .sort((a, b) => Number(a) - Number(b))
      .join(';');
    return `\x1b[${normalized}m`;
  });
}

describe('Delta Renderer', () => {
  let mockStdout: {
    columns: number;
    rows: number;
    write: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    resetDeltaRenderer();
    resetFrameSequenceForTesting();
    mockStdout = {
      columns: 40,
      rows: 10,
      write: vi.fn(),
    };
  });

  describe('createDeltaRenderer', () => {
    it('should create a renderer instance', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
      });

      expect(renderer).toBeDefined();
      expect(renderer.render).toBeInstanceOf(Function);
      expect(renderer.renderFrame).toBeInstanceOf(Function);
      expect(renderer.fullRedraw).toBeInstanceOf(Function);
      expect(renderer.clear).toBeInstanceOf(Function);
      expect(renderer.cleanup).toBeInstanceOf(Function);
      expect(renderer.stats).toBeInstanceOf(Function);
      expect(renderer.resize).toBeInstanceOf(Function);
    });

    it('should render a simple VNode', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, 'Hello World');
      renderer.render(node);

      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render a committed frame snapshot', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const frame = createFrameSnapshot(Text({}, 'Committed'), {
        width: mockStdout.columns,
        height: mockStdout.rows,
      });

      renderer.renderFrame(frame);

      expect(mockStdout.write).toHaveBeenCalled();
      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(1);
    });

    it('should short-circuit identical committed frames without emitting terminal writes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      const frame = createFrameSnapshot(
        Box(
          { id: 'root', width: 18, height: 5, borderStyle: 'single', padding: 1 },
          Text({}, 'Stable frame'),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(frame);
      const firstWriteCount = mockStdout.write.mock.calls.length;

      renderer.renderFrame(frame);

      expect(mockStdout.write.mock.calls.length).toBe(firstWriteCount);
      expect(renderer.stats().lastPatchCount).toBe(0);
    });

    it('should short-circuit identical protocol-image frames without re-emitting graphics payloads', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      const frame = createFrameSnapshot(
        Box({
          id: 'image-box',
          width: 10,
          height: 6,
          borderStyle: 'single',
          padding: 1,
          __terminalImage: {
            source: createSolidImage(60, 40, 255, 0, 0),
            options: { protocol: 'kitty' as const },
          },
        } as any),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(frame);
      mockStdout.write.mockClear();

      renderer.renderFrame(frame);

      expect(mockStdout.write).not.toHaveBeenCalled();
      expect(renderer.stats().lastPatchCount).toBe(0);
    });

    it('should emit kitty cleanup when a protocol image is removed', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });
      const imageState = createTerminalImage({
        source: createSolidImage(60, 40, 255, 255, 0),
        protocol: 'kitty',
        fit: 'contain',
      });

      const previousFrame = createFrameSnapshot(
        Box(
          { id: 'image-box', width: 10, height: 6, borderStyle: 'single', padding: 1 },
          TerminalImage({
            state: imageState,
            width: 'fill',
            height: 'fill',
          }),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );
      const nextFrame = createFrameSnapshot(
        Box({ id: 'image-box', width: 10, height: 6, borderStyle: 'single', padding: 1 } as any,
          Text({}, 'gone'),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(previousFrame);
      mockStdout.write.mockClear();

      renderer.renderFrame(nextFrame);

      const output = mockStdout.write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain(`\x1b_Ga=d,d=i,i=${imageState.protocolState.kittyImageId}\x1b\\`);
    });

    it('should re-emit kitty placement when a protocol image moves', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });
      const imageState = createTerminalImage({
        source: createSolidImage(60, 40, 255, 0, 255),
        protocol: 'kitty',
        fit: 'contain',
      });
      const previousFrame = createFrameSnapshot(
        Box(
          { width: 20, height: 10 },
          Box({ width: 10, height: 6 }, TerminalImage({ state: imageState, width: 'fill', height: 'fill' })),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );
      const nextFrame = createFrameSnapshot(
        Box(
          { width: 20, height: 10, paddingLeft: 4 },
          Box({ width: 10, height: 6 }, TerminalImage({ state: imageState, width: 'fill', height: 'fill' })),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(previousFrame);
      mockStdout.write.mockClear();

      renderer.renderFrame(nextFrame);

      const output = mockStdout.write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(output).toContain(`\x1b_Ga=d,d=i,i=${imageState.protocolState.kittyImageId}\x1b\\`);
      expect(output).toMatch(/\x1b7\x1b\[\d+;\d+H\x1b_Ga=T/);
    });

    it('should keep full delta output aligned with canonical ANSI output', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      const frame = createFrameSnapshot(
        Box(
          { id: 'root', width: 16, height: 4, borderStyle: 'single', padding: 1, backgroundColor: 'blue' },
          Text({ color: 'white' }, 'Frame'),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(frame);

      const output = mockStdout.write.mock.calls.map(([chunk]) => String(chunk)).join('');
      expect(normalizeAnsiSgrOrder(output)).toBe(
        normalizeAnsiSgrOrder(`\x1b[H${renderFrameToString(frame)}`),
      );
    });

    it('should keep wide-character output aligned with canonical ANSI output', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      const frame = createFrameSnapshot(
        Box(
          { id: 'emoji-root', width: 16, height: 4, borderStyle: 'single', padding: 1 },
          Text({}, '📚 Hi'),
          Text({}, '🎉🎊'),
        ),
        {
          width: mockStdout.columns,
          height: mockStdout.rows,
        },
      );

      renderer.renderFrame(frame);

      const output = mockStdout.write.mock.calls.map(([chunk]) => String(chunk)).join('');
      const canonical = `\x1b[H${renderFrameToString(frame)}`;

      expect(normalizeAnsiSgrOrder(output)).toBe(normalizeAnsiSgrOrder(canonical));

      for (const line of renderFrameToString(frame).split('\n')) {
        expect(stringWidth(line)).toBe(16);
      }
    });

    it('should track render statistics', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, 'Test');
      renderer.render(node);

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(1);
      expect(stats.totalCells).toBe(40 * 10); // columns * rows
    });

    it('should do full render on first render', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, 'First');
      renderer.render(node);

      const stats = renderer.stats();
      expect(stats.fullRenders).toBe(1);
      expect(stats.deltaRenders).toBe(0);
    });

    it('should do delta render on subsequent renders with small changes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // First render
      renderer.render(Text({}, 'AAAA'));

      // Second render with small change
      renderer.render(Text({}, 'AAAB'));

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(2);
      expect(stats.fullRenders).toBe(1); // Only first render is full
      expect(stats.deltaRenders).toBe(1); // Second render is delta
    });

    it('should handle resize', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      renderer.resize(80, 24);
      const stats = renderer.stats();
      expect(stats.totalCells).toBe(80 * 24);
    });

    it('should clear the screen', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      renderer.clear();

      // Should write clear sequence
      expect(mockStdout.write).toHaveBeenCalledWith(
        expect.stringContaining('\x1b[2J')
      );
    });
  });

  describe('rendering nested components', () => {
    it('should render Box with children', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column' },
        Text({}, 'Line 1'),
        Text({}, 'Line 2')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render Box with border', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { borderStyle: 'single', width: 10, height: 3 },
        Text({}, 'Hi')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render with colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ color: 'red', bold: true }, 'Colored');

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render with background colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { backgroundColor: 'blue' },
        Text({ color: 'white' }, 'On Blue')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('performance characteristics', () => {
    it('should report low update percentage for small changes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // First render (full)
      renderer.render(Text({}, 'AAAAAAAAAA'));

      // Second render (delta - only one char changed)
      renderer.render(Text({}, 'AAAAAAAAAB'));

      const stats = renderer.stats();
      // Should be a small percentage
      expect(stats.updatePercentage).toBeLessThan(50);
    });

    it('should fall back to full render when many cells change', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // First render
      renderer.render(Text({}, 'A'.repeat(100)));

      // Second render with completely different content
      renderer.render(Text({}, 'B'.repeat(100)));

      const stats = renderer.stats();
      // With >50% change, should do full render
      expect(stats.fullRenders).toBeGreaterThanOrEqual(1);
    });
  });

  describe('semantic theme colors', () => {
    it('should render primary color', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ color: 'primary' }, 'Primary Text');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render success, warning, error colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column' },
        Text({ color: 'success' }, 'Success'),
        Text({ color: 'warning' }, 'Warning'),
        Text({ color: 'error' }, 'Error')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render muted and foreground colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column' },
        Text({ color: 'muted' }, 'Muted'),
        Text({ color: 'foreground' }, 'Foreground')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('text attributes', () => {
    it('should render bold text', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ bold: true }, 'Bold Text');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render italic and underline text', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column' },
        Text({ italic: true }, 'Italic'),
        Text({ underline: true }, 'Underline'),
        Text({ strikethrough: true }, 'Strikethrough')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render combined text attributes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text(
        { bold: true, italic: true, underline: true, color: 'primary' },
        'Styled Text'
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('padding and layout', () => {
    it('should render Box with padding', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { padding: 2, borderStyle: 'single' },
        Text({}, 'Padded Content')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render Box with asymmetric padding', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { paddingX: 4, paddingY: 1, borderStyle: 'round' },
        Text({}, 'Asymmetric Padding')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render nested boxes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column', padding: 1 },
        Box(
          { borderStyle: 'single' },
          Text({}, 'Inner Box 1')
        ),
        Box(
          { borderStyle: 'round' },
          Text({}, 'Inner Box 2')
        )
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('border styles', () => {
    const borderStyles = ['single', 'double', 'round', 'bold', 'classic'] as const;

    for (const style of borderStyles) {
      it(`should render ${style} border`, () => {
        const renderer = createDeltaRenderer({
          stdout: mockStdout as unknown as NodeJS.WriteStream,
          showCursor: true,
        });

        const node: VNode = Box(
          { borderStyle: style, width: 15, height: 3 },
          Text({}, 'Border')
        );

        renderer.render(node);
        expect(mockStdout.write).toHaveBeenCalled();
      });
    }

    it('should render border with color', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { borderStyle: 'single', borderColor: 'primary', width: 15, height: 3 },
        Text({}, 'Colored Border')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('text wrapping', () => {
    it('should handle long text within width', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { width: 20 },
        Text({}, 'This is a long text that should wrap or truncate')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle truncate mode', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { width: 15 },
        Text({ wrap: 'truncate' }, 'This text should be truncated')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle truncate-start mode', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { width: 15 },
        Text({ wrap: 'truncate-start' }, 'This text should be truncated at start')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle truncate-middle mode', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { width: 15 },
        Text({ wrap: 'truncate-middle' }, 'This text should be truncated in the middle')
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('multiple sequential renders', () => {
    it('should handle many sequential renders without errors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // Simulate many rapid updates (like a counter)
      for (let i = 0; i < 20; i++) {
        renderer.render(Text({}, `Count: ${i}`));
      }

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(20);
      // First is full, rest should be delta
      expect(stats.fullRenders).toBe(1);
      expect(stats.deltaRenders).toBe(19);
    });

    it('should handle style-only changes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // First render
      renderer.render(Text({ color: 'primary' }, 'Same Text'));

      // Second render - same text, different color
      renderer.render(Text({ color: 'success' }, 'Same Text'));

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(2);
    });

    it('should handle layout changes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      // First render - vertical
      renderer.render(
        Box(
          { flexDirection: 'column' },
          Text({}, 'A'),
          Text({}, 'B')
        )
      );

      // Second render - horizontal
      renderer.render(
        Box(
          { flexDirection: 'row' },
          Text({}, 'A'),
          Text({}, ' '),
          Text({}, 'B')
        )
      );

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(2);
    });
  });

  describe('hex and rgb colors', () => {
    it('should render hex colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ color: '#ff6600' }, 'Orange Text');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render short hex colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ color: '#f60' }, 'Short Hex');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render rgb colors', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({ color: 'rgb(255, 100, 50)' }, 'RGB Color');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });

  describe('complex scenarios', () => {
    it('should render a dashboard-like layout', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box(
        { flexDirection: 'column' },
        Box(
          { borderStyle: 'single', borderColor: 'primary' },
          Text({ bold: true, color: 'primary' }, 'Dashboard')
        ),
        Box(
          { flexDirection: 'row' },
          Box(
            { borderStyle: 'round', width: 20 },
            Text({ color: 'success' }, 'CPU: 45%')
          ),
          Box(
            { borderStyle: 'round', width: 20 },
            Text({ color: 'warning' }, 'MEM: 78%')
          )
        )
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should render a menu-like structure', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const items = ['Home', 'Settings', 'About', 'Exit'];
      const selectedIndex = 1;

      const node: VNode = Box(
        { flexDirection: 'column', padding: 1 },
        ...items.map((item, i) =>
          Text(
            {
              color: i === selectedIndex ? 'primary' : 'muted',
              bold: i === selectedIndex,
            },
            `${i === selectedIndex ? '>' : ' '} ${item}`
          )
        )
      );

      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle selection changes efficiently', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
        useDelta: true,
      });

      const renderMenu = (selectedIndex: number): VNode =>
        Box(
          { flexDirection: 'column' },
          ...['A', 'B', 'C', 'D'].map((item, i) =>
            Text(
              { color: i === selectedIndex ? 'primary' : 'muted' },
              `${i === selectedIndex ? '>' : ' '} ${item}`
            )
          )
        );

      // Navigate through menu
      renderer.render(renderMenu(0));
      renderer.render(renderMenu(1));
      renderer.render(renderMenu(2));
      renderer.render(renderMenu(3));

      const stats = renderer.stats();
      expect(stats.totalRenders).toBe(4);
      // Should use delta for all after first
      expect(stats.deltaRenders).toBe(3);
    });
  });

  describe('ANSI text parsing', () => {
    it('should render text with embedded ANSI color codes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      // Text with embedded ANSI codes (like from canvas.render())
      const ansiText = '\x1b[38;2;255;0;0mRed\x1b[0m Normal \x1b[1;32mBold Green\x1b[0m';
      const node: VNode = Text({}, ansiText);
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle 256-color ANSI codes', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const ansiText = '\x1b[38;5;196mColor 196\x1b[0m';
      const node: VNode = Text({}, ansiText);
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle background colors in ANSI', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const ansiText = '\x1b[48;2;0;0;255mBlue BG\x1b[0m';
      const node: VNode = Text({}, ansiText);
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle mixed ANSI and plain text', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const ansiText = 'Start \x1b[31mRed\x1b[0m Middle \x1b[34mBlue\x1b[0m End';
      const node: VNode = Text({}, ansiText);
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should not double-escape ANSI codes when rendering', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      // Render with ANSI
      const ansiText = '\x1b[31mRed\x1b[0m';
      renderer.render(Text({}, ansiText));

      // The output should contain the word "Red" without the escape sequence chars appearing as text
      const writeCall = mockStdout.write.mock.calls.flat().join('');
      // Should contain "Red" as the actual character content
      expect(writeCall).toContain('Red');
      // The escape character \x1b should be present (not doubled as \\x1b)
      expect(writeCall.includes('\x1b')).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle empty text', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, '');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle empty box', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box({ borderStyle: 'single', width: 5, height: 3 });
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle zero dimensions gracefully', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Box({ width: 0, height: 0 }, Text({}, 'Hidden'));
      renderer.render(node);
      // Should not throw
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle special characters', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, '┌─┐│└┘█▓▒░');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });

    it('should handle multiline text', () => {
      const renderer = createDeltaRenderer({
        stdout: mockStdout as unknown as NodeJS.WriteStream,
        showCursor: true,
      });

      const node: VNode = Text({}, 'Line 1\nLine 2\nLine 3');
      renderer.render(node);
      expect(mockStdout.write).toHaveBeenCalled();
    });
  });
});
