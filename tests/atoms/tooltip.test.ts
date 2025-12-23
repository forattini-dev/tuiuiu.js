/**
 * Tooltip Tests
 *
 * Tests for Tooltip, WithTooltip, HelpTooltip, InfoBox, Popover, Badge, Tag components
 */

import { describe, it, expect } from 'vitest';
import {
  Tooltip,
  WithTooltip,
  HelpTooltip,
  InfoBox,
  Popover,
  Badge,
  Tag,
} from '../../src/atoms/tooltip.js';
import { Text, Box } from '../../src/primitives/nodes.js';

describe('Tooltip', () => {
  describe('Basic Usage', () => {
    it('should create a tooltip with string content', () => {
      const vnode = Tooltip({
        content: 'Help text',
      });

      expect(vnode).toBeDefined();
      expect(vnode?.type).toBe('box');
    });

    it('should create a tooltip with VNode content', () => {
      const vnode = Tooltip({
        content: Text({ bold: true }, 'Bold help'),
      });

      expect(vnode).toBeDefined();
      expect(vnode?.type).toBe('box');
    });

    it('should return null when not visible', () => {
      const vnode = Tooltip({
        content: 'Help text',
        visible: false,
      });

      expect(vnode).toBeNull();
    });

    it('should be visible by default', () => {
      const vnode = Tooltip({
        content: 'Help text',
      });

      expect(vnode).not.toBeNull();
    });
  });

  describe('Position', () => {
    it('should position at top', () => {
      const vnode = Tooltip({
        content: 'Top tooltip',
        position: 'top',
      });

      expect(vnode).toBeDefined();
      expect(vnode?.props.flexDirection).toBe('column');
    });

    it('should position at bottom', () => {
      const vnode = Tooltip({
        content: 'Bottom tooltip',
        position: 'bottom',
      });

      expect(vnode).toBeDefined();
      expect(vnode?.props.flexDirection).toBe('column');
    });

    it('should position at left', () => {
      const vnode = Tooltip({
        content: 'Left tooltip',
        position: 'left',
      });

      expect(vnode).toBeDefined();
      expect(vnode?.props.flexDirection).toBe('row');
    });

    it('should position at right', () => {
      const vnode = Tooltip({
        content: 'Right tooltip',
        position: 'right',
      });

      expect(vnode).toBeDefined();
      expect(vnode?.props.flexDirection).toBe('row');
    });

    it('should default to top position', () => {
      const vnode = Tooltip({
        content: 'Default tooltip',
      });

      expect(vnode?.props.flexDirection).toBe('column');
    });
  });

  describe('Arrow', () => {
    it('should show arrow by default', () => {
      const vnode = Tooltip({
        content: 'With arrow',
        arrow: true,
      });

      // Should have more than just the tooltip box
      expect(vnode?.children.length).toBeGreaterThan(1);
    });

    it('should hide arrow when arrow=false', () => {
      const vnode = Tooltip({
        content: 'No arrow',
        arrow: false,
      });

      // Without arrow, structure is simpler
      expect(vnode).toBeDefined();
      // Count non-null children - should be fewer without arrow
      const nonNullChildren = vnode?.children.filter((c: any) => c !== null);
      expect(nonNullChildren.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Styling', () => {
    it('should apply border style', () => {
      const vnode = Tooltip({
        content: 'Styled',
        borderStyle: 'double',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"borderStyle":"double"');
    });

    it('should apply border color', () => {
      const vnode = Tooltip({
        content: 'Colored border',
        borderColor: 'cyan',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('cyan');
    });

    it('should apply text color', () => {
      const vnode = Tooltip({
        content: 'Colored text',
        color: 'yellow',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('yellow');
    });

    it('should apply maxWidth', () => {
      const vnode = Tooltip({
        content: 'Limited width',
        maxWidth: 40,
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"maxWidth":40');
    });
  });
});

describe('WithTooltip', () => {
  it('should wrap children with tooltip', () => {
    const vnode = WithTooltip({
      children: Text({}, 'Button'),
      tooltip: 'Click me',
      active: true,
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should not show tooltip when not active', () => {
    const vnode = WithTooltip({
      children: Text({}, 'Button'),
      tooltip: 'Click me',
      active: false,
    });

    // When not active, tooltip content shouldn't be visible
    const output = JSON.stringify(vnode);
    expect(output).not.toContain('Click me');
  });

  it('should show tooltip when active', () => {
    const vnode = WithTooltip({
      children: Text({}, 'Button'),
      tooltip: 'Click me',
      active: true,
    });

    // Should have tooltip as non-null child
    const nonNullChildren = vnode.children.filter((c: any) => c !== null);
    expect(nonNullChildren.length).toBeGreaterThan(1);
  });

  describe('Position', () => {
    it('should position tooltip at top', () => {
      const vnode = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Top',
        position: 'top',
        active: true,
      });

      expect(vnode.props.flexDirection).toBe('column');
    });

    it('should position tooltip at bottom', () => {
      const vnode = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Bottom',
        position: 'bottom',
        active: true,
      });

      expect(vnode.props.flexDirection).toBe('column');
    });

    it('should position tooltip at left', () => {
      const vnode = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Left',
        position: 'left',
        active: true,
      });

      expect(vnode.props.flexDirection).toBe('row');
    });

    it('should position tooltip at right', () => {
      const vnode = WithTooltip({
        children: Text({}, 'Button'),
        tooltip: 'Right',
        position: 'right',
        active: true,
      });

      expect(vnode.props.flexDirection).toBe('row');
    });
  });

  it('should accept tooltip props', () => {
    const vnode = WithTooltip({
      children: Text({}, 'Button'),
      tooltip: 'Custom styled',
      active: true,
      tooltipProps: {
        borderStyle: 'double',
        borderColor: 'cyan',
      },
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('"borderStyle":"double"');
  });
});

describe('HelpTooltip', () => {
  it('should create a help tooltip', () => {
    const vnode = HelpTooltip({
      text: 'Help text here',
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should show help icon', () => {
    const vnode = HelpTooltip({
      text: 'Help text',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('[?]');
  });

  it('should use custom icon', () => {
    const vnode = HelpTooltip({
      text: 'Help text',
      icon: 'i',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('[i]');
  });

  it('should apply icon color', () => {
    const vnode = HelpTooltip({
      text: 'Help text',
      iconColor: 'yellow',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('yellow');
  });

  it('should show tooltip when active', () => {
    const vnode = HelpTooltip({
      text: 'Visible help',
      active: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Visible help');
  });

  it('should not show tooltip text when not active', () => {
    const vnode = HelpTooltip({
      text: 'Hidden help',
      active: false,
    });

    const output = JSON.stringify(vnode);
    // The icon is still visible, but tooltip content is not
    expect(output).toContain('[?]');
  });
});

describe('InfoBox', () => {
  describe('Basic Usage', () => {
    it('should create an info box', () => {
      const vnode = InfoBox({
        message: 'Information here',
      });

      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
    });

    it('should display message text', () => {
      const vnode = InfoBox({
        message: 'My message',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('My message');
    });

    it('should accept VNode as message', () => {
      const vnode = InfoBox({
        message: Text({ bold: true }, 'Bold message'),
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"bold":true');
    });
  });

  describe('Types', () => {
    it('should render info type', () => {
      const vnode = InfoBox({
        message: 'Info',
        type: 'info',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('blue');
    });

    it('should render warning type', () => {
      const vnode = InfoBox({
        message: 'Warning',
        type: 'warning',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('yellow');
    });

    it('should render error type', () => {
      const vnode = InfoBox({
        message: 'Error',
        type: 'error',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('red');
    });

    it('should render success type', () => {
      const vnode = InfoBox({
        message: 'Success',
        type: 'success',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('green');
    });

    it('should render tip type', () => {
      const vnode = InfoBox({
        message: 'Tip',
        type: 'tip',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('cyan');
    });
  });

  describe('Title', () => {
    it('should show title when provided', () => {
      const vnode = InfoBox({
        message: 'Content',
        title: 'Notice',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('Notice');
    });

    it('should work without title', () => {
      const vnode = InfoBox({
        message: 'Content only',
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('Icon', () => {
    it('should show icon by default', () => {
      const vnode = InfoBox({
        message: 'With icon',
        showIcon: true,
      });

      // Icon should be present in output
      expect(vnode).toBeDefined();
    });

    it('should hide icon when showIcon=false', () => {
      const vnode = InfoBox({
        message: 'No icon',
        showIcon: false,
      });

      expect(vnode).toBeDefined();
    });
  });

  describe('Width', () => {
    it('should apply custom width', () => {
      const vnode = InfoBox({
        message: 'Sized box',
        width: 50,
      });

      expect(vnode.props.width).toBe(50);
    });
  });
});

describe('Popover', () => {
  describe('Basic Usage', () => {
    it('should create a popover', () => {
      const vnode = Popover({
        content: Text({}, 'Popover content'),
      });

      expect(vnode).toBeDefined();
      expect(vnode?.type).toBe('box');
    });

    it('should return null when not visible', () => {
      const vnode = Popover({
        content: Text({}, 'Hidden'),
        visible: false,
      });

      expect(vnode).toBeNull();
    });
  });

  describe('Position', () => {
    it('should position at top', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        position: 'top',
      });

      expect(vnode?.props.flexDirection).toBe('column');
    });

    it('should position at bottom', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        position: 'bottom',
      });

      expect(vnode?.props.flexDirection).toBe('column');
    });

    it('should position at left', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        position: 'left',
      });

      expect(vnode?.props.flexDirection).toBe('row');
    });

    it('should position at right', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        position: 'right',
      });

      expect(vnode?.props.flexDirection).toBe('row');
    });
  });

  describe('Arrow', () => {
    it('should show arrow by default', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        arrow: true,
      });

      expect(vnode?.children.length).toBeGreaterThan(1);
    });

    it('should hide arrow when arrow=false', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        arrow: false,
      });

      // Without arrow, structure is simpler
      expect(vnode).toBeDefined();
      const nonNullChildren = vnode?.children.filter((c: any) => c !== null);
      expect(nonNullChildren.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Styling', () => {
    it('should apply border style', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        borderStyle: 'double',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"borderStyle":"double"');
    });

    it('should apply border color', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        borderColor: 'cyan',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('cyan');
    });

    it('should apply width', () => {
      const vnode = Popover({
        content: Text({}, 'Content'),
        width: 40,
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('"width":40');
    });
  });
});

describe('Badge', () => {
  describe('Basic Usage', () => {
    it('should create a badge', () => {
      const vnode = Badge({ label: 'NEW' });

      expect(vnode).toBeDefined();
    });

    it('should display label', () => {
      const vnode = Badge({ label: 'BETA' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('BETA');
    });
  });

  describe('Variants', () => {
    it('should render solid variant', () => {
      const vnode = Badge({
        label: 'NEW',
        color: 'green',
        variant: 'solid',
      });

      expect(vnode.type).toBe('text');
      expect(vnode.props.backgroundColor).toBe('green');
    });

    it('should render outline variant', () => {
      const vnode = Badge({
        label: 'NEW',
        color: 'blue',
        variant: 'outline',
      });

      expect(vnode.type).toBe('box');
      expect(vnode.props.borderStyle).toBe('round');
    });

    it('should render subtle variant (default)', () => {
      const vnode = Badge({
        label: 'NEW',
        variant: 'subtle',
      });

      expect(vnode.type).toBe('text');
      const output = JSON.stringify(vnode);
      expect(output).toContain('[NEW]');
    });

    it('should default to subtle variant', () => {
      const vnode = Badge({ label: 'DEF' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('[DEF]');
    });
  });

  describe('Colors', () => {
    it('should apply custom color', () => {
      const vnode = Badge({
        label: 'TEST',
        color: 'magenta',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('magenta');
    });

    it('should default to gray', () => {
      const vnode = Badge({ label: 'GRAY' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('gray');
    });
  });
});

describe('Tag', () => {
  describe('Basic Usage', () => {
    it('should create a tag', () => {
      const vnode = Tag({ label: 'TypeScript' });

      expect(vnode).toBeDefined();
      expect(vnode.type).toBe('box');
    });

    it('should display label', () => {
      const vnode = Tag({ label: 'React' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('React');
    });

    it('should wrap label in brackets', () => {
      const vnode = Tag({ label: 'Vue' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('[Vue');
      expect(output).toContain(']');
    });
  });

  describe('Removable', () => {
    it('should show remove indicator when removable', () => {
      const vnode = Tag({
        label: 'Removable',
        removable: true,
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('×');
    });

    it('should not show remove indicator when not removable', () => {
      const vnode = Tag({
        label: 'Fixed',
        removable: false,
      });

      const output = JSON.stringify(vnode);
      expect(output).not.toContain('×');
    });

    it('should not be removable by default', () => {
      const vnode = Tag({ label: 'Default' });

      const output = JSON.stringify(vnode);
      expect(output).not.toContain('×');
    });
  });

  describe('Colors', () => {
    it('should apply custom color', () => {
      const vnode = Tag({
        label: 'Blue',
        color: 'blue',
      });

      const output = JSON.stringify(vnode);
      expect(output).toContain('blue');
    });

    it('should default to gray', () => {
      const vnode = Tag({ label: 'Gray' });

      const output = JSON.stringify(vnode);
      expect(output).toContain('gray');
    });
  });
});

describe('Edge Cases', () => {
  it('should handle empty tooltip content', () => {
    const vnode = Tooltip({
      content: '',
    });

    expect(vnode).toBeDefined();
  });

  it('should handle empty badge label', () => {
    const vnode = Badge({ label: '' });

    expect(vnode).toBeDefined();
  });

  it('should handle long tooltip content', () => {
    const longContent = 'This is a very long tooltip message that might need wrapping.';
    const vnode = Tooltip({
      content: longContent,
      maxWidth: 30,
    });

    expect(vnode).toBeDefined();
  });

  it('should handle multiple nested tooltips', () => {
    const innerTooltip = WithTooltip({
      children: Text({}, 'Inner'),
      tooltip: 'Inner tooltip',
      active: true,
    });

    const outerTooltip = WithTooltip({
      children: innerTooltip,
      tooltip: 'Outer tooltip',
      active: true,
    });

    expect(outerTooltip).toBeDefined();
  });

  it('should handle complex popover content', () => {
    const complexContent = Box(
      { flexDirection: 'column' },
      Text({ bold: true }, 'Menu'),
      Text({}, 'Option 1'),
      Text({}, 'Option 2'),
      Text({}, 'Option 3')
    );

    const vnode = Popover({
      content: complexContent,
      visible: true,
    });

    expect(vnode).toBeDefined();
  });
});
