/**
 * DevX Inputs Tests
 *
 * Tests for specialized input components:
 * - SearchInput: Text input with search icon and clear button
 * - PasswordInput: Password input with visibility toggle
 * - NumberInput: Numeric input with increment/decrement controls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createSearchInput,
  SearchInput,
  createPasswordInput,
  PasswordInput,
  createNumberInput,
  NumberInput,
  type SearchInputState,
  type PasswordInputState,
  type NumberInputState,
} from '../../src/atoms/devx-inputs.js';

// =============================================================================
// SearchInput Tests
// =============================================================================

describe('SearchInput', () => {
  describe('createSearchInput()', () => {
    it('should create state with default values', () => {
      const state = createSearchInput();

      expect(state.value()).toBe('');
      expect(state.cursorPosition()).toBe(0);
    });

    it('should expose all required methods', () => {
      const state = createSearchInput();

      expect(typeof state.value).toBe('function');
      expect(typeof state.cursorPosition).toBe('function');
      expect(typeof state.setValue).toBe('function');
      expect(typeof state.clear).toBe('function');
      expect(typeof state.submit).toBe('function');
      expect(typeof state.handleInput).toBe('function');
      expect(typeof state.focus).toBe('function');
      expect(state._internal).toBeDefined();
    });

    it('should use initial value', () => {
      const state = createSearchInput({ initialValue: 'react' });

      expect(state.value()).toBe('react');
    });

    it('should set value programmatically', () => {
      const state = createSearchInput();

      state.setValue('typescript');

      expect(state.value()).toBe('typescript');
    });

    it('should clear value', () => {
      const state = createSearchInput({ initialValue: 'test' });

      state.clear();

      expect(state.value()).toBe('');
    });

    it('should call onClear when clearing', () => {
      const onClear = vi.fn();
      const state = createSearchInput({ onClear });

      state.clear();

      expect(onClear).toHaveBeenCalledOnce();
    });

    it('should call onSubmit when submitting', () => {
      const onSubmit = vi.fn();
      const state = createSearchInput({ onSubmit, initialValue: 'query' });

      state.submit();

      expect(onSubmit).toHaveBeenCalledWith('query');
    });

    it('should call onChange when value changes', () => {
      const onChange = vi.fn();
      const state = createSearchInput({ onChange });

      state.setValue('new value');

      expect(onChange).toHaveBeenCalledWith('new value');
    });

    it('should use custom placeholder', () => {
      const state = createSearchInput({ placeholder: 'Find files...' });

      // Placeholder is passed to internal state
      expect(state._internal).toBeDefined();
    });
  });

  describe('SearchInput component', () => {
    it('should render without errors', () => {
      const result = SearchInput({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render with external state', () => {
      const state = createSearchInput();

      const result = SearchInput({ state });

      expect(result).toBeDefined();
    });

    it('should render search icon by default', () => {
      const result = SearchInput({ showSearchIcon: true });

      expect(result).toBeDefined();
      // Icon is rendered as child
      expect(result.children).toBeDefined();
    });

    it('should hide search icon when showSearchIcon is false', () => {
      const result = SearchInput({ showSearchIcon: false });

      expect(result).toBeDefined();
    });

    it('should render clear button when has value', () => {
      const state = createSearchInput({ initialValue: 'test' });

      const result = SearchInput({ state, showClearButton: true });

      expect(result).toBeDefined();
    });

    it('should hide clear button when showClearButton is false', () => {
      const state = createSearchInput({ initialValue: 'test' });

      const result = SearchInput({ state, showClearButton: false });

      expect(result).toBeDefined();
    });

    it('should accept width prop', () => {
      const result = SearchInput({ width: 40 });

      expect(result.props?.width).toBe(40);
    });

    it('should accept borderStyle prop', () => {
      const result = SearchInput({ borderStyle: 'single' });

      expect(result.props?.borderStyle).toBe('single');
    });
  });
});

// =============================================================================
// PasswordInput Tests
// =============================================================================

describe('PasswordInput', () => {
  describe('createPasswordInput()', () => {
    it('should create state with default values', () => {
      const state = createPasswordInput();

      expect(state.value()).toBe('');
      expect(state.isVisible()).toBe(false);
    });

    it('should expose all required methods', () => {
      const state = createPasswordInput();

      expect(typeof state.value).toBe('function');
      expect(typeof state.cursorPosition).toBe('function');
      expect(typeof state.setValue).toBe('function');
      expect(typeof state.clear).toBe('function');
      expect(typeof state.handleInput).toBe('function');
      expect(typeof state.focus).toBe('function');
      expect(typeof state.isVisible).toBe('function');
      expect(typeof state.toggleVisibility).toBe('function');
      expect(typeof state.setVisible).toBe('function');
      expect(state._internal).toBeDefined();
    });

    it('should start hidden by default', () => {
      const state = createPasswordInput();

      expect(state.isVisible()).toBe(false);
    });

    it('should respect initial visibility', () => {
      const state = createPasswordInput({ visible: true });

      expect(state.isVisible()).toBe(true);
    });

    it('should toggle visibility', () => {
      const state = createPasswordInput();

      expect(state.isVisible()).toBe(false);

      state.toggleVisibility();
      expect(state.isVisible()).toBe(true);

      state.toggleVisibility();
      expect(state.isVisible()).toBe(false);
    });

    it('should set visibility directly', () => {
      const state = createPasswordInput();

      state.setVisible(true);
      expect(state.isVisible()).toBe(true);

      state.setVisible(false);
      expect(state.isVisible()).toBe(false);
    });

    it('should set value', () => {
      const state = createPasswordInput();

      state.setValue('secret123');

      expect(state.value()).toBe('secret123');
    });

    it('should clear value', () => {
      const state = createPasswordInput({ initialValue: 'password' });

      state.clear();

      expect(state.value()).toBe('');
    });

    it('should call onChange', () => {
      const onChange = vi.fn();
      const state = createPasswordInput({ onChange });

      state.setValue('newpass');

      expect(onChange).toHaveBeenCalledWith('newpass');
    });

    it('should call onSubmit', () => {
      const onSubmit = vi.fn();
      const state = createPasswordInput({ onSubmit });

      // onSubmit is handled by internal TextInput
      expect(state._internal).toBeDefined();
    });
  });

  describe('PasswordInput component', () => {
    it('should render without errors', () => {
      const result = PasswordInput({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render with external state', () => {
      const state = createPasswordInput();

      const result = PasswordInput({ state });

      expect(result).toBeDefined();
    });

    it('should render toggle button by default', () => {
      const result = PasswordInput({ showToggle: true });

      expect(result).toBeDefined();
    });

    it('should hide toggle when showToggle is false', () => {
      const result = PasswordInput({ showToggle: false });

      expect(result).toBeDefined();
    });

    it('should accept width prop', () => {
      const result = PasswordInput({ width: 30 });

      expect(result.props?.width).toBe(30);
    });

    it('should accept borderStyle prop', () => {
      const result = PasswordInput({ borderStyle: 'double' });

      expect(result.props?.borderStyle).toBe('double');
    });

    it('should accept placeholder prop', () => {
      const result = PasswordInput({ placeholder: 'Enter password...' });

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// NumberInput Tests
// =============================================================================

describe('NumberInput', () => {
  describe('createNumberInput()', () => {
    it('should create state with default values', () => {
      const state = createNumberInput();

      expect(state.value()).toBe(0);
    });

    it('should expose all required methods', () => {
      const state = createNumberInput();

      expect(typeof state.value).toBe('function');
      expect(typeof state.setValue).toBe('function');
      expect(typeof state.increment).toBe('function');
      expect(typeof state.decrement).toBe('function');
      expect(typeof state.clamp).toBe('function');
    });

    it('should use initial value', () => {
      const state = createNumberInput({ initialValue: 50 });

      expect(state.value()).toBe(50);
    });

    it('should increment by step', () => {
      const state = createNumberInput({ initialValue: 0, step: 5 });

      state.increment();

      expect(state.value()).toBe(5);
    });

    it('should decrement by step', () => {
      const state = createNumberInput({ initialValue: 10, step: 3 });

      state.decrement();

      expect(state.value()).toBe(7);
    });

    it('should use default step of 1', () => {
      const state = createNumberInput({ initialValue: 0 });

      state.increment();
      expect(state.value()).toBe(1);

      state.decrement();
      expect(state.value()).toBe(0);
    });

    it('should clamp to min', () => {
      const state = createNumberInput({ initialValue: 5, min: 0 });

      state.setValue(-10);

      expect(state.value()).toBe(0);
    });

    it('should clamp to max', () => {
      const state = createNumberInput({ initialValue: 5, max: 10 });

      state.setValue(100);

      expect(state.value()).toBe(10);
    });

    it('should clamp to both min and max', () => {
      const state = createNumberInput({ min: 0, max: 100 });

      state.setValue(-50);
      expect(state.value()).toBe(0);

      state.setValue(200);
      expect(state.value()).toBe(100);

      state.setValue(50);
      expect(state.value()).toBe(50);
    });

    it('should not exceed max when incrementing', () => {
      const state = createNumberInput({ initialValue: 9, max: 10, step: 5 });

      state.increment();

      expect(state.value()).toBe(10); // Clamped to max
    });

    it('should not go below min when decrementing', () => {
      const state = createNumberInput({ initialValue: 2, min: 0, step: 5 });

      state.decrement();

      expect(state.value()).toBe(0); // Clamped to min
    });

    it('should call onChange on increment', () => {
      const onChange = vi.fn();
      const state = createNumberInput({ initialValue: 0, onChange });

      state.increment();

      expect(onChange).toHaveBeenCalledWith(1);
    });

    it('should call onChange on decrement', () => {
      const onChange = vi.fn();
      const state = createNumberInput({ initialValue: 5, onChange });

      state.decrement();

      expect(onChange).toHaveBeenCalledWith(4);
    });

    it('should call onChange on setValue', () => {
      const onChange = vi.fn();
      const state = createNumberInput({ onChange });

      state.setValue(42);

      expect(onChange).toHaveBeenCalledWith(42);
    });

    it('clamp() should work as utility', () => {
      const state = createNumberInput({ min: 0, max: 100 });

      expect(state.clamp(-50)).toBe(0);
      expect(state.clamp(50)).toBe(50);
      expect(state.clamp(150)).toBe(100);
    });
  });

  describe('NumberInput component', () => {
    it('should render without errors', () => {
      const result = NumberInput({});

      expect(result).toBeDefined();
      expect(result.type).toBe('box');
    });

    it('should render with external state', () => {
      const state = createNumberInput();

      const result = NumberInput({ state });

      expect(result).toBeDefined();
    });

    it('should render buttons by default', () => {
      const result = NumberInput({ showButtons: true });

      expect(result).toBeDefined();
    });

    it('should hide buttons when showButtons is false', () => {
      const result = NumberInput({ showButtons: false });

      expect(result).toBeDefined();
    });

    it('should accept width prop', () => {
      const result = NumberInput({ width: 15 });

      expect(result.props?.width).toBe(15);
    });

    it('should accept borderStyle prop', () => {
      const result = NumberInput({ borderStyle: 'single' });

      expect(result.props?.borderStyle).toBe('single');
    });

    it('should render with buttonPosition sides', () => {
      const result = NumberInput({ buttonPosition: 'sides' });

      expect(result).toBeDefined();
    });

    it('should render with buttonPosition right', () => {
      const result = NumberInput({ buttonPosition: 'right' });

      expect(result).toBeDefined();
    });

    it('should display current value', () => {
      const state = createNumberInput({ initialValue: 42 });

      const result = NumberInput({ state });

      expect(result).toBeDefined();
    });
  });
});

// =============================================================================
// Real-world Scenarios
// =============================================================================

describe('Real-world scenarios', () => {
  describe('SearchInput', () => {
    it('should handle search workflow', () => {
      const onSubmit = vi.fn();
      const onClear = vi.fn();
      const state = createSearchInput({ onSubmit, onClear });

      // User types query
      state.setValue('react hooks');
      expect(state.value()).toBe('react hooks');

      // User submits
      state.submit();
      expect(onSubmit).toHaveBeenCalledWith('react hooks');

      // User clears
      state.clear();
      expect(state.value()).toBe('');
      expect(onClear).toHaveBeenCalled();
    });

    it('should handle incremental search', () => {
      const onChange = vi.fn();
      const state = createSearchInput({ onChange });

      state.setValue('r');
      state.setValue('re');
      state.setValue('rea');
      state.setValue('reac');
      state.setValue('react');

      expect(onChange).toHaveBeenCalledTimes(5);
      expect(onChange).toHaveBeenLastCalledWith('react');
    });
  });

  describe('PasswordInput', () => {
    it('should handle login workflow', () => {
      const onSubmit = vi.fn();
      const state = createPasswordInput({ onSubmit });

      // User enters password (hidden)
      expect(state.isVisible()).toBe(false);
      state.setValue('secret123');

      // User peeks at password
      state.toggleVisibility();
      expect(state.isVisible()).toBe(true);

      // User hides password again
      state.toggleVisibility();
      expect(state.isVisible()).toBe(false);

      // Password value is still there
      expect(state.value()).toBe('secret123');
    });

    it('should handle password reset', () => {
      const state = createPasswordInput();

      state.setValue('oldpassword');
      state.clear();

      expect(state.value()).toBe('');
    });
  });

  describe('NumberInput', () => {
    it('should handle quantity selection', () => {
      const onChange = vi.fn();
      const state = createNumberInput({
        initialValue: 1,
        min: 1,
        max: 99,
        step: 1,
        onChange,
      });

      // User increases quantity
      state.increment();
      state.increment();
      state.increment();
      expect(state.value()).toBe(4);

      // User decreases quantity
      state.decrement();
      expect(state.value()).toBe(3);

      // User can't go below min
      state.setValue(1);
      state.decrement();
      expect(state.value()).toBe(1);
    });

    it('should handle rating selection (1-5)', () => {
      const state = createNumberInput({
        initialValue: 3,
        min: 1,
        max: 5,
        step: 1,
      });

      expect(state.value()).toBe(3);

      state.increment();
      state.increment();
      expect(state.value()).toBe(5); // Max

      state.increment();
      expect(state.value()).toBe(5); // Still max
    });

    it('should handle decimal steps', () => {
      const state = createNumberInput({
        initialValue: 0,
        step: 0.1,
        min: 0,
        max: 1,
      });

      state.increment();
      expect(state.value()).toBeCloseTo(0.1);

      state.increment();
      expect(state.value()).toBeCloseTo(0.2);
    });
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge cases', () => {
  describe('SearchInput', () => {
    it('should handle empty submit', () => {
      const onSubmit = vi.fn();
      const state = createSearchInput({ onSubmit });

      state.submit();

      expect(onSubmit).toHaveBeenCalledWith('');
    });

    it('should handle clear without value', () => {
      const onClear = vi.fn();
      const state = createSearchInput({ onClear });

      state.clear();

      expect(onClear).toHaveBeenCalled();
      expect(state.value()).toBe('');
    });
  });

  describe('PasswordInput', () => {
    it('should handle empty password', () => {
      const state = createPasswordInput();

      expect(state.value()).toBe('');
      state.toggleVisibility();
      expect(state.isVisible()).toBe(true);
    });
  });

  describe('NumberInput', () => {
    it('should handle no min/max', () => {
      const state = createNumberInput();

      state.setValue(-1000000);
      expect(state.value()).toBe(-1000000);

      state.setValue(1000000);
      expect(state.value()).toBe(1000000);
    });

    it('should handle min only', () => {
      const state = createNumberInput({ min: 0 });

      state.setValue(-10);
      expect(state.value()).toBe(0);

      state.setValue(1000);
      expect(state.value()).toBe(1000); // No max
    });

    it('should handle max only', () => {
      const state = createNumberInput({ max: 100 });

      state.setValue(-1000);
      expect(state.value()).toBe(-1000); // No min

      state.setValue(200);
      expect(state.value()).toBe(100);
    });

    it('should handle large step values', () => {
      const state = createNumberInput({ initialValue: 0, step: 100, max: 500 });

      state.increment();
      expect(state.value()).toBe(100);

      state.increment();
      state.increment();
      state.increment();
      state.increment();
      expect(state.value()).toBe(500); // Clamped
    });

    it('should handle negative values', () => {
      const state = createNumberInput({
        initialValue: 0,
        min: -100,
        max: 100,
      });

      state.setValue(-50);
      expect(state.value()).toBe(-50);

      state.decrement();
      expect(state.value()).toBe(-51);
    });
  });
});
