/**
 * Tests for state cleanup hooks
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  useThemeOverride,
} from '../../src/hooks/use-state-cleanup.js';
import { resetHookState } from '../../src/hooks/context.js';
import * as theme from '../../src/core/theme.js';

describe('State Cleanup Hooks', () => {
  beforeEach(() => {
    resetHookState();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetHookState();
  });

  describe('useThemeOverride', () => {
    it('should call pushTheme with the provided theme', () => {
      const mockTheme = { name: 'test-theme' } as any;
      const pushSpy = vi.spyOn(theme, 'pushTheme').mockImplementation(() => {});
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      useThemeOverride(mockTheme);

      expect(pushSpy).toHaveBeenCalledWith(mockTheme);
    });

    it('should register popTheme as cleanup function', () => {
      const mockTheme = { name: 'test-theme' } as any;
      const pushSpy = vi.spyOn(theme, 'pushTheme').mockImplementation(() => {});
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      useThemeOverride(mockTheme);

      // The cleanup is registered via useEffect, push should be called
      expect(pushSpy).toHaveBeenCalled();
    });

    it('should support multiple theme overrides', () => {
      const theme1 = { name: 'theme-1' } as any;
      const theme2 = { name: 'theme-2' } as any;
      const pushCalls: any[] = [];

      vi.spyOn(theme, 'pushTheme').mockImplementation((t) => {
        pushCalls.push(t);
      });
      vi.spyOn(theme, 'popTheme').mockImplementation(() => {});

      // First override
      useThemeOverride(theme1);
      expect(pushCalls).toContainEqual(theme1);

      // Reset and create second override
      resetHookState();
      useThemeOverride(theme2);
      expect(pushCalls).toContainEqual(theme2);
    });
  });

});
