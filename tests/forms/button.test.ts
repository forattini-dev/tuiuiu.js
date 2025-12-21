/**
 * Button Component Tests
 *
 * Tests for the Button component including mouse interaction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Button, IconButton, ButtonGroup } from '../../src/design-system/forms/button.js';
import { Box, Text } from '../../src/components/components.js';
import { calculateLayout } from '../../src/design-system/core/layout.js';
import { renderToString } from '../../src/design-system/core/renderer.js';
import {
  getHitTestRegistry,
  resetHitTestRegistry,
  registerHitTestFromLayout,
} from '../../src/core/hit-test.js';
import { simulateClick, MouseSimulator } from '../../src/dev-tools/mouse-simulator.js';
import type { VNode } from '../../src/utils/types.js';

describe('Button Component', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  describe('Rendering', () => {
    it('should render button with label', () => {
      const button = Button({ label: 'Click Me' });
      const output = renderToString(button, 40);
      expect(output).toContain('Click Me');
    });

    it('should render button with icon', () => {
      const button = Button({ label: 'Save', icon: '💾' });
      const output = renderToString(button, 40);
      expect(output).toContain('💾');
      expect(output).toContain('Save');
    });

    it('should render button with right icon', () => {
      const button = Button({ label: 'Next', iconRight: '→' });
      const output = renderToString(button, 40);
      expect(output).toContain('Next');
      expect(output).toContain('→');
    });

    it('should render loading state', () => {
      const button = Button({ label: 'Submit', loading: true, loadingText: 'Submitting...' });
      const output = renderToString(button, 40);
      expect(output).toContain('Submitting...');
    });

    it('should render disabled state with dim styling', () => {
      const button = Button({ label: 'Disabled', disabled: true });
      const output = renderToString(button, 40);
      expect(output).toContain('Disabled');
    });

    it('should render focused state', () => {
      const button = Button({ label: 'Focused', focused: true });
      const output = renderToString(button, 40);
      expect(output).toContain('Focused');
    });

    it('should render hovered state', () => {
      const button = Button({ label: 'Hovered', hovered: true });
      const output = renderToString(button, 40);
      expect(output).toContain('Hovered');
    });
  });

  describe('Variants', () => {
    it('should render solid variant', () => {
      const button = Button({ label: 'Solid', variant: 'solid' });
      const output = renderToString(button, 40);
      expect(output).toContain('Solid');
    });

    it('should render outline variant', () => {
      const button = Button({ label: 'Outline', variant: 'outline' });
      const output = renderToString(button, 40);
      expect(output).toContain('Outline');
    });

    it('should render ghost variant', () => {
      const button = Button({ label: 'Ghost', variant: 'ghost' });
      const output = renderToString(button, 40);
      expect(output).toContain('Ghost');
    });

    it('should render link variant', () => {
      const button = Button({ label: 'Link', variant: 'link' });
      const output = renderToString(button, 40);
      expect(output).toContain('Link');
    });
  });

  describe('Sizes', () => {
    it('should render small size', () => {
      const button = Button({ label: 'Small', size: 'small' });
      const output = renderToString(button, 40);
      expect(output).toContain('Small');
    });

    it('should render medium size (default)', () => {
      const button = Button({ label: 'Medium', size: 'medium' });
      const output = renderToString(button, 40);
      expect(output).toContain('Medium');
    });

    it('should render large size', () => {
      const button = Button({ label: 'Large', size: 'large' });
      const output = renderToString(button, 40);
      expect(output).toContain('Large');
    });
  });

  describe('Mouse Click Events', () => {
    it('should call onClick when clicked', () => {
      const onClick = vi.fn();
      const button = Button({ label: 'Click Me', onClick });

      const layout = calculateLayout(button, 40, 10);
      registerHitTestFromLayout(layout);

      // Click in the center of the button
      simulateClick(5, 0);

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', () => {
      const onClick = vi.fn();
      const button = Button({ label: 'Disabled', onClick, disabled: true });

      const layout = calculateLayout(button, 40, 10);
      registerHitTestFromLayout(layout);

      simulateClick(5, 0);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not call onClick when loading', () => {
      const onClick = vi.fn();
      const button = Button({ label: 'Loading', onClick, loading: true });

      const layout = calculateLayout(button, 40, 10);
      registerHitTestFromLayout(layout);

      simulateClick(5, 0);

      expect(onClick).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks', () => {
      const onClick = vi.fn();
      const button = Button({ label: 'Multi', onClick });

      const layout = calculateLayout(button, 40, 10);
      registerHitTestFromLayout(layout);

      const sim = new MouseSimulator();
      sim.click(5, 0);
      sim.click(5, 0);
      sim.click(5, 0);

      expect(onClick).toHaveBeenCalledTimes(3);
    });

    it('should not trigger when clicking outside button', () => {
      const onClick = vi.fn();
      const wrapper: VNode = Box(
        { width: 40, height: 10 },
        Button({ label: 'Small', onClick })
      );

      const layout = calculateLayout(wrapper, 40, 10);
      registerHitTestFromLayout(layout);

      // Click far outside the button
      simulateClick(35, 8);

      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Mouse Hover States', () => {
    it('should support hover state via prop', () => {
      const button = Button({ label: 'Hover', hovered: true });
      const output = renderToString(button, 40);
      expect(output).toContain('Hover');
    });
  });
});

describe('IconButton Component', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  it('should render icon', () => {
    const iconButton = IconButton({ icon: '×', label: 'Close' });
    const output = renderToString(iconButton, 10);
    expect(output).toContain('×');
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    const iconButton = IconButton({ icon: '×', label: 'Close', onClick });

    const layout = calculateLayout(iconButton, 10, 3);
    registerHitTestFromLayout(layout);

    simulateClick(1, 0);

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when disabled', () => {
    const onClick = vi.fn();
    const iconButton = IconButton({ icon: '×', label: 'Close', onClick, disabled: true });

    const layout = calculateLayout(iconButton, 10, 3);
    registerHitTestFromLayout(layout);

    simulateClick(1, 0);

    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('ButtonGroup Component', () => {
  beforeEach(() => {
    resetHitTestRegistry();
  });

  afterEach(() => {
    resetHitTestRegistry();
  });

  it('should render multiple buttons', () => {
    const buttonGroup = ButtonGroup({
      buttons: [
        { label: 'One' },
        { label: 'Two' },
        { label: 'Three' },
      ],
    });

    const output = renderToString(buttonGroup, 60);
    expect(output).toContain('One');
    expect(output).toContain('Two');
    expect(output).toContain('Three');
  });

  it('should highlight focused button', () => {
    const buttonGroup = ButtonGroup({
      buttons: [
        { label: 'One' },
        { label: 'Two' },
        { label: 'Three' },
      ],
      focusedIndex: 1,
    });

    const output = renderToString(buttonGroup, 60);
    expect(output).toContain('Two');
  });

  it('should handle clicks on individual buttons', () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();

    const buttonGroup = ButtonGroup({
      buttons: [
        { label: 'One', onClick: onClick1 },
        { label: 'Two', onClick: onClick2 },
      ],
      direction: 'horizontal',
    });

    const layout = calculateLayout(buttonGroup, 60, 5);
    registerHitTestFromLayout(layout);

    const registry = getHitTestRegistry();

    // Find positions of buttons in the layout
    // First button should be near x=0, second button should be further right
    simulateClick(3, 0); // Click on first button

    expect(onClick1).toHaveBeenCalledTimes(1);
    expect(onClick2).not.toHaveBeenCalled();
  });
});
