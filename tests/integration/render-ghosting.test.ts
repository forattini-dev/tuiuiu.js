/**
 * Integration tests for render ghosting prevention
 *
 * These tests simulate real UI scenarios where content changes dynamically
 * and verify that old content doesn't leave visual artifacts (ghosting).
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderOnce } from '../../src/app/render-loop.js';
import { Box, Text } from '../../src/primitives/nodes.js';
import { Tabs, createTabs } from '../../src/molecules/tabs.js';
import { Select, createSelect } from '../../src/molecules/select.js';
import { Collapsible, createCollapsible } from '../../src/molecules/collapsible.js';
import { Modal } from '../../src/organisms/modal.js';
import { createLogUpdate } from '../../src/utils/log-update.js';
import { stringWidth } from '../../src/utils/text-utils.js';
import { Writable } from 'node:stream';

// =============================================================================
// Test Utilities
// =============================================================================

/**
 * Creates a mock stream that captures output
 */
function createMockStream(): Writable & { output: string } {
  let output = '';
  const stream = new Writable({
    write(chunk, encoding, callback) {
      output += chunk.toString();
      callback();
    },
  });
  Object.defineProperty(stream, 'output', {
    get: () => output,
    set: (v: string) => { output = v; },
  });
  return stream as any;
}

/**
 * Simulates a terminal buffer and applies ANSI escape sequences.
 * Returns the final visible content after all escape sequences are processed.
 */
function simulateTerminal(ansiOutput: string, width = 80, height = 24): string[] {
  const buffer: string[][] = [];
  for (let y = 0; y < height; y++) {
    buffer.push(new Array(width).fill(' '));
  }

  let cursorX = 0;
  let cursorY = 0;
  let i = 0;

  while (i < ansiOutput.length) {
    if (ansiOutput[i] === '\u001B' && ansiOutput[i + 1] === '[') {
      let j = i + 2;
      while (j < ansiOutput.length && !/[A-Za-z]/.test(ansiOutput[j])) {
        j++;
      }
      const seq = ansiOutput.slice(i + 2, j);
      const cmd = ansiOutput[j];

      if (cmd === 'H' && seq === '') {
        cursorX = 0;
        cursorY = 0;
      } else if (cmd === 'K') {
        for (let x = cursorX; x < width; x++) {
          buffer[cursorY][x] = ' ';
        }
      } else if (cmd === 'J') {
        for (let x = cursorX; x < width; x++) {
          buffer[cursorY][x] = ' ';
        }
        for (let y = cursorY + 1; y < height; y++) {
          for (let x = 0; x < width; x++) {
            buffer[y][x] = ' ';
          }
        }
      } else if (cmd === 'm') {
        // SGR - ignore for content test
      }

      i = j + 1;
      continue;
    }

    if (ansiOutput[i] === '\n') {
      cursorX = 0;
      cursorY++;
      i++;
      continue;
    }

    if (cursorY < height && cursorX < width) {
      buffer[cursorY][cursorX] = ansiOutput[i];
      cursorX++;
    }
    i++;
  }

  return buffer.map(row => row.join('').trimEnd());
}

/**
 * Renders a component and returns visible lines
 */
function renderToLines(node: ReturnType<typeof Box>, width = 80): string[] {
  const output = renderOnce(node, width);
  return output.split('\n');
}

/**
 * Simulates multiple renders and returns the final terminal state
 */
function simulateRenderSequence(renders: string[], width = 80): string[] {
  const stream = createMockStream();
  const log = createLogUpdate(stream, { incremental: false, showCursor: true });

  for (const content of renders) {
    log(content);
  }

  return simulateTerminal(stream.output, width);
}

// =============================================================================
// Component Rendering Tests
// =============================================================================

