/**
 * RadioGroup Tests
 *
 * Tests for RadioGroup, createRadioGroup
 */

import { describe, it, expect, vi } from 'vitest';
import { createRadioGroup, RadioGroup } from '../../src/molecules/radio-group.js';

const basicOptions = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
  { value: 'c', label: 'Option C' },
];

describe('createRadioGroup', () => {
  describe('Initialization', () => {
    it('should create with default state', () => {
      const state = createRadioGroup({ options: basicOptions });

      expect(state.focusIndex()).toBe(0);
      expect(state.selected()).toBeUndefined();
    });

    it('should respect initialValue', () => {
      const state = createRadioGroup({
        options: basicOptions,
        initialValue: 'b',
      });

      expect(state.focusIndex()).toBe(1);
      expect(state.selected()).toBe('b');
    });

    it('should handle invalid initialValue', () => {
      const state = createRadioGroup({
        options: basicOptions,
        initialValue: 'invalid',
      });

      expect(state.focusIndex()).toBe(0);
      expect(state.selected()).toBe('invalid');
    });
  });

  describe('Navigation', () => {
    it('should move to next option', () => {
      const state = createRadioGroup({ options: basicOptions });

      expect(state.focusIndex()).toBe(0);
      state.moveNext();
      expect(state.focusIndex()).toBe(1);
    });

    it('should move to prev option', () => {
      const state = createRadioGroup({
        options: basicOptions,
        initialValue: 'b',
      });

      expect(state.focusIndex()).toBe(1);
      state.movePrev();
      expect(state.focusIndex()).toBe(0);
    });

    it('should not move past end', () => {
      const state = createRadioGroup({
        options: basicOptions,
        initialValue: 'c',
      });

      expect(state.focusIndex()).toBe(2);
      state.moveNext();
      expect(state.focusIndex()).toBe(2);
    });

    it('should not move before start', () => {
      const state = createRadioGroup({ options: basicOptions });

      expect(state.focusIndex()).toBe(0);
      state.movePrev();
      expect(state.focusIndex()).toBe(0);
    });

    it('should skip disabled options on moveNext', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ];
      const state = createRadioGroup({ options });

      state.moveNext();
      expect(state.focusIndex()).toBe(2);
    });

    it('should skip disabled options on movePrev', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
        { value: 'c', label: 'C' },
      ];
      const state = createRadioGroup({ options, initialValue: 'c' });

      state.movePrev();
      expect(state.focusIndex()).toBe(0);
    });
  });

  describe('Selection', () => {
    it('should select current option', () => {
      const onChange = vi.fn();
      const state = createRadioGroup({
        options: basicOptions,
        onChange,
      });

      state.selectCurrent();
      expect(state.selected()).toBe('a');
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('should select by value', () => {
      const onChange = vi.fn();
      const state = createRadioGroup({
        options: basicOptions,
        onChange,
      });

      state.select('c');
      expect(state.selected()).toBe('c');
      expect(state.focusIndex()).toBe(2);
      expect(onChange).toHaveBeenCalledWith('c');
    });

    it('should not select disabled option', () => {
      const options = [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B', disabled: true },
      ];
      const onChange = vi.fn();
      const state = createRadioGroup({ options, onChange });

      state.select('b');
      expect(state.selected()).toBeUndefined();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('should not select non-existent value', () => {
      const onChange = vi.fn();
      const state = createRadioGroup({
        options: basicOptions,
        onChange,
      });

      state.select('invalid');
      expect(state.selected()).toBeUndefined();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('RadioGroup Component', () => {
  it('should create radio group component', () => {
    const vnode = RadioGroup({ options: basicOptions });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should render with initial value', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      initialValue: 'b',
    });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should support horizontal direction', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      direction: 'horizontal',
    });

    expect(vnode).toBeDefined();
    expect(vnode.props.flexDirection).toBe('row');
  });

  it('should support vertical direction', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      direction: 'vertical',
    });

    expect(vnode).toBeDefined();
    expect(vnode.props.flexDirection).toBe('column');
  });

  it('should apply custom gap', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      gap: 2,
    });

    expect(vnode).toBeDefined();
    expect(vnode.props.gap).toBe(2);
  });

  it('should accept external state', () => {
    const state = createRadioGroup({
      options: basicOptions,
      initialValue: 'b',
    });
    const vnode = RadioGroup({ options: basicOptions, state });

    expect(vnode).toBeDefined();
  });

  it('should render with fullWidth', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      fullWidth: true,
    });

    expect(vnode).toBeDefined();
  });

  it('should apply custom colors', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      activeColor: 'blue',
      selectedColor: 'yellow',
    });

    expect(vnode).toBeDefined();
  });

  it('should handle disabled options', () => {
    const options = [
      { value: 'a', label: 'A' },
      { value: 'b', label: 'B', disabled: true },
    ];
    const vnode = RadioGroup({ options });

    expect(vnode).toBeDefined();
    expect(vnode.children?.length).toBe(2);
  });

  it('should render option descriptions', () => {
    const options = [
      { value: 'a', label: 'A', description: 'First option' },
      { value: 'b', label: 'B', description: 'Second option' },
    ];
    const vnode = RadioGroup({ options });

    expect(vnode).toBeDefined();
    const output = JSON.stringify(vnode);
    expect(output).toContain('First option');
  });

  it('should handle isActive=false', () => {
    const vnode = RadioGroup({
      options: basicOptions,
      isActive: false,
    });

    expect(vnode).toBeDefined();
  });
});
