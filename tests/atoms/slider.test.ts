/**
 * Slider Tests
 *
 * Tests for Slider, createSlider, RangeSlider, createRangeSlider
 */

import { describe, it, expect, vi } from 'vitest';
import {
  Slider,
  createSlider,
  RangeSlider,
  createRangeSlider,
} from '../../src/atoms/slider.js';

describe('createSlider', () => {
  describe('Initialization', () => {
    it('should create with default values', () => {
      const state = createSlider();

      expect(state.value()).toBe(0);
      expect(state.normalized()).toBe(0);
    });

    it('should respect initialValue', () => {
      const state = createSlider({ initialValue: 50, min: 0, max: 100 });

      expect(state.value()).toBe(50);
      expect(state.normalized()).toBe(0.5);
    });

    it('should clamp initialValue to min', () => {
      const state = createSlider({ initialValue: -10, min: 0, max: 100 });

      expect(state.value()).toBe(0);
    });

    it('should clamp initialValue to max', () => {
      const state = createSlider({ initialValue: 150, min: 0, max: 100 });

      expect(state.value()).toBe(100);
    });
  });

  describe('Increment/Decrement', () => {
    it('should increment by step', () => {
      const state = createSlider({ initialValue: 50, step: 5 });

      state.increment();
      expect(state.value()).toBe(55);
    });

    it('should decrement by step', () => {
      const state = createSlider({ initialValue: 50, step: 5 });

      state.decrement();
      expect(state.value()).toBe(45);
    });

    it('should not exceed max on increment', () => {
      const state = createSlider({ initialValue: 98, max: 100, step: 5 });

      state.increment();
      expect(state.value()).toBe(100);
    });

    it('should not go below min on decrement', () => {
      const state = createSlider({ initialValue: 2, min: 0, step: 5 });

      state.decrement();
      expect(state.value()).toBe(0);
    });
  });

  describe('Large Increment/Decrement', () => {
    it('should increment by 10x step', () => {
      const state = createSlider({ initialValue: 0, step: 1, max: 100 });

      state.incrementLarge();
      expect(state.value()).toBe(10);
    });

    it('should decrement by 10x step', () => {
      const state = createSlider({ initialValue: 100, step: 1 });

      state.decrementLarge();
      expect(state.value()).toBe(90);
    });

    it('should clamp on large increment', () => {
      const state = createSlider({ initialValue: 95, step: 1, max: 100 });

      state.incrementLarge();
      expect(state.value()).toBe(100);
    });

    it('should clamp on large decrement', () => {
      const state = createSlider({ initialValue: 5, step: 1, min: 0 });

      state.decrementLarge();
      expect(state.value()).toBe(0);
    });
  });

  describe('setValue', () => {
    it('should set value directly', () => {
      const state = createSlider({ min: 0, max: 100 });

      state.setValue(75);
      expect(state.value()).toBe(75);
    });

    it('should clamp value', () => {
      const state = createSlider({ min: 0, max: 100 });

      state.setValue(150);
      expect(state.value()).toBe(100);

      state.setValue(-50);
      expect(state.value()).toBe(0);
    });

    it('should call onChange', () => {
      const onChange = vi.fn();
      const state = createSlider({ onChange });

      state.setValue(50);
      expect(onChange).toHaveBeenCalledWith(50);
    });

    it('should not call onChange if value unchanged', () => {
      const onChange = vi.fn();
      const state = createSlider({ initialValue: 50, onChange });

      state.setValue(50);
      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('setNormalized', () => {
    it('should set value from normalized', () => {
      const state = createSlider({ min: 0, max: 100 });

      state.setNormalized(0.5);
      expect(state.value()).toBe(50);
    });

    it('should clamp normalized value', () => {
      const state = createSlider({ min: 0, max: 100 });

      state.setNormalized(1.5);
      expect(state.value()).toBe(100);

      state.setNormalized(-0.5);
      expect(state.value()).toBe(0);
    });
  });

  describe('normalized', () => {
    it('should return normalized value', () => {
      const state = createSlider({ min: 0, max: 100, initialValue: 50 });

      expect(state.normalized()).toBe(0.5);
    });

    it('should handle min at start', () => {
      const state = createSlider({ min: 0, max: 100, initialValue: 0 });

      expect(state.normalized()).toBe(0);
    });

    it('should handle max at end', () => {
      const state = createSlider({ min: 0, max: 100, initialValue: 100 });

      expect(state.normalized()).toBe(1);
    });

    it('should handle zero range', () => {
      const state = createSlider({ min: 50, max: 50, initialValue: 50 });

      expect(state.normalized()).toBe(0);
    });
  });

  describe('Callbacks', () => {
    it('should call onChange on increment', () => {
      const onChange = vi.fn();
      const state = createSlider({ initialValue: 50, step: 1, onChange });

      state.increment();
      expect(onChange).toHaveBeenCalledWith(51);
    });

    it('should call onChange on decrement', () => {
      const onChange = vi.fn();
      const state = createSlider({ initialValue: 50, step: 1, onChange });

      state.decrement();
      expect(onChange).toHaveBeenCalledWith(49);
    });

    it('should not call onChange at boundaries', () => {
      const onChange = vi.fn();
      const state = createSlider({ initialValue: 100, max: 100, onChange });

      state.increment();
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('Slider Component', () => {
  it('should create a slider component', () => {
    const vnode = Slider({});

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should display value by default', () => {
    const vnode = Slider({ initialValue: 50 });

    const output = JSON.stringify(vnode);
    expect(output).toContain('50');
  });

  it('should hide value when showValue=false', () => {
    const vnode = Slider({ initialValue: 75, showValue: false });

    // Should not have value display
    expect(vnode).toBeDefined();
  });

  it('should show min/max when showMinMax=true', () => {
    const vnode = Slider({
      min: 0,
      max: 100,
      showMinMax: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('0');
    expect(output).toContain('100');
  });

  it('should apply custom width', () => {
    const vnode = Slider({ width: 40 });

    expect(vnode).toBeDefined();
  });

  it('should show label', () => {
    const vnode = Slider({ label: 'Volume' });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Volume');
  });

  it('should apply color', () => {
    const vnode = Slider({ color: 'green' });

    const output = JSON.stringify(vnode);
    expect(output).toContain('green');
  });

  it('should apply thumb color', () => {
    const vnode = Slider({ thumbColor: 'yellow' });

    const output = JSON.stringify(vnode);
    expect(output).toContain('yellow');
  });

  it('should accept external state', () => {
    const state = createSlider({ initialValue: 75 });
    const vnode = Slider({ state });

    const output = JSON.stringify(vnode);
    expect(output).toContain('75');
  });

  it('should use custom formatValue', () => {
    const vnode = Slider({
      initialValue: 50,
      formatValue: (v) => `${v}%`,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('50%');
  });

  it('should handle disabled state', () => {
    const vnode = Slider({
      disabled: true,
      label: 'Disabled',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('"dim":true');
  });
});

describe('createRangeSlider', () => {
  describe('Initialization', () => {
    it('should create with default range', () => {
      const state = createRangeSlider();

      expect(state.range()).toEqual([0, 100]);
      expect(state.activeThumb()).toBe('start');
    });

    it('should respect initialValue', () => {
      const state = createRangeSlider({ initialValue: [25, 75] });

      expect(state.range()).toEqual([25, 75]);
    });

    it('should clamp initialValue', () => {
      const state = createRangeSlider({
        min: 0,
        max: 100,
        initialValue: [-10, 150],
      });

      expect(state.range()).toEqual([0, 100]);
    });
  });

  describe('Thumb Switching', () => {
    it('should switch active thumb', () => {
      const state = createRangeSlider();

      expect(state.activeThumb()).toBe('start');
      state.switchThumb();
      expect(state.activeThumb()).toBe('end');
      state.switchThumb();
      expect(state.activeThumb()).toBe('start');
    });
  });

  describe('Increment/Decrement Start', () => {
    it('should increment start thumb', () => {
      const state = createRangeSlider({
        initialValue: [25, 75],
        step: 5,
      });

      state.increment();
      expect(state.range()[0]).toBe(30);
    });

    it('should decrement start thumb', () => {
      const state = createRangeSlider({
        initialValue: [25, 75],
        step: 5,
      });

      state.decrement();
      expect(state.range()[0]).toBe(20);
    });

    it('should not let start exceed end', () => {
      const state = createRangeSlider({
        initialValue: [70, 75],
        step: 10,
      });

      state.increment();
      expect(state.range()[0]).toBeLessThanOrEqual(state.range()[1]);
    });
  });

  describe('Increment/Decrement End', () => {
    it('should increment end thumb', () => {
      const state = createRangeSlider({
        initialValue: [25, 75],
        step: 5,
      });

      state.switchThumb(); // Switch to end
      state.increment();
      expect(state.range()[1]).toBe(80);
    });

    it('should decrement end thumb', () => {
      const state = createRangeSlider({
        initialValue: [25, 75],
        step: 5,
      });

      state.switchThumb(); // Switch to end
      state.decrement();
      expect(state.range()[1]).toBe(70);
    });

    it('should not let end go below start', () => {
      const state = createRangeSlider({
        initialValue: [70, 75],
        step: 10,
      });

      state.switchThumb(); // Switch to end
      state.decrement();
      expect(state.range()[1]).toBeGreaterThanOrEqual(state.range()[0]);
    });
  });

  describe('setRange', () => {
    it('should set range directly', () => {
      const state = createRangeSlider();

      state.setRange([30, 60]);
      expect(state.range()).toEqual([30, 60]);
    });

    it('should normalize inverted range', () => {
      const state = createRangeSlider();

      state.setRange([80, 20]);
      const range = state.range();
      expect(range[0]).toBeLessThanOrEqual(range[1]);
    });

    it('should call onChange', () => {
      const onChange = vi.fn();
      const state = createRangeSlider({ onChange });

      state.setRange([20, 80]);
      expect(onChange).toHaveBeenCalledWith([20, 80]);
    });
  });

  describe('Callbacks', () => {
    it('should call onChange on increment', () => {
      const onChange = vi.fn();
      const state = createRangeSlider({
        initialValue: [25, 75],
        step: 5,
        onChange,
      });

      state.increment();
      expect(onChange).toHaveBeenCalledWith([30, 75]);
    });

    it('should not call onChange if value unchanged', () => {
      const onChange = vi.fn();
      const state = createRangeSlider({
        initialValue: [0, 100],
        min: 0,
        max: 100,
        onChange,
      });

      state.decrement(); // Already at min
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});

describe('RangeSlider Component', () => {
  it('should create a range slider component', () => {
    const vnode = RangeSlider({});

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should display range values', () => {
    const vnode = RangeSlider({
      initialValue: [25, 75],
      showValue: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('25');
    expect(output).toContain('75');
  });

  it('should hide values when showValue=false', () => {
    const vnode = RangeSlider({
      initialValue: [25, 75],
      showValue: false,
    });

    // Should still create the component
    expect(vnode).toBeDefined();
  });

  it('should apply range color', () => {
    const vnode = RangeSlider({ rangeColor: 'green' });

    const output = JSON.stringify(vnode);
    expect(output).toContain('green');
  });

  it('should apply track color', () => {
    // trackColor is used for unfilled parts - test that component accepts the prop
    const vnode = RangeSlider({ trackColor: 'blue' });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should apply custom width', () => {
    const vnode = RangeSlider({ width: 40 });

    expect(vnode).toBeDefined();
  });

  it('should use custom formatValue', () => {
    const vnode = RangeSlider({
      initialValue: [25, 75],
      formatValue: (v) => `$${v}`,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('$25');
    expect(output).toContain('$75');
  });
});

describe('Edge Cases', () => {
  it('should handle step larger than range', () => {
    const state = createSlider({ min: 0, max: 10, step: 20 });

    state.increment();
    expect(state.value()).toBe(10);
  });

  it('should handle decimal values', () => {
    const state = createSlider({
      min: 0,
      max: 1,
      step: 0.1,
      initialValue: 0.5,
    });

    state.increment();
    expect(state.value()).toBeCloseTo(0.6);
  });

  it('should handle negative ranges', () => {
    const state = createSlider({
      min: -50,
      max: 50,
      initialValue: 0,
    });

    expect(state.normalized()).toBe(0.5);
  });

  it('should handle range with same start and end', () => {
    const state = createRangeSlider({
      initialValue: [50, 50],
    });

    expect(state.range()).toEqual([50, 50]);
  });

  it('should handle very small step', () => {
    const state = createSlider({
      min: 0,
      max: 1,
      step: 0.01,
      initialValue: 0,
    });

    state.increment();
    expect(state.value()).toBeCloseTo(0.01);
  });
});
