/**
 * Button Component Tests
 *
 * Tests for the Button component including mouse interaction
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Button, IconButton, ButtonGroup, createButtonGroup } from '../../src/atoms/button.js';
import type { Key } from '../../src/hooks/index.js';
import { Box, Text } from '../../src/primitives/index.js';
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

describe('createButtonGroup - Keyboard Navigation', () => {
  // Helper to create a mock key event
  const mockKey = (overrides: Partial<Key> = {}): Key => ({
    upArrow: false,
    downArrow: false,
    leftArrow: false,
    rightArrow: false,
    return: false,
    escape: false,
    tab: false,
    backspace: false,
    delete: false,
    meta: false,
    ctrl: false,
    shift: false,
    pageUp: false,
    pageDown: false,
    home: false,
    end: false,
    ...overrides,
  });

  it('should initialize with first button focused', () => {
    const state = createButtonGroup({
      buttons: [
        { label: 'One' },
        { label: 'Two' },
        { label: 'Three' },
      ],
    });

    expect(state.focusedIndex()).toBe(0);
  });

  it('should initialize with specified index focused', () => {
    const state = createButtonGroup({
      buttons: [
        { label: 'One' },
        { label: 'Two' },
        { label: 'Three' },
      ],
      initialFocusedIndex: 2,
    });

    expect(state.focusedIndex()).toBe(2);
  });

  it('should skip disabled buttons on initial focus', () => {
    const state = createButtonGroup({
      buttons: [
        { label: 'One', disabled: true },
        { label: 'Two' },
        { label: 'Three' },
      ],
      initialFocusedIndex: 0, // Points to disabled button
    });

    expect(state.focusedIndex()).toBe(1); // Should skip to first enabled
  });

  describe('Horizontal Navigation', () => {
    it('should navigate right with arrow key', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
      });

      expect(state.focusedIndex()).toBe(0);

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(1);

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(2);
    });

    it('should navigate left with arrow key', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
        initialFocusedIndex: 2,
      });

      expect(state.focusedIndex()).toBe(2);

      state.handleInput('', mockKey({ leftArrow: true }));
      expect(state.focusedIndex()).toBe(1);

      state.handleInput('', mockKey({ leftArrow: true }));
      expect(state.focusedIndex()).toBe(0);
    });

    it('should wrap around when reaching end', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
        wrap: true,
        initialFocusedIndex: 2,
      });

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(0); // Wrapped to start
    });

    it('should wrap around when reaching start', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
        wrap: true,
        initialFocusedIndex: 0,
      });

      state.handleInput('', mockKey({ leftArrow: true }));
      expect(state.focusedIndex()).toBe(2); // Wrapped to end
    });

    it('should not wrap when wrap is false', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
        wrap: false,
        initialFocusedIndex: 2,
      });

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(2); // Stayed at end
    });

    it('should support vim-style h/l navigation', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'horizontal',
      });

      state.handleInput('l', mockKey());
      expect(state.focusedIndex()).toBe(1);

      state.handleInput('l', mockKey());
      expect(state.focusedIndex()).toBe(2);

      state.handleInput('h', mockKey());
      expect(state.focusedIndex()).toBe(1);
    });
  });

  describe('Vertical Navigation', () => {
    it('should navigate down with arrow key', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'vertical',
      });

      expect(state.focusedIndex()).toBe(0);

      state.handleInput('', mockKey({ downArrow: true }));
      expect(state.focusedIndex()).toBe(1);
    });

    it('should navigate up with arrow key', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'vertical',
        initialFocusedIndex: 2,
      });

      state.handleInput('', mockKey({ upArrow: true }));
      expect(state.focusedIndex()).toBe(1);
    });

    it('should support vim-style j/k navigation', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        direction: 'vertical',
      });

      state.handleInput('j', mockKey());
      expect(state.focusedIndex()).toBe(1);

      state.handleInput('k', mockKey());
      expect(state.focusedIndex()).toBe(0);
    });
  });

  describe('Click Triggering', () => {
    it('should trigger onClick with Enter key', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick },
          { label: 'Two' },
        ],
      });

      state.handleInput('', mockKey({ return: true }));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger onClick with Space key', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick },
          { label: 'Two' },
        ],
      });

      state.handleInput(' ', mockKey());
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should trigger correct button onClick', () => {
      const onClick1 = vi.fn();
      const onClick2 = vi.fn();
      const onClick3 = vi.fn();

      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick: onClick1 },
          { label: 'Two', onClick: onClick2 },
          { label: 'Three', onClick: onClick3 },
        ],
      });

      // Navigate to second button and press Enter
      state.handleInput('', mockKey({ rightArrow: true }));
      state.handleInput('', mockKey({ return: true }));

      expect(onClick1).not.toHaveBeenCalled();
      expect(onClick2).toHaveBeenCalledTimes(1);
      expect(onClick3).not.toHaveBeenCalled();
    });

    it('should not trigger onClick on disabled button', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick, disabled: true },
          { label: 'Two' },
        ],
        initialFocusedIndex: 0,
      });

      // Even though first button is "focused", it's disabled
      // so triggerClick should not work
      state.handleInput('', mockKey({ return: true }));
      expect(onClick).not.toHaveBeenCalled();
    });

    it('should not trigger onClick on loading button', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick, loading: true },
          { label: 'Two' },
        ],
        initialFocusedIndex: 0,
      });

      state.handleInput('', mockKey({ return: true }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe('Disabled Button Skipping', () => {
    it('should skip disabled buttons when navigating', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two', disabled: true },
          { label: 'Three' },
        ],
        direction: 'horizontal',
      });

      expect(state.focusedIndex()).toBe(0);

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(2); // Skipped disabled button at index 1
    });

    it('should skip loading buttons when navigating', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two', loading: true },
          { label: 'Three' },
        ],
        direction: 'horizontal',
      });

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(2); // Skipped loading button
    });

    it('should handle all buttons disabled gracefully', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One', disabled: true },
          { label: 'Two', disabled: true },
        ],
      });

      // Should not throw, just stay at current position
      state.handleInput('', mockKey({ rightArrow: true }));
      state.handleInput('', mockKey({ leftArrow: true }));
    });
  });

  describe('Number Key Quick Access', () => {
    it('should focus button with number key 1-9', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
      });

      state.handleInput('2', mockKey());
      expect(state.focusedIndex()).toBe(1); // Index 1 (button 2)

      state.handleInput('3', mockKey());
      expect(state.focusedIndex()).toBe(2); // Index 2 (button 3)

      state.handleInput('1', mockKey());
      expect(state.focusedIndex()).toBe(0); // Index 0 (button 1)
    });

    it('should not focus disabled button with number key', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two', disabled: true },
          { label: 'Three' },
        ],
      });

      state.handleInput('2', mockKey()); // Try to focus disabled button 2
      expect(state.focusedIndex()).toBe(0); // Should stay at 0
    });

    it('should ignore number keys beyond button count', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
        ],
      });

      state.handleInput('5', mockKey()); // No button 5
      expect(state.focusedIndex()).toBe(0); // Should stay at 0
    });
  });

  describe('isActive Control', () => {
    it('should not handle input when isActive is false', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick },
          { label: 'Two' },
        ],
        isActive: false,
      });

      state.handleInput('', mockKey({ return: true }));
      expect(onClick).not.toHaveBeenCalled();

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(state.focusedIndex()).toBe(0); // Didn't move
    });

    it('should support reactive isActive getter', () => {
      let active = true;
      const onClick = vi.fn();

      const state = createButtonGroup({
        buttons: [
          { label: 'One', onClick },
          { label: 'Two' },
        ],
        isActive: () => active,
      });

      // Should work when active
      state.handleInput('', mockKey({ return: true }));
      expect(onClick).toHaveBeenCalledTimes(1);

      // Disable and try again
      active = false;
      state.handleInput('', mockKey({ return: true }));
      expect(onClick).toHaveBeenCalledTimes(1); // Still 1, not called again

      // Re-enable
      active = true;
      state.handleInput('', mockKey({ return: true }));
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe('Focus Change Callback', () => {
    it('should call onFocusChange when focus changes', () => {
      const onFocusChange = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        onFocusChange,
      });

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(onFocusChange).toHaveBeenCalledWith(1);

      state.handleInput('', mockKey({ rightArrow: true }));
      expect(onFocusChange).toHaveBeenCalledWith(2);
    });

    it('should not call onFocusChange when focus stays same', () => {
      const onFocusChange = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
        ],
        wrap: false,
        initialFocusedIndex: 1,
        onFocusChange,
      });

      // Try to go right at end with no wrap - should stay at 1
      state.handleInput('', mockKey({ rightArrow: true }));
      expect(onFocusChange).not.toHaveBeenCalled();
    });
  });

  describe('Programmatic Control', () => {
    it('should allow setting focus index directly', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
      });

      state.setFocusedIndex(2);
      expect(state.focusedIndex()).toBe(2);
    });

    it('should allow setting focus with updater function', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
      });

      state.setFocusedIndex((prev) => prev + 1);
      expect(state.focusedIndex()).toBe(1);
    });

    it('should allow programmatic click trigger', () => {
      const onClick = vi.fn();
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two', onClick },
          { label: 'Three' },
        ],
        initialFocusedIndex: 1,
      });

      state.triggerClick();
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should allow focusPrev and focusNext methods', () => {
      const state = createButtonGroup({
        buttons: [
          { label: 'One' },
          { label: 'Two' },
          { label: 'Three' },
        ],
        initialFocusedIndex: 1,
      });

      state.focusNext();
      expect(state.focusedIndex()).toBe(2);

      state.focusPrev();
      expect(state.focusedIndex()).toBe(1);

      state.focusPrev();
      expect(state.focusedIndex()).toBe(0);
    });
  });
});
