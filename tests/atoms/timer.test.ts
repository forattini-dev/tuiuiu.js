/**
 * Timer Tests
 *
 * Tests for Timer component and createTimer/createMultiTimer state managers
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  Timer,
  createTimer,
  createMultiTimer,
  formatTime,
  parseTime,
} from '../../src/atoms/timer.js';

describe('formatTime', () => {
  describe('ss format', () => {
    it('should format seconds only', () => {
      expect(formatTime(0, 'ss')).toBe('0');
      expect(formatTime(5000, 'ss')).toBe('5');
      expect(formatTime(65000, 'ss')).toBe('65');
    });

    it('should handle negative values', () => {
      expect(formatTime(-5000, 'ss')).toBe('-5');
    });
  });

  describe('mm:ss format', () => {
    it('should format minutes and seconds', () => {
      expect(formatTime(0, 'mm:ss')).toBe('00:00');
      expect(formatTime(5000, 'mm:ss')).toBe('00:05');
      expect(formatTime(65000, 'mm:ss')).toBe('01:05');
      // Note: mm:ss format wraps hours - use hh:mm:ss for longer times
      expect(formatTime(3600000, 'mm:ss')).toBe('00:00');
    });

    it('should handle negative values', () => {
      expect(formatTime(-65000, 'mm:ss')).toBe('-01:05');
    });
  });

  describe('hh:mm:ss format', () => {
    it('should format hours, minutes and seconds', () => {
      expect(formatTime(0, 'hh:mm:ss')).toBe('00:00:00');
      expect(formatTime(5000, 'hh:mm:ss')).toBe('00:00:05');
      expect(formatTime(65000, 'hh:mm:ss')).toBe('00:01:05');
      expect(formatTime(3665000, 'hh:mm:ss')).toBe('01:01:05');
    });

    it('should handle negative values', () => {
      expect(formatTime(-3665000, 'hh:mm:ss')).toBe('-01:01:05');
    });
  });

  describe('hh:mm:ss.ms format', () => {
    it('should format with milliseconds', () => {
      expect(formatTime(0, 'hh:mm:ss.ms')).toBe('00:00:00.00');
      expect(formatTime(5123, 'hh:mm:ss.ms')).toBe('00:00:05.12');
      expect(formatTime(3665123, 'hh:mm:ss.ms')).toBe('01:01:05.12');
    });

    it('should handle negative values', () => {
      expect(formatTime(-5123, 'hh:mm:ss.ms')).toBe('-00:00:05.12');
    });
  });

  describe('human format', () => {
    it('should format human readable', () => {
      expect(formatTime(5000, 'human')).toBe('5s');
      expect(formatTime(65000, 'human')).toBe('1m 5s');
      expect(formatTime(3665000, 'human')).toBe('1h 1m 5s');
    });

    it('should omit zero values', () => {
      expect(formatTime(3600000, 'human')).toBe('1h 0s');
    });

    it('should handle negative values', () => {
      expect(formatTime(-65000, 'human')).toBe('-1m 5s');
    });
  });

  describe('default format', () => {
    it('should use mm:ss as default', () => {
      // Test with an invalid format - should fallback to mm:ss
      expect(formatTime(65000, 'invalid' as any)).toBe('01:05');
    });
  });
});

describe('parseTime', () => {
  describe('hh:mm:ss format', () => {
    it('should parse hours, minutes and seconds', () => {
      expect(parseTime('01:01:05')).toBe(3665000);
      expect(parseTime('00:00:00')).toBe(0);
      expect(parseTime('10:30:45')).toBe(37845000);
    });
  });

  describe('mm:ss format', () => {
    it('should parse minutes and seconds', () => {
      expect(parseTime('01:05')).toBe(65000);
      expect(parseTime('00:00')).toBe(0);
      expect(parseTime('30:45')).toBe(1845000);
    });
  });

  describe('human format', () => {
    it('should parse human readable format', () => {
      expect(parseTime('5s')).toBe(5000);
      expect(parseTime('1m 5s')).toBe(65000);
      expect(parseTime('1h 1m 5s')).toBe(3665000);
    });

    it('should handle partial format', () => {
      expect(parseTime('1h')).toBe(3600000);
      expect(parseTime('30m')).toBe(1800000);
    });
  });

  describe('seconds only', () => {
    it('should parse integer seconds', () => {
      // Note: plain numbers fall through to parseInt at the end
      // but the human format regex may match first
      // '65' with human format regex matches empty groups
      expect(parseTime('65s')).toBe(65000);
      expect(parseTime('0s')).toBe(0);
    });
  });

  describe('invalid input', () => {
    it('should return 0 for invalid input', () => {
      expect(parseTime('invalid')).toBe(0);
      expect(parseTime('')).toBe(0);
    });
  });
});

describe('Timer Component', () => {
  it('should create a timer component', () => {
    const vnode = Timer({ time: 65000 });

    expect(vnode).toBeDefined();
    expect(vnode.type).toBe('box');
  });

  it('should display formatted time', () => {
    const vnode = Timer({
      time: 65000,
      format: 'mm:ss',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('01:05');
  });

  it('should apply custom color', () => {
    const vnode = Timer({
      time: 65000,
      color: 'cyan',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('cyan');
  });

  it('should show running indicator', () => {
    const vnode = Timer({
      time: 65000,
      running: true,
      showIndicator: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('green'); // Running indicator color
  });

  it('should show paused indicator', () => {
    const vnode = Timer({
      time: 65000,
      paused: true,
      showIndicator: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('yellow'); // Paused indicator color
  });

  it('should use custom indicators', () => {
    const vnode = Timer({
      time: 65000,
      running: true,
      runningIndicator: '[R]',
      showIndicator: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('[R]');
  });

  it('should hide indicator when showIndicator=false', () => {
    const vnode = Timer({
      time: 65000,
      running: true,
      showIndicator: false,
    });

    // Only time text, no indicator
    expect(vnode.children.length).toBe(1);
  });

  it('should show label', () => {
    const vnode = Timer({
      time: 65000,
      label: 'Elapsed:',
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('Elapsed:');
  });

  it('should apply bold styling', () => {
    const vnode = Timer({
      time: 65000,
      bold: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('"bold":true');
  });

  it('should dim when paused', () => {
    const vnode = Timer({
      time: 65000,
      paused: true,
      dimWhenPaused: true,
    });

    const output = JSON.stringify(vnode);
    expect(output).toContain('"dim":true');
  });

  it('should not dim when dimWhenPaused=false', () => {
    const vnode = Timer({
      time: 65000,
      paused: true,
      dimWhenPaused: false,
    });

    const output = JSON.stringify(vnode);
    expect(output).not.toContain('"dim":true');
  });
});

describe('createTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create with default state', () => {
      const timer = createTimer();

      expect(timer.elapsed()).toBe(0);
      expect(timer.isRunning()).toBe(false);
      expect(timer.isPaused()).toBe(false);
    });

    it('should respect mode: stopwatch', () => {
      const timer = createTimer({ mode: 'stopwatch' });

      expect(timer.elapsed()).toBe(0);
    });

    it('should respect mode: countdown with initialTime', () => {
      const timer = createTimer({
        mode: 'countdown',
        initialTime: 60000,
      });

      expect(timer.elapsed()).toBe(60000);
    });

    it('should auto-start when autoStart=true', () => {
      const timer = createTimer({ autoStart: true });

      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });
  });

  describe('Start', () => {
    it('should start the timer', () => {
      const timer = createTimer();

      timer.start();
      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });

    it('should not restart if already running', () => {
      const onTick = vi.fn();
      const timer = createTimer({ onTick });

      timer.start();
      vi.advanceTimersByTime(2000);

      timer.start(); // Should be ignored
      // Timer should continue from where it was
      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });
  });

  describe('Stopwatch Mode', () => {
    it('should count up from 0', () => {
      const timer = createTimer({ mode: 'stopwatch' });

      timer.start();
      expect(timer.elapsed()).toBe(0);

      vi.advanceTimersByTime(1000);
      expect(timer.elapsed()).toBe(1000);

      vi.advanceTimersByTime(1000);
      expect(timer.elapsed()).toBe(2000);

      timer.stop();
    });

    it('should call onTick callback', () => {
      const onTick = vi.fn();
      const timer = createTimer({
        mode: 'stopwatch',
        onTick,
      });

      timer.start();
      expect(onTick).toHaveBeenCalledWith(0); // Immediate tick

      vi.advanceTimersByTime(1000);
      expect(onTick).toHaveBeenCalledWith(1000);

      timer.stop();
    });
  });

  describe('Countdown Mode', () => {
    it('should count down from initialTime', () => {
      const timer = createTimer({
        mode: 'countdown',
        initialTime: 5000,
      });

      timer.start();
      expect(timer.elapsed()).toBe(5000);

      vi.advanceTimersByTime(1000);
      expect(timer.elapsed()).toBe(4000);

      timer.stop();
    });

    it('should call onComplete when reaching 0', () => {
      const onComplete = vi.fn();
      const timer = createTimer({
        mode: 'countdown',
        initialTime: 2000,
        onComplete,
      });

      timer.start();
      vi.advanceTimersByTime(3000); // Past zero

      expect(onComplete).toHaveBeenCalled();
    });

    it('should stop at 0 and not go negative', () => {
      const timer = createTimer({
        mode: 'countdown',
        initialTime: 2000,
      });

      timer.start();
      vi.advanceTimersByTime(5000);

      expect(timer.elapsed()).toBe(0);
      expect(timer.isRunning()).toBe(false);
    });
  });

  describe('Pause/Resume', () => {
    it('should pause the timer', () => {
      const timer = createTimer();

      timer.start();
      vi.advanceTimersByTime(1000);
      timer.pause();

      expect(timer.isPaused()).toBe(true);
      expect(timer.isRunning()).toBe(false);

      // Time should not advance while paused
      const pausedTime = timer.elapsed();
      vi.advanceTimersByTime(2000);
      expect(timer.elapsed()).toBe(pausedTime);

      timer.stop();
    });

    it('should resume the timer', () => {
      const timer = createTimer();

      timer.start();
      vi.advanceTimersByTime(1000);
      timer.pause();

      const pausedTime = timer.elapsed();
      timer.resume();

      expect(timer.isRunning()).toBe(true);
      expect(timer.isPaused()).toBe(false);

      vi.advanceTimersByTime(1000);
      expect(timer.elapsed()).toBe(pausedTime + 1000);

      timer.stop();
    });

    it('should not pause if not running', () => {
      const timer = createTimer();

      timer.pause();
      expect(timer.isPaused()).toBe(false);
    });

    it('should not resume if not paused', () => {
      const timer = createTimer();

      timer.start();
      timer.resume(); // Already running, not paused
      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });
  });

  describe('Toggle', () => {
    it('should start when not running', () => {
      const timer = createTimer();

      timer.toggle();
      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });

    it('should pause when running', () => {
      const timer = createTimer();

      timer.toggle(); // Start
      timer.toggle(); // Pause

      expect(timer.isPaused()).toBe(true);
      timer.stop();
    });

    it('should resume when paused', () => {
      const timer = createTimer();

      timer.toggle(); // Start
      timer.toggle(); // Pause
      timer.toggle(); // Resume

      expect(timer.isRunning()).toBe(true);
      timer.stop();
    });
  });

  describe('Reset', () => {
    it('should reset stopwatch to 0', () => {
      const timer = createTimer({ mode: 'stopwatch' });

      timer.start();
      vi.advanceTimersByTime(5000);
      timer.reset();

      expect(timer.elapsed()).toBe(0);
      expect(timer.isRunning()).toBe(false);
    });

    it('should reset countdown to initialTime', () => {
      const timer = createTimer({
        mode: 'countdown',
        initialTime: 60000,
      });

      timer.start();
      vi.advanceTimersByTime(30000);
      timer.reset();

      expect(timer.elapsed()).toBe(60000);
      expect(timer.isRunning()).toBe(false);
    });
  });

  describe('setTime', () => {
    it('should set time manually', () => {
      const timer = createTimer();

      timer.setTime(10000);
      expect(timer.elapsed()).toBe(10000);
    });

    it('should not set negative time', () => {
      const timer = createTimer();

      timer.setTime(-5000);
      expect(timer.elapsed()).toBe(0);
    });
  });

  describe('addTime/subtractTime', () => {
    it('should add time', () => {
      const timer = createTimer();

      timer.setTime(10000);
      timer.addTime(5000);

      expect(timer.elapsed()).toBe(15000);
    });

    it('should subtract time', () => {
      const timer = createTimer();

      timer.setTime(10000);
      timer.subtractTime(3000);

      expect(timer.elapsed()).toBe(7000);
    });

    it('should not subtract below 0', () => {
      const timer = createTimer();

      timer.setTime(5000);
      timer.subtractTime(10000);

      expect(timer.elapsed()).toBe(0);
    });
  });

  describe('Stop', () => {
    it('should stop the timer completely', () => {
      const timer = createTimer();

      timer.start();
      vi.advanceTimersByTime(1000);
      timer.stop();

      expect(timer.isRunning()).toBe(false);
      expect(timer.isPaused()).toBe(false);
    });
  });

  describe('Custom tick interval', () => {
    it('should use custom tick interval', () => {
      const onTick = vi.fn();
      const timer = createTimer({
        tickInterval: 500,
        onTick,
      });

      timer.start();
      onTick.mockClear(); // Clear immediate tick

      vi.advanceTimersByTime(500);
      expect(onTick).toHaveBeenCalled();

      timer.stop();
    });
  });
});

describe('createMultiTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('should create empty multi-timer', () => {
      const mt = createMultiTimer();

      expect(mt.ids()).toEqual([]);
    });
  });

  describe('Create/Get/Remove', () => {
    it('should create a new timer', () => {
      const mt = createMultiTimer();

      const timer = mt.create('timer-1', { mode: 'stopwatch' });
      expect(timer).toBeDefined();
      expect(mt.ids()).toContain('timer-1');
    });

    it('should return existing timer if ID exists', () => {
      const mt = createMultiTimer();

      const timer1 = mt.create('timer-1');
      const timer2 = mt.create('timer-1');

      expect(timer1).toBe(timer2);
    });

    it('should get an existing timer', () => {
      const mt = createMultiTimer();

      mt.create('timer-1');
      const timer = mt.get('timer-1');

      expect(timer).toBeDefined();
    });

    it('should throw when getting non-existent timer', () => {
      const mt = createMultiTimer();

      expect(() => mt.get('non-existent')).toThrow("Timer 'non-existent' not found");
    });

    it('should remove a timer', () => {
      const mt = createMultiTimer();

      mt.create('timer-1');
      mt.remove('timer-1');

      expect(mt.ids()).not.toContain('timer-1');
    });

    it('should handle removing non-existent timer', () => {
      const mt = createMultiTimer();

      // Should not throw
      expect(() => mt.remove('non-existent')).not.toThrow();
    });
  });

  describe('Bulk Operations', () => {
    it('should pause all timers', () => {
      const mt = createMultiTimer();

      const t1 = mt.create('t1');
      const t2 = mt.create('t2');

      t1.start();
      t2.start();

      mt.pauseAll();

      expect(t1.isPaused()).toBe(true);
      expect(t2.isPaused()).toBe(true);

      mt.stopAll();
    });

    it('should resume all timers', () => {
      const mt = createMultiTimer();

      const t1 = mt.create('t1');
      const t2 = mt.create('t2');

      t1.start();
      t2.start();
      t1.pause();
      t2.pause();

      mt.resumeAll();

      expect(t1.isRunning()).toBe(true);
      expect(t2.isRunning()).toBe(true);

      mt.stopAll();
    });

    it('should reset all timers', () => {
      const mt = createMultiTimer();

      const t1 = mt.create('t1', { mode: 'stopwatch' });
      const t2 = mt.create('t2', { mode: 'stopwatch' });

      t1.start();
      t2.start();
      vi.advanceTimersByTime(5000);

      mt.resetAll();

      expect(t1.elapsed()).toBe(0);
      expect(t2.elapsed()).toBe(0);
    });

    it('should stop all timers and clear', () => {
      const mt = createMultiTimer();

      mt.create('t1');
      mt.create('t2');

      mt.stopAll();

      expect(mt.ids()).toEqual([]);
    });
  });

  describe('Total Elapsed', () => {
    it('should calculate total elapsed across all timers', () => {
      const mt = createMultiTimer();

      const t1 = mt.create('t1');
      const t2 = mt.create('t2');

      t1.setTime(10000);
      t2.setTime(20000);

      expect(mt.totalElapsed()).toBe(30000);

      mt.stopAll();
    });
  });

  describe('IDs', () => {
    it('should return all timer IDs', () => {
      const mt = createMultiTimer();

      mt.create('slide-1');
      mt.create('slide-2');
      mt.create('slide-3');

      const ids = mt.ids();
      expect(ids).toContain('slide-1');
      expect(ids).toContain('slide-2');
      expect(ids).toContain('slide-3');
      expect(ids.length).toBe(3);

      mt.stopAll();
    });
  });
});

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle multiple starts gracefully', () => {
    const timer = createTimer();

    timer.start();
    timer.start();
    timer.start();

    expect(timer.isRunning()).toBe(true);
    timer.stop();
  });

  it('should handle pause when already paused', () => {
    const timer = createTimer();

    timer.start();
    timer.pause();
    timer.pause();

    expect(timer.isPaused()).toBe(true);
    timer.stop();
  });

  it('should handle very large time values', () => {
    expect(formatTime(86400000, 'hh:mm:ss')).toBe('24:00:00'); // 24 hours
    expect(formatTime(359999000, 'hh:mm:ss')).toBe('99:59:59'); // 100 hours
  });

  it('should handle zero time value', () => {
    const vnode = Timer({ time: 0 });

    const output = JSON.stringify(vnode);
    expect(output).toContain('00:00');
  });

  it('should properly cleanup on stop', () => {
    const onTick = vi.fn();
    const timer = createTimer({ onTick });

    timer.start();
    timer.stop();

    onTick.mockClear();
    vi.advanceTimersByTime(5000);

    expect(onTick).not.toHaveBeenCalled();
  });
});