describe('UI Component Ghosting Prevention', () => {
  describe('Tab switching', () => {
    it('clears content when switching from long tab to short tab', () => {
      // Tab 1: Long content
      const tab1Content = Box({ flexDirection: 'column' },
        Text({}, 'This is a very long content in tab 1'),
        Text({}, 'With multiple lines of text'),
        Text({}, 'And even more content here'),
        Text({}, 'Fourth line of content'),
        Text({}, 'Fifth line of content')
      );

      // Tab 2: Short content
      const tab2Content = Box({ flexDirection: 'column' },
        Text({}, 'Short'),
        Text({}, 'Tab 2')
      );

      const tab1Output = renderOnce(tab1Content, 80);
      const tab2Output = renderOnce(tab2Content, 80);

      // Simulate switching tabs
      const finalState = simulateRenderSequence([tab1Output, tab2Output], 80);

      // Verify no ghost content from tab 1
      expect(finalState[0]).toBe('Short');
      expect(finalState[1]).toBe('Tab 2');
      expect(finalState[2]).toBe(''); // Should be empty
      expect(finalState[3]).toBe(''); // Should be empty
      expect(finalState[4]).toBe(''); // Should be empty

      // No remnants of tab 1 content
      expect(finalState.join('\n')).not.toContain('very long');
      expect(finalState.join('\n')).not.toContain('multiple lines');
      expect(finalState.join('\n')).not.toContain('Fourth');
      expect(finalState.join('\n')).not.toContain('Fifth');
    });

    it('clears content when switching from wide tab to narrow tab', () => {
      const wideTab = Box({},
        Text({}, 'This is a very wide content that spans many columns horizontally')
      );

      const narrowTab = Box({},
        Text({}, 'Narrow')
      );

      const wideOutput = renderOnce(wideTab, 80);
      const narrowOutput = renderOnce(narrowTab, 80);

      const finalState = simulateRenderSequence([wideOutput, narrowOutput], 80);

      expect(finalState[0]).toBe('Narrow');
      expect(finalState[0]).not.toContain('wide');
      expect(finalState[0]).not.toContain('spans');
    });

    it('handles rapid tab switching correctly', () => {
      const tabs = [
        'Tab 1: AAAAAAAAAAAAAAAAAAAAAA',
        'Tab 2: BB',
        'Tab 3: CCCCCCCCCCCCCCCCCCCCCCCCCCCCC',
        'Tab 4: D',
        'Tab 5: Final content',
      ];

      const finalState = simulateRenderSequence(tabs, 80);

      expect(finalState[0]).toBe('Tab 5: Final content');
      expect(finalState[0]).not.toContain('AAA');
      expect(finalState[0]).not.toContain('CCC');
    });
  });

  describe('Box content changes', () => {
    it('clears when box content shrinks horizontally', () => {
      const largeBox = Box({ borderStyle: 'single', width: 40 },
        Text({}, 'Content inside a large box')
      );

      const smallBox = Box({ borderStyle: 'single', width: 20 },
        Text({}, 'Small')
      );

      const largeOutput = renderOnce(largeBox, 80);
      const smallOutput = renderOnce(smallBox, 80);

      const finalState = simulateRenderSequence([largeOutput, smallOutput], 80);

      // The border characters from the large box should be cleared
      const allContent = finalState.slice(0, 5).join('');
      expect(allContent).not.toContain('Content inside');
    });

    it('clears when box content shrinks vertically', () => {
      const tallBox = Box({ flexDirection: 'column', borderStyle: 'single' },
        Text({}, 'Line 1'),
        Text({}, 'Line 2'),
        Text({}, 'Line 3'),
        Text({}, 'Line 4'),
        Text({}, 'Line 5')
      );

      const shortBox = Box({ flexDirection: 'column', borderStyle: 'single' },
        Text({}, 'Only one')
      );

      const tallOutput = renderOnce(tallBox, 80);
      const shortOutput = renderOnce(shortBox, 80);

      const finalState = simulateRenderSequence([tallOutput, shortOutput], 80);

      // Lines 4-7 should be empty (no ghost lines)
      expect(finalState[4]).toBe('');
      expect(finalState[5]).toBe('');
      expect(finalState[6]).toBe('');

      expect(finalState.join('\n')).not.toContain('Line 3');
      expect(finalState.join('\n')).not.toContain('Line 4');
      expect(finalState.join('\n')).not.toContain('Line 5');
    });

    it('clears nested boxes correctly', () => {
      const nestedLarge = Box({ flexDirection: 'column' },
        Box({ borderStyle: 'single' },
          Text({}, 'Outer box with nested content')
        ),
        Box({ borderStyle: 'double' },
          Text({}, 'Another nested box here')
        )
      );

      const simple = Box({},
        Text({}, 'Simple')
      );

      const nestedOutput = renderOnce(nestedLarge, 80);
      const simpleOutput = renderOnce(simple, 80);

      const finalState = simulateRenderSequence([nestedOutput, simpleOutput], 80);

      expect(finalState[0]).toBe('Simple');
      expect(finalState.join('')).not.toContain('nested');
      expect(finalState.join('')).not.toContain('Outer');
    });
  });

  describe('Dynamic list rendering', () => {
    it('clears when list shrinks', () => {
      const longList = Box({ flexDirection: 'column' },
        Text({}, '1. Item one'),
        Text({}, '2. Item two'),
        Text({}, '3. Item three'),
        Text({}, '4. Item four'),
        Text({}, '5. Item five'),
        Text({}, '6. Item six'),
        Text({}, '7. Item seven'),
        Text({}, '8. Item eight')
      );

      const shortList = Box({ flexDirection: 'column' },
        Text({}, '1. Only'),
        Text({}, '2. Two')
      );

      const longOutput = renderOnce(longList, 80);
      const shortOutput = renderOnce(shortList, 80);

      const finalState = simulateRenderSequence([longOutput, shortOutput], 80);

      expect(finalState[0]).toBe('1. Only');
      expect(finalState[1]).toBe('2. Two');
      expect(finalState[2]).toBe('');
      expect(finalState[3]).toBe('');

      expect(finalState.join('\n')).not.toContain('three');
      expect(finalState.join('\n')).not.toContain('eight');
    });

    it('clears when list items become shorter', () => {
      const wideList = Box({ flexDirection: 'column' },
        Text({}, 'Item: AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'),
        Text({}, 'Item: BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'),
        Text({}, 'Item: CCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCCC')
      );

      const narrowList = Box({ flexDirection: 'column' },
        Text({}, 'A'),
        Text({}, 'B'),
        Text({}, 'C')
      );

      const wideOutput = renderOnce(wideList, 80);
      const narrowOutput = renderOnce(narrowList, 80);

      const finalState = simulateRenderSequence([wideOutput, narrowOutput], 80);

      expect(finalState[0]).toBe('A');
      expect(finalState[1]).toBe('B');
      expect(finalState[2]).toBe('C');

      expect(finalState[0].length).toBe(1);
      expect(finalState[1].length).toBe(1);
    });
  });

  describe('Modal/Overlay scenarios', () => {
    it('clears modal content when closing', () => {
      const withModal = Box({ flexDirection: 'column' },
        Text({}, 'Background'),
        Box({ borderStyle: 'double', padding: 1 },
          Text({}, 'Modal Title'),
          Text({}, 'Modal content that is quite long and verbose'),
          Text({}, 'With multiple lines'),
          Text({}, '[OK] [Cancel]')
        )
      );

      const noModal = Box({},
        Text({}, 'Background')
      );

      const modalOutput = renderOnce(withModal, 80);
      const cleanOutput = renderOnce(noModal, 80);

      const finalState = simulateRenderSequence([modalOutput, cleanOutput], 80);

      expect(finalState[0]).toBe('Background');
      expect(finalState[1]).toBe('');

      expect(finalState.join('\n')).not.toContain('Modal');
      expect(finalState.join('\n')).not.toContain('Cancel');
    });

    it('clears when switching between different sized modals', () => {
      const largeModal = Box({ borderStyle: 'single', width: 50 },
        Text({}, 'Large modal with lots of content'),
        Text({}, 'Line 2'),
        Text({}, 'Line 3'),
        Text({}, 'Line 4')
      );

      const smallModal = Box({ borderStyle: 'single', width: 20 },
        Text({}, 'Small')
      );

      const largeOutput = renderOnce(largeModal, 80);
      const smallOutput = renderOnce(smallModal, 80);

      const finalState = simulateRenderSequence([largeOutput, smallOutput], 80);

      // Large modal content should be gone
      expect(finalState.join('\n')).not.toContain('lots of content');
      expect(finalState.join('\n')).not.toContain('Line 3');
    });
  });

  describe('Collapsible sections', () => {
    it('clears expanded content when collapsing', () => {
      const expanded = Box({ flexDirection: 'column' },
        Text({}, '▼ Section Header'),
        Box({ paddingLeft: 2, flexDirection: 'column' },
          Text({}, 'Expanded content line 1'),
          Text({}, 'Expanded content line 2'),
          Text({}, 'Expanded content line 3'),
          Text({}, 'Expanded content line 4')
        )
      );

      const collapsed = Box({ flexDirection: 'column' },
        Text({}, '▶ Section Header')
      );

      const expandedOutput = renderOnce(expanded, 80);
      const collapsedOutput = renderOnce(collapsed, 80);

      const finalState = simulateRenderSequence([expandedOutput, collapsedOutput], 80);

      expect(finalState[0]).toContain('▶ Section Header');
      expect(finalState[1]).toBe('');
      expect(finalState[2]).toBe('');

      expect(finalState.join('\n')).not.toContain('Expanded content');
    });
  });

  describe('Progress indicators', () => {
    it('clears progress bar when it shrinks', () => {
      const renders = [
        'Progress: [##########          ] 50%',
        'Progress: [####################] 100%',
        'Done!',
      ];

      const finalState = simulateRenderSequence(renders, 80);

      expect(finalState[0]).toBe('Done!');
      expect(finalState[0]).not.toContain('#');
      expect(finalState[0]).not.toContain('Progress');
    });

    it('clears spinner text when changing', () => {
      const renders = [
        '⠋ Loading very long operation in progress...',
        '⠙ Loading...',
        '✓ Done',
      ];

      const finalState = simulateRenderSequence(renders, 80);

      expect(finalState[0]).toBe('✓ Done');
      expect(finalState[0]).not.toContain('Loading');
      expect(finalState[0]).not.toContain('operation');
    });
  });

  describe('Edge cases', () => {
    it('handles empty to content transition', () => {
      const finalState = simulateRenderSequence(['', 'Content'], 80);
      expect(finalState[0]).toBe('Content');
    });

    it('handles content to empty transition', () => {
      const finalState = simulateRenderSequence(['Content that was here', ''], 80);
      expect(finalState[0]).toBe('');
      expect(finalState[0]).not.toContain('Content');
    });

    it('handles unicode/emoji content changes', () => {
      const renders = [
        '🎉 Celebration with lots of emojis! 🎊🎈🎁',
        '👋 Hi',
      ];

      const finalState = simulateRenderSequence(renders, 80);

      expect(finalState[0]).toContain('Hi');
      expect(finalState[0]).not.toContain('Celebration');
      expect(finalState[0]).not.toContain('🎊');
    });

    it('handles ANSI colored content changes', () => {
      const renders = [
        '\u001B[31mRed error message that is very long\u001B[0m',
        '\u001B[32mOK\u001B[0m',
      ];

      const finalState = simulateRenderSequence(renders, 80);

      expect(finalState[0]).toBe('OK');
      expect(finalState[0]).not.toContain('error');
      expect(finalState[0]).not.toContain('message');
    });
  });
});
