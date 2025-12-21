/**
 * Visual Components Tests
 *
 * Tests for BigText, Digits, Tooltip and related components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  BigText,
  FigletText,
  BigTitle,
  Logo,
} from '../../src/design-system/visual/big-text.js';
import {
  Digits,
  Clock,
  Counter,
  Countdown,
  Stopwatch,
  DigitRoll,
  Score,
} from '../../src/design-system/visual/digits.js';
import {
  Tooltip,
  WithTooltip,
  HelpTooltip,
  InfoBox,
  Popover,
  Badge,
  Tag,
} from '../../src/design-system/visual/tooltip.js';
import { Text, Box } from '../../src/components/components.js';
import { setRenderMode } from '../../src/core/capabilities.js';

describe('Visual Components', () => {
  beforeEach(() => {
    setRenderMode('unicode');
  });

  // ==========================================================================
  // BigText
  // ==========================================================================

  describe('BigText', () => {
    it('renders text with default font', () => {
      const node = BigText({ text: 'Hi' });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders text with block font', () => {
      const node = BigText({ text: 'A', font: 'block' });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      expect(output).toContain('█');
    });

    it('renders text with slant font', () => {
      const node = BigText({ text: 'X', font: 'slant' });
      expect(node).not.toBeNull();
    });

    it('renders text with small font', () => {
      const node = BigText({ text: 'ABC', font: 'small' });
      expect(node).not.toBeNull();
    });

    it('renders text with mini font', () => {
      const node = BigText({ text: '123', font: 'mini' });
      expect(node).not.toBeNull();
    });

    it('renders text with banner font', () => {
      const node = BigText({ text: 'GO', font: 'banner' });
      expect(node).not.toBeNull();
    });

    it('renders text with standard font', () => {
      const node = BigText({ text: 'TEST', font: 'standard' });
      expect(node).not.toBeNull();
    });

    it('applies color to BigText', () => {
      const node = BigText({ text: 'Hi', color: 'cyan' });
      expect(node).not.toBeNull();
    });

    it('applies gradient colors', () => {
      const node = BigText({ text: 'Hi', gradient: ['red', 'blue'] });
      expect(node).not.toBeNull();
    });

    it('handles empty text', () => {
      const node = BigText({ text: '' });
      expect(node).not.toBeNull();
    });

    it('handles text alignment', () => {
      const nodeLeft = BigText({ text: 'Hi', align: 'left' });
      const nodeCenter = BigText({ text: 'Hi', align: 'center' });
      const nodeRight = BigText({ text: 'Hi', align: 'right' });
      expect(nodeLeft).not.toBeNull();
      expect(nodeCenter).not.toBeNull();
      expect(nodeRight).not.toBeNull();
    });
  });

  describe('FigletText', () => {
    it('renders FigletText', () => {
      const node = FigletText({ text: 'Hello' });
      expect(node).not.toBeNull();
    });

    it('renders with border', () => {
      const node = FigletText({ text: 'Hi', borderStyle: 'round' });
      expect(node).not.toBeNull();
    });
  });

  describe('BigTitle', () => {
    it('renders BigTitle with subtitle', () => {
      const node = BigTitle({ title: 'Main', subtitle: 'Sub' });
      expect(node).not.toBeNull();
      // BigTitle renders title as big text, subtitle may be normal text below
      const output = renderToString(node);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders BigTitle without subtitle', () => {
      const node = BigTitle({ title: 'Only Title' });
      expect(node).not.toBeNull();
    });
  });

  describe('Logo', () => {
    it('renders Logo with text', () => {
      const node = Logo({ text: 'LOGO' });
      expect(node).not.toBeNull();
    });

    it('renders Logo with tagline', () => {
      const node = Logo({ text: 'BRAND', tagline: 'Best Product' });
      expect(node).not.toBeNull();
    });

    it('renders Logo with border', () => {
      const node = Logo({ text: 'APP', borderStyle: 'double' });
      expect(node).not.toBeNull();
    });
  });

  // ==========================================================================
  // Digits
  // ==========================================================================

  describe('Digits', () => {
    it('renders digits with default style', () => {
      const node = Digits({ value: '123' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders digits with lcd style', () => {
      const node = Digits({ value: '456', style: 'lcd' });
      expect(node).not.toBeNull();
    });

    it('renders digits with block style', () => {
      const node = Digits({ value: '789', style: 'block' });
      expect(node).not.toBeNull();
    });

    it('renders digits with dotmatrix style', () => {
      const node = Digits({ value: '0', style: 'dotmatrix' });
      expect(node).not.toBeNull();
    });

    it('renders digits with minimal style', () => {
      const node = Digits({ value: '99', style: 'minimal' });
      expect(node).not.toBeNull();
    });

    it('renders digits with color', () => {
      const node = Digits({ value: '42', color: 'green' });
      expect(node).not.toBeNull();
    });

    it('handles special characters like colon', () => {
      const node = Digits({ value: '12:34' });
      expect(node).not.toBeNull();
    });

    it('handles decimal point', () => {
      const node = Digits({ value: '3.14' });
      expect(node).not.toBeNull();
    });

    it('handles negative numbers', () => {
      const node = Digits({ value: '-5' });
      expect(node).not.toBeNull();
    });
  });

  describe('Clock', () => {
    it('renders Clock with current time', () => {
      const node = Clock({ time: new Date() });
      expect(node).not.toBeNull();
    });

    it('renders Clock with specific time', () => {
      const node = Clock({ time: new Date(2024, 0, 1, 12, 30, 45) });
      expect(node).not.toBeNull();
    });

    it('renders Clock without seconds', () => {
      const node = Clock({ time: new Date(), showSeconds: false });
      expect(node).not.toBeNull();
    });

    it('renders Clock in 12-hour format', () => {
      const node = Clock({ time: new Date(), format12: true });
      expect(node).not.toBeNull();
    });
  });

  describe('Counter', () => {
    it('renders Counter with value', () => {
      const node = Counter({ value: 100 });
      expect(node).not.toBeNull();
    });

    it('renders Counter with label', () => {
      const node = Counter({ value: 50, label: 'Items' });
      expect(node).not.toBeNull();
    });

    it('renders Counter with prefix and suffix', () => {
      const node = Counter({ value: 99, prefix: '$', suffix: '.00' });
      expect(node).not.toBeNull();
    });
  });

  describe('Countdown', () => {
    it('renders Countdown with seconds', () => {
      const node = Countdown({ seconds: 60 });
      expect(node).not.toBeNull();
    });

    it('renders Countdown with target date', () => {
      const future = new Date(Date.now() + 3600000);
      const node = Countdown({ target: future });
      expect(node).not.toBeNull();
    });

    it('renders Countdown without showDays', () => {
      const node = Countdown({ seconds: 3600, showDays: false });
      expect(node).not.toBeNull();
    });
  });

  describe('Stopwatch', () => {
    it('renders Stopwatch with elapsed time', () => {
      const node = Stopwatch({ elapsed: 65000 });
      expect(node).not.toBeNull();
    });

    it('renders Stopwatch with running state', () => {
      const node = Stopwatch({ elapsed: 1000, running: true });
      expect(node).not.toBeNull();
    });

    it('renders Stopwatch with lap times', () => {
      const node = Stopwatch({ elapsed: 5000, laps: [1000, 2000, 2000] });
      expect(node).not.toBeNull();
    });
  });

  describe('DigitRoll', () => {
    it('renders DigitRoll with value', () => {
      const node = DigitRoll({ value: 42 });
      expect(node).not.toBeNull();
    });

    it('renders DigitRoll with previous value', () => {
      const node = DigitRoll({ value: 10, previousValue: 9 });
      expect(node).not.toBeNull();
    });
  });

  describe('Score', () => {
    it('renders Score with single score', () => {
      const node = Score({ score: 1000 });
      expect(node).not.toBeNull();
    });

    it('renders Score with home and away', () => {
      const node = Score({ home: 3, away: 2 });
      expect(node).not.toBeNull();
    });

    it('renders Score with labels', () => {
      const node = Score({ home: 1, away: 0, homeLabel: 'Team A', awayLabel: 'Team B' });
      expect(node).not.toBeNull();
    });
  });

  // ==========================================================================
  // Tooltip
  // ==========================================================================

  describe('Tooltip', () => {
    it('renders visible tooltip', () => {
      const node = Tooltip({ content: 'Help text', visible: true });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      expect(output).toContain('Help text');
    });

    it('returns null when not visible', () => {
      const node = Tooltip({ content: 'Hidden', visible: false });
      expect(node).toBeNull();
    });

    it('renders tooltip at different positions', () => {
      const top = Tooltip({ content: 'Top', position: 'top', visible: true });
      const bottom = Tooltip({ content: 'Bottom', position: 'bottom', visible: true });
      const left = Tooltip({ content: 'Left', position: 'left', visible: true });
      const right = Tooltip({ content: 'Right', position: 'right', visible: true });

      expect(top).not.toBeNull();
      expect(bottom).not.toBeNull();
      expect(left).not.toBeNull();
      expect(right).not.toBeNull();
    });

    it('renders tooltip with arrow', () => {
      const node = Tooltip({ content: 'With arrow', arrow: true, visible: true });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      // Arrow should be present (unicode or ascii)
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders tooltip without arrow', () => {
      const node = Tooltip({ content: 'No arrow', arrow: false, visible: true });
      expect(node).not.toBeNull();
    });

    it('renders tooltip with VNode content', () => {
      const content = Text({ bold: true }, 'Bold content');
      const node = Tooltip({ content, visible: true });
      expect(node).not.toBeNull();
    });

    it('renders tooltip with custom border style', () => {
      const node = Tooltip({
        content: 'Styled',
        borderStyle: 'double',
        borderColor: 'cyan',
        visible: true,
      });
      expect(node).not.toBeNull();
    });
  });

  describe('WithTooltip', () => {
    it('renders child with tooltip when active', () => {
      const node = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Click me',
        active: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('Button');
      expect(output).toContain('Click me');
    });

    it('renders only child when not active', () => {
      const node = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Hidden tooltip',
        active: false,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('Button');
      expect(output).not.toContain('Hidden tooltip');
    });

    it('renders with different positions', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const;
      for (const position of positions) {
        const node = WithTooltip({
          children: Text({}, 'Target'),
          tooltip: 'Tip',
          position,
          active: true,
        });
        expect(node).not.toBeNull();
      }
    });
  });

  describe('HelpTooltip', () => {
    it('renders help icon with tooltip when active', () => {
      const node = HelpTooltip({
        text: 'Help information',
        active: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('?');
      expect(output).toContain('Help information');
    });

    it('renders only icon when not active', () => {
      const node = HelpTooltip({
        text: 'Hidden help',
        active: false,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('?');
      expect(output).not.toContain('Hidden help');
    });

    it('renders with custom icon', () => {
      const node = HelpTooltip({
        text: 'Info',
        icon: 'i',
        active: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('[i]');
    });
  });

  describe('InfoBox', () => {
    it('renders info box with message', () => {
      const node = InfoBox({ message: 'Information here' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('Information here');
    });

    it('renders different types', () => {
      const types = ['info', 'warning', 'error', 'success', 'tip'] as const;
      for (const type of types) {
        const node = InfoBox({ message: `${type} message`, type });
        expect(node).not.toBeNull();
      }
    });

    it('renders with title', () => {
      const node = InfoBox({ message: 'Content', title: 'Title' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('Title');
    });

    it('renders without icon', () => {
      const node = InfoBox({ message: 'No icon', showIcon: false });
      expect(node).not.toBeNull();
    });

    it('renders with VNode message', () => {
      const message = Box({}, Text({ bold: true }, 'Bold'), Text({}, ' normal'));
      const node = InfoBox({ message });
      expect(node).not.toBeNull();
    });
  });

  describe('Popover', () => {
    it('renders visible popover', () => {
      const content = Text({}, 'Popover content');
      const node = Popover({ content, visible: true });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      expect(output).toContain('Popover content');
    });

    it('returns null when not visible', () => {
      const content = Text({}, 'Hidden');
      const node = Popover({ content, visible: false });
      expect(node).toBeNull();
    });

    it('renders at different positions', () => {
      const positions = ['top', 'bottom', 'left', 'right'] as const;
      for (const position of positions) {
        const node = Popover({
          content: Text({}, 'Content'),
          position,
          visible: true,
        });
        expect(node).not.toBeNull();
      }
    });

    it('renders with arrow', () => {
      const node = Popover({
        content: Text({}, 'With arrow'),
        arrow: true,
        visible: true,
      });
      expect(node).not.toBeNull();
    });

    it('renders without arrow', () => {
      const node = Popover({
        content: Text({}, 'No arrow'),
        arrow: false,
        visible: true,
      });
      expect(node).not.toBeNull();
    });
  });

  describe('Badge', () => {
    it('renders badge with text', () => {
      const node = Badge({ text: 'NEW' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('NEW');
    });

    it('renders solid variant', () => {
      const node = Badge({ text: '5', variant: 'solid', color: 'red' });
      expect(node).not.toBeNull();
    });

    it('renders outline variant', () => {
      const node = Badge({ text: 'OK', variant: 'outline', color: 'green' });
      expect(node).not.toBeNull();
    });

    it('renders subtle variant (default)', () => {
      const node = Badge({ text: 'INFO', variant: 'subtle' });
      expect(node).not.toBeNull();
    });
  });

  describe('Tag', () => {
    it('renders tag with label', () => {
      const node = Tag({ label: 'TypeScript' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      expect(output).toContain('TypeScript');
    });

    it('renders tag with color', () => {
      const node = Tag({ label: 'React', color: 'cyan' });
      expect(node).not.toBeNull();
    });

    it('renders removable tag', () => {
      const node = Tag({ label: 'Deletable', removable: true });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      // Should have remove indicator
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders non-removable tag', () => {
      const node = Tag({ label: 'Fixed', removable: false });
      expect(node).not.toBeNull();
    });
  });

  // ==========================================================================
  // ASCII Mode
  // ==========================================================================

  describe('ASCII Mode', () => {
    beforeEach(() => {
      setRenderMode('ascii');
    });

    it('renders BigText in ASCII mode', () => {
      const node = BigText({ text: 'ABC', font: 'block' });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      // Just verify it renders
      expect(output.length).toBeGreaterThan(0);
    });

    it('renders Digits in ASCII mode', () => {
      const node = Digits({ value: '123', style: 'lcd' });
      expect(node).not.toBeNull();
    });

    it('renders Tooltip arrows in ASCII mode', () => {
      const node = Tooltip({
        content: 'Test',
        position: 'top',
        arrow: true,
        visible: true,
      });
      expect(node).not.toBeNull();
      const output = renderToString(node!);
      // Verify output contains arrow (^ for top in ASCII)
      expect(output).toContain('^');
    });

    it('renders InfoBox icons in ASCII mode', () => {
      const node = InfoBox({ message: 'Test', type: 'info' });
      expect(node).not.toBeNull();
      const output = renderToString(node);
      // ASCII info icon should be 'i'
      expect(output).toContain('i');
    });
  });
});
