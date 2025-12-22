/**
 * Tests for atoms/switch.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createSwitch, Switch, ToggleGroup } from '../../src/atoms/switch.js';
import { setRenderMode } from '../../src/core/capabilities.js';
import { emitInput, clearInputHandlers } from '../../src/hooks/context.js';
import type { Key } from '../../src/hooks/types.js';
import { keys, charKey } from '../helpers/keyboard.js';

// Helper to simulate input via EventEmitter
function simulateInput(input: string, key: Key): void {
  emitInput(input, key);
}

describe('createSwitch', () => {
  it('creates switch with default value false', () => {
    const state = createSwitch();
    expect(state.value()).toBe(false);
  });

  it('creates switch with initial value', () => {
    const state = createSwitch({ initialValue: true });
    expect(state.value()).toBe(true);
  });

  it('toggle switches value', () => {
    const state = createSwitch({ initialValue: false });
    expect(state.value()).toBe(false);
    state.toggle();
    expect(state.value()).toBe(true);
    state.toggle();
    expect(state.value()).toBe(false);
  });

  it('toggle calls onChange', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: false, onChange });
    state.toggle();
    expect(onChange).toHaveBeenCalledWith(true);
    state.toggle();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('setOn sets value to true', () => {
    const state = createSwitch({ initialValue: false });
    state.setOn();
    expect(state.value()).toBe(true);
  });

  it('setOn calls onChange when switching from off', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: false, onChange });
    state.setOn();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('setOn does nothing when already on', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: true, onChange });
    state.setOn();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setOff sets value to false', () => {
    const state = createSwitch({ initialValue: true });
    state.setOff();
    expect(state.value()).toBe(false);
  });

  it('setOff calls onChange when switching from on', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: true, onChange });
    state.setOff();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('setOff does nothing when already off', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: false, onChange });
    state.setOff();
    expect(onChange).not.toHaveBeenCalled();
  });

  it('setValue sets specific value', () => {
    const state = createSwitch({ initialValue: false });
    state.setValue(true);
    expect(state.value()).toBe(true);
    state.setValue(false);
    expect(state.value()).toBe(false);
  });

  it('setValue calls onChange when value changes', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: false, onChange });
    state.setValue(true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('setValue does not call onChange when value same', () => {
    const onChange = vi.fn();
    const state = createSwitch({ initialValue: true, onChange });
    state.setValue(true);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Switch component VNode', () => {
  beforeEach(() => {
    setRenderMode('unicode');
    clearInputHandlers();
  });

  afterEach(() => {
    setRenderMode('auto');
    clearInputHandlers();
  });

  it('returns VNode with flexDirection row', () => {
    const node = Switch({ initialValue: false });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
    expect(node.props.flexDirection).toBe('row');
  });

  it('returns VNode in on state', () => {
    const node = Switch({ initialValue: true });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('has label child when label prop provided', () => {
    const node = Switch({ label: 'Dark mode', initialValue: false });
    expect(node.children).toBeDefined();
    expect(node.children!.length).toBeGreaterThan(1);
  });

  it('has showLabels child when off', () => {
    const node = Switch({ initialValue: false, showLabels: true, offLabel: 'OFF' });
    expect(node.children).toBeDefined();
    expect(node.children!.length).toBeGreaterThan(1);
  });

  it('has showLabels child when on', () => {
    const node = Switch({ initialValue: true, showLabels: true, onLabel: 'ON' });
    expect(node.children).toBeDefined();
    expect(node.children!.length).toBeGreaterThan(1);
  });

  it('compact size returns valid VNode', () => {
    const node = Switch({ size: 'compact', initialValue: true });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('compact size off returns valid VNode', () => {
    const node = Switch({ size: 'compact', initialValue: false });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('ASCII mode on returns valid VNode', () => {
    setRenderMode('ascii');
    const node = Switch({ initialValue: true });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('ASCII mode off returns valid VNode', () => {
    setRenderMode('ascii');
    const node = Switch({ initialValue: false });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('ASCII compact mode on returns valid VNode', () => {
    setRenderMode('ascii');
    const node = Switch({ initialValue: true, size: 'compact' });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('ASCII compact mode off returns valid VNode', () => {
    setRenderMode('ascii');
    const node = Switch({ initialValue: false, size: 'compact' });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('uses external state', () => {
    const state = createSwitch({ initialValue: true });
    const node = Switch({ state });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('disabled state returns valid VNode', () => {
    const node = Switch({ disabled: true, initialValue: false });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });
});

describe('ToggleGroup', () => {
  beforeEach(() => {
    setRenderMode('unicode');
    clearInputHandlers();
  });

  afterEach(() => {
    setRenderMode('auto');
    clearInputHandlers();
  });

  it('returns VNode with children', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'Option A' },
        { key: 'b', label: 'Option B' },
      ],
    });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
    expect(node.children?.length).toBe(2);
  });

  it('renders with initial values', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'Option A', initialValue: true },
        { key: 'b', label: 'Option B', initialValue: false },
      ],
    });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
  });

  it('horizontal direction renders in row', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
      direction: 'horizontal',
    });
    expect(node.props.flexDirection).toBe('row');
  });

  it('vertical direction renders in column', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
      direction: 'vertical',
    });
    expect(node.props.flexDirection).toBe('column');
  });

  it('handles disabled options', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'A', disabled: true },
        { key: 'b', label: 'B' },
      ],
    });
    expect(node).toBeDefined();
    expect(node.type).toBe('box');
    expect(node.children?.length).toBe(2);
  });

  it('respects gap prop', () => {
    const node = ToggleGroup({
      options: [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
      gap: 2,
    });
    expect(node.props.gap).toBe(2);
  });
});

describe('Switch keyboard interactions', () => {
  beforeEach(() => {
    setRenderMode('unicode');
    clearInputHandlers();
  });

  afterEach(() => {
    setRenderMode('auto');
    clearInputHandlers();
  });

  it('toggles on space key', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: true });
    expect(state.value()).toBe(false);
    simulateInput(' ', charKey(' ').key);
    expect(state.value()).toBe(true);
  });

  it('toggles on enter key', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: true });
    simulateInput('', keys.enter().key);
    expect(state.value()).toBe(true);
  });

  it('sets off with left arrow', () => {
    const state = createSwitch({ initialValue: true });
    Switch({ state, isActive: true });
    simulateInput('', keys.left().key);
    expect(state.value()).toBe(false);
  });

  it('sets on with right arrow', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: true });
    simulateInput('', keys.right().key);
    expect(state.value()).toBe(true);
  });

  it('sets off with h key', () => {
    const state = createSwitch({ initialValue: true });
    Switch({ state, isActive: true });
    simulateInput('h', charKey('h').key);
    expect(state.value()).toBe(false);
  });

  it('sets on with l key', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: true });
    simulateInput('l', charKey('l').key);
    expect(state.value()).toBe(true);
  });

  it('does not respond when disabled', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: true, disabled: true });
    simulateInput(' ', charKey(' ').key);
    expect(state.value()).toBe(false);
  });

  it('does not respond when not active', () => {
    const state = createSwitch({ initialValue: false });
    Switch({ state, isActive: false });
    simulateInput(' ', charKey(' ').key);
    expect(state.value()).toBe(false);
  });
});
