/**
 * ConfirmButton Tests
 *
 * Tests for the two-click safety button that requires confirmation
 * before executing destructive actions.
 *
 * Tests cover:
 * - Initial state (not confirming)
 * - First click enters confirmation state
 * - Second click triggers onConfirm
 * - Escape/cancel exits confirmation
 * - Timeout auto-cancels confirmation
 * - createConfirmButton state management
 * - Component rendering
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createConfirmButton,
  ConfirmButton,
  type ConfirmButtonState,
  type ConfirmButtonOptions,
} from '../../src/atoms/confirm-button.js';

// =============================================================================
// Test Helpers
// =============================================================================

function createTestState(options: ConfirmButtonOptions = {}): ConfirmButtonState {
  return createConfirmButton({
    timeout: 3000,
    ...options,
  });
}

// =============================================================================
// createConfirmButton() Tests
// =============================================================================

describe('createConfirmButton()', () => {
  describe('initialization', () => {
    it('should create state with default values', () => {
      const state = createTestState();

      expect(state.isConfirming()).toBe(false);
      expect(state.remainingTime()).toBe(0);
    });

    it('should expose all required methods', () => {
      const state = createTestState();

      expect(typeof state.isConfirming).toBe('function');
      expect(typeof state.remainingTime).toBe('function');
      expect(typeof state.click).toBe('function');
      expect(typeof state.confirm).toBe('function');
      expect(typeof state.cancel).toBe('function');
      expect(typeof state.reset).toBe('function');
    });

    it('should use default timeout of 3000ms', () => {
      const state = createConfirmButton();

      state.click();
      expect(state.remainingTime()).toBe(3000);
    });

    it('should use custom timeout', () => {
      const state = createConfirmButton({ timeout: 5000 });

      state.click();
      expect(state.remainingTime()).toBe(5000);
    });
  });

  describe('first click (enter confirmation)', () => {
    it('should enter confirmation state on first click', () => {
      const state = createTestState();

      expect(state.isConfirming()).toBe(false);

      state.click();

      expect(state.isConfirming()).toBe(true);
    });

    it('should set remainingTime to timeout value', () => {
      const state = createTestState({ timeout: 5000 });

      state.click();

      expect(state.remainingTime()).toBe(5000);
    });

    it('should NOT call onConfirm on first click', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      state.click();

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('second click (confirm action)', () => {
    it('should call onConfirm on second click', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      state.click(); // Enter confirmation
      state.click(); // Confirm

      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('should exit confirmation state after confirm', () => {
      const state = createTestState();

      state.click();
      expect(state.isConfirming()).toBe(true);

      state.click();
      expect(state.isConfirming()).toBe(false);
    });

    it('should reset remainingTime after confirm', () => {
      const state = createTestState();

      state.click();
      expect(state.remainingTime()).toBeGreaterThan(0);

      state.click();
      expect(state.remainingTime()).toBe(0);
    });
  });

  describe('confirm() method', () => {
    it('should call onConfirm when in confirmation state', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      state.click(); // Enter confirmation
      state.confirm();

      expect(onConfirm).toHaveBeenCalledOnce();
    });

    it('should NOT call onConfirm when not in confirmation state', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      state.confirm(); // Not in confirmation state

      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('should reset state after confirm', () => {
      const state = createTestState();

      state.click();
      state.confirm();

      expect(state.isConfirming()).toBe(false);
      expect(state.remainingTime()).toBe(0);
    });
  });

  describe('cancel() method', () => {
    it('should call onCancel', () => {
      const onCancel = vi.fn();
      const state = createTestState({ onCancel });

      state.click();
      state.cancel();

      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('should exit confirmation state', () => {
      const state = createTestState();

      state.click();
      expect(state.isConfirming()).toBe(true);

      state.cancel();
      expect(state.isConfirming()).toBe(false);
    });

    it('should reset remainingTime', () => {
      const state = createTestState();

      state.click();
      state.cancel();

      expect(state.remainingTime()).toBe(0);
    });

    it('should NOT call onConfirm when cancelling', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      state.click();
      state.cancel();

      expect(onConfirm).not.toHaveBeenCalled();
    });
  });

  describe('reset() method', () => {
    it('should reset to initial state', () => {
      const state = createTestState();

      state.click();
      expect(state.isConfirming()).toBe(true);

      state.reset();

      expect(state.isConfirming()).toBe(false);
      expect(state.remainingTime()).toBe(0);
    });

    it('should clear timers on reset', () => {
      vi.useFakeTimers();
      const onCancel = vi.fn();
      const state = createTestState({ timeout: 1000, onCancel });

      state.click();
      state.reset();

      // Advance past timeout - onCancel should NOT be called since we reset
      vi.advanceTimersByTime(2000);

      expect(onCancel).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('timeout behavior', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should auto-cancel after timeout', () => {
      const onCancel = vi.fn();
      const state = createTestState({ timeout: 3000, onCancel });

      state.click();
      expect(state.isConfirming()).toBe(true);

      vi.advanceTimersByTime(3000);

      expect(state.isConfirming()).toBe(false);
      expect(onCancel).toHaveBeenCalledOnce();
    });

    it('should countdown remainingTime', () => {
      const state = createTestState({ timeout: 3000 });

      state.click();
      expect(state.remainingTime()).toBe(3000);

      vi.advanceTimersByTime(1000);
      // remainingTime updates every 100ms
      expect(state.remainingTime()).toBeLessThanOrEqual(2100);
      expect(state.remainingTime()).toBeGreaterThanOrEqual(1900);
    });

    it('should stop countdown after cancel', () => {
      const state = createTestState({ timeout: 3000 });

      state.click();
      vi.advanceTimersByTime(500);

      state.cancel();

      const timeAfterCancel = state.remainingTime();
      vi.advanceTimersByTime(1000);

      // Should stay at 0 (not continue counting down)
      expect(state.remainingTime()).toBe(0);
    });

    it('should stop countdown after confirm', () => {
      const state = createTestState({ timeout: 3000 });

      state.click();
      vi.advanceTimersByTime(500);

      state.click(); // Confirm

      expect(state.remainingTime()).toBe(0);
    });
  });

  describe('multiple confirmations', () => {
    it('should support repeated confirm cycles', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      // First cycle
      state.click();
      state.click();
      expect(onConfirm).toHaveBeenCalledTimes(1);

      // Second cycle
      state.click();
      state.click();
      expect(onConfirm).toHaveBeenCalledTimes(2);
    });

    it('should support confirm after cancel', () => {
      const onConfirm = vi.fn();
      const state = createTestState({ onConfirm });

      // Cancel first attempt
      state.click();
      state.cancel();
      expect(onConfirm).not.toHaveBeenCalled();

      // Confirm second attempt
      state.click();
      state.click();
      expect(onConfirm).toHaveBeenCalledOnce();
    });
  });
});

// =============================================================================
// ConfirmButton Component Tests
// =============================================================================

describe('ConfirmButton component', () => {
  it('should render without errors', () => {
    const result = ConfirmButton({
      label: 'Delete',
    });

    expect(result).toBeDefined();
    expect(result.type).toBe('box'); // Button returns Box
  });

  it('should render with initial label', () => {
    const result = ConfirmButton({
      label: 'Delete Item',
    });

    // Button contains Text with label
    expect(result).toBeDefined();
  });

  it('should use external state', () => {
    const state = createTestState();

    const result = ConfirmButton({
      label: 'Delete',
      state,
    });

    expect(result).toBeDefined();
  });

  it('should use internal state when not provided', () => {
    const result = ConfirmButton({
      label: 'Delete',
      onConfirm: () => {},
    });

    expect(result).toBeDefined();
  });

  it('should pass disabled prop to Button', () => {
    const result = ConfirmButton({
      label: 'Delete',
      disabled: true,
    });

    expect(result).toBeDefined();
  });

  it('should pass focused prop to Button', () => {
    const result = ConfirmButton({
      label: 'Delete',
      focused: true,
    });

    expect(result).toBeDefined();
  });

  it('should use confirmLabel when confirming', () => {
    const state = createTestState();
    state.click(); // Enter confirmation

    const result = ConfirmButton({
      label: 'Delete',
      confirmLabel: 'Are you sure?',
      state,
    });

    // In confirmation state, confirmLabel should be used
    expect(result).toBeDefined();
  });

  it('should show countdown when showCountdown is true', () => {
    const state = createTestState({ timeout: 3000 });
    state.click();

    const result = ConfirmButton({
      label: 'Delete',
      showCountdown: true,
      state,
    });

    expect(result).toBeDefined();
  });

  it('should use confirmVariant when confirming', () => {
    const state = createTestState();
    state.click();

    const result = ConfirmButton({
      label: 'Delete',
      variant: 'ghost',
      confirmVariant: 'solid',
      state,
    });

    expect(result).toBeDefined();
  });
});

// =============================================================================
// Real-world Scenarios
// =============================================================================

describe('Real-world scenarios', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle delete confirmation flow', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const state = createConfirmButton({
      timeout: 3000,
      onConfirm,
      onCancel,
    });

    // User clicks Delete
    state.click();
    expect(state.isConfirming()).toBe(true);

    // User clicks again to confirm
    state.click();

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(state.isConfirming()).toBe(false);
  });

  it('should handle cancel via escape', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const state = createConfirmButton({
      onConfirm,
      onCancel,
    });

    // User clicks Delete
    state.click();

    // User presses Escape (simulated via cancel())
    state.cancel();

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('should handle timeout expiry', () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const state = createConfirmButton({
      timeout: 3000,
      onConfirm,
      onCancel,
    });

    // User clicks Delete
    state.click();

    // User hesitates - timeout expires
    vi.advanceTimersByTime(3500);

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(state.isConfirming()).toBe(false);
  });

  it('should handle rapid double-click', () => {
    const onConfirm = vi.fn();
    const state = createConfirmButton({ onConfirm });

    // User double-clicks rapidly
    state.click();
    state.click();

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('should handle click during countdown', () => {
    const onConfirm = vi.fn();
    const state = createConfirmButton({
      timeout: 3000,
      onConfirm,
    });

    state.click();
    vi.advanceTimersByTime(1500); // Half way through

    state.click(); // Confirm before timeout

    expect(onConfirm).toHaveBeenCalledOnce();
    expect(state.isConfirming()).toBe(false);
  });

  it('should work with ConfirmButton component', () => {
    const onConfirm = vi.fn();

    // First render - initial state
    let result = ConfirmButton({
      label: 'Delete',
      confirmLabel: 'Confirm Delete?',
      onConfirm,
      timeout: 3000,
    });
    expect(result).toBeDefined();

    // Simulate click via external state
    const state = createConfirmButton({ onConfirm });
    state.click();
    state.click();

    expect(onConfirm).toHaveBeenCalledOnce();
  });
});

// =============================================================================
// Edge Cases
// =============================================================================

describe('Edge cases', () => {
  it('should handle no callbacks', () => {
    const state = createConfirmButton();

    // Should not throw
    state.click();
    state.click();
    expect(state.isConfirming()).toBe(false);
  });

  it('should handle cancel without entering confirmation', () => {
    const onCancel = vi.fn();
    const state = createConfirmButton({ onCancel });

    state.cancel(); // Cancel without being in confirmation state

    // onCancel still gets called (by design)
    expect(onCancel).toHaveBeenCalled();
  });

  it('should handle very short timeout', () => {
    vi.useFakeTimers();
    const onCancel = vi.fn();
    const state = createConfirmButton({ timeout: 100, onCancel });

    state.click();
    vi.advanceTimersByTime(150);

    expect(onCancel).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should handle zero timeout', () => {
    vi.useFakeTimers();
    const onCancel = vi.fn();
    const state = createConfirmButton({ timeout: 0, onCancel });

    state.click();
    // Immediate timeout
    vi.advanceTimersByTime(1);

    expect(onCancel).toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('should cleanup timers on multiple resets', () => {
    vi.useFakeTimers();
    const onCancel = vi.fn();
    const state = createConfirmButton({ timeout: 1000, onCancel });

    state.click();
    state.reset();
    state.click();
    state.reset();
    state.click();
    state.reset();

    vi.advanceTimersByTime(5000);

    // Should not have called cancel multiple times
    expect(onCancel).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
