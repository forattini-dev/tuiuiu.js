/**
 * Tests for Terminal Profile Database
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  detectTerminalId,
  detectMultiplexer,
  detectTerminalProfile,
  getTerminalProfileById,
  listTerminalIds,
} from '../../src/core/terminal-profile.js';
import type { TerminalId } from '../../src/core/terminal-profile.js';

describe('Terminal Profile', () => {
  // ===========================================================================
  // detectTerminalId
  // ===========================================================================

  describe('detectTerminalId', () => {
    it('should detect kitty via KITTY_WINDOW_ID', () => {
      expect(detectTerminalId({ KITTY_WINDOW_ID: '1' })).toBe('kitty');
    });

    it('should detect alacritty via ALACRITTY_WINDOW_ID', () => {
      expect(detectTerminalId({ ALACRITTY_WINDOW_ID: '1' })).toBe('alacritty');
    });

    it('should detect alacritty via ALACRITTY_LOG', () => {
      expect(detectTerminalId({ ALACRITTY_LOG: '/tmp/alacritty.log' })).toBe('alacritty');
    });

    it('should detect ghostty via GHOSTTY_RESOURCES_DIR', () => {
      expect(detectTerminalId({ GHOSTTY_RESOURCES_DIR: '/usr/share/ghostty' })).toBe('ghostty');
    });

    it('should detect wezterm via WEZTERM_PANE', () => {
      expect(detectTerminalId({ WEZTERM_PANE: '0' })).toBe('wezterm');
    });

    it('should detect wezterm via TERM_PROGRAM=WezTerm', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'WezTerm' })).toBe('wezterm');
    });

    it('should detect rio via TERM_PROGRAM=rio', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'rio' })).toBe('rio');
    });

    it('should detect warp via WARP_IS_LOCAL_SHELL_SESSION', () => {
      expect(detectTerminalId({ WARP_IS_LOCAL_SHELL_SESSION: '1' })).toBe('warp');
    });

    it('should detect foot via TERM=foot', () => {
      expect(detectTerminalId({ TERM: 'foot' })).toBe('foot');
    });

    it('should detect foot via TERM=foot-extra', () => {
      expect(detectTerminalId({ TERM: 'foot-extra' })).toBe('foot');
    });

    it('should detect contour via CONTOUR_TERMINAL_ID', () => {
      expect(detectTerminalId({ CONTOUR_TERMINAL_ID: '1234' })).toBe('contour');
    });

    it('should detect vscode via VSCODE_PID', () => {
      expect(detectTerminalId({ VSCODE_PID: '1234' })).toBe('vscode');
    });

    it('should detect vscode via TERM_PROGRAM=vscode', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'vscode' })).toBe('vscode');
    });

    it('should detect iterm2 via TERM_PROGRAM=iTerm.app', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'iTerm.app' })).toBe('iterm2');
    });

    it('should detect terminal-app via TERM_PROGRAM=Apple_Terminal', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'Apple_Terminal' })).toBe('terminal-app');
    });

    it('should detect windows-terminal via WT_SESSION', () => {
      expect(detectTerminalId({ WT_SESSION: 'abc-123' })).toBe('windows-terminal');
    });

    it('should detect konsole via KONSOLE_VERSION', () => {
      expect(detectTerminalId({ KONSOLE_VERSION: '22.12.3' })).toBe('konsole');
    });

    it('should detect gnome-terminal via VTE_VERSION', () => {
      expect(detectTerminalId({ VTE_VERSION: '7200' })).toBe('gnome-terminal');
    });

    it('should detect tilix via VTE_VERSION + TILIX_ID', () => {
      expect(detectTerminalId({ VTE_VERSION: '7200', TILIX_ID: '1' })).toBe('tilix');
    });

    it('should detect hyper via TERM_PROGRAM=Hyper', () => {
      expect(detectTerminalId({ TERM_PROGRAM: 'Hyper' })).toBe('hyper');
    });

    it('should detect terminology via TERMINOLOGY', () => {
      expect(detectTerminalId({ TERMINOLOGY: '1' })).toBe('terminology');
    });

    it('should detect rxvt-unicode via TERM', () => {
      expect(detectTerminalId({ TERM: 'rxvt-unicode-256color' })).toBe('rxvt-unicode');
    });

    it('should detect st via TERM=st-256color', () => {
      expect(detectTerminalId({ TERM: 'st-256color' })).toBe('st');
    });

    it('should return unknown for unrecognized terminal', () => {
      expect(detectTerminalId({ TERM: 'xterm-256color' })).toBe('unknown');
    });

    it('should return unknown for empty env', () => {
      expect(detectTerminalId({})).toBe('unknown');
    });

    it('should prioritize specific env vars over TERM_PROGRAM', () => {
      // KITTY_WINDOW_ID should win over TERM_PROGRAM
      expect(detectTerminalId({
        KITTY_WINDOW_ID: '1',
        TERM_PROGRAM: 'Hyper',
      })).toBe('kitty');
    });
  });

  // ===========================================================================
  // detectMultiplexer
  // ===========================================================================

  describe('detectMultiplexer', () => {
    it('should detect tmux', () => {
      const result = detectMultiplexer({ TMUX: '/tmp/tmux-1000/default,1234,0' });
      expect(result).not.toBeNull();
      expect(result!.type).toBe('tmux');
      expect(result!.needsPassthrough).toBe(true);
    });

    it('should detect screen', () => {
      const result = detectMultiplexer({ STY: '1234.pts-0' });
      expect(result).not.toBeNull();
      expect(result!.type).toBe('screen');
      expect(result!.needsPassthrough).toBe(true);
    });

    it('should detect zellij', () => {
      const result = detectMultiplexer({ ZELLIJ: '0' });
      expect(result).not.toBeNull();
      expect(result!.type).toBe('zellij');
      expect(result!.needsPassthrough).toBe(false);
    });

    it('should return null when no multiplexer detected', () => {
      expect(detectMultiplexer({})).toBeNull();
    });
  });

  // ===========================================================================
  // detectTerminalProfile
  // ===========================================================================

  describe('detectTerminalProfile', () => {
    it('should return profile with correct ID', () => {
      const profile = detectTerminalProfile({ KITTY_WINDOW_ID: '1' });
      expect(profile.id).toBe('kitty');
      expect(profile.name).toBe('Kitty');
      expect(profile.gpuAccelerated).toBe(true);
    });

    it('should extract version for iterm2', () => {
      const profile = detectTerminalProfile({
        TERM_PROGRAM: 'iTerm.app',
        TERM_PROGRAM_VERSION: '3.5.0',
      });
      expect(profile.id).toBe('iterm2');
      expect(profile.version).toBe('3.5.0');
    });

    it('should extract version for konsole', () => {
      const profile = detectTerminalProfile({ KONSOLE_VERSION: '22.12.3' });
      expect(profile.id).toBe('konsole');
      expect(profile.version).toBe('22.12.3');
    });

    it('should return unknown profile for unrecognized terminal', () => {
      const profile = detectTerminalProfile({});
      expect(profile.id).toBe('unknown');
    });
  });

  // ===========================================================================
  // Terminal capabilities
  // ===========================================================================

  describe('terminal capabilities', () => {
    it('kitty should have full capabilities', () => {
      const profile = getTerminalProfileById('kitty');
      expect(profile.knownCaps.synchronizedOutput).toBe(true);
      expect(profile.knownCaps.styledUnderlines).toBe(true);
      expect(profile.knownCaps.coloredUnderlines).toBe(true);
      expect(profile.knownCaps.clipboard).toBe(true);
      expect(profile.knownCaps.notifications).toBe('osc99');
      expect(profile.knownCaps.kittyKeyboard).toBe(true);
      expect(profile.knownCaps.kittyGraphics).toBe(true);
      expect(profile.knownCaps.hyperlinks).toBe(true);
      expect(profile.knownCaps.trueColor).toBe(true);
    });

    it('wezterm should prefer iterm2 graphics (only bug-free protocol)', () => {
      const profile = getTerminalProfileById('wezterm');
      // Kitty/Sixel have known bugs in WezTerm, only iTerm2 is reliable
      expect(profile.knownCaps.kittyGraphics).toBe(false);
      expect(profile.knownCaps.sixel).toBe(false);
      expect(profile.knownCaps.iterm2Graphics).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('iterm2');
    });

    it('terminal-app should have conservative capabilities', () => {
      const profile = getTerminalProfileById('terminal-app');
      expect(profile.knownCaps.synchronizedOutput).toBe(false);
      expect(profile.knownCaps.styledUnderlines).toBe(false);
      expect(profile.knownCaps.clipboard).toBe(false);
      expect(profile.knownCaps.trueColor).toBe(false);
    });

    it('unknown should have minimal capabilities', () => {
      const profile = getTerminalProfileById('unknown');
      expect(profile.knownCaps.synchronizedOutput).toBe(false);
      expect(profile.knownCaps.styledUnderlines).toBe(false);
      expect(profile.knownCaps.clipboard).toBe(false);
      expect(profile.knownCaps.kittyKeyboard).toBe(false);
    });

    it('foot should support kitty keyboard but not kitty graphics', () => {
      const profile = getTerminalProfileById('foot');
      expect(profile.knownCaps.kittyKeyboard).toBe(true);
      expect(profile.knownCaps.kittyGraphics).toBe(false);
      expect(profile.knownCaps.sixel).toBe(true);
    });

    it('alacritty should not support graphics protocols', () => {
      const profile = getTerminalProfileById('alacritty');
      expect(profile.knownCaps.kittyGraphics).toBe(false);
      expect(profile.knownCaps.sixel).toBe(false);
      expect(profile.knownCaps.iterm2Graphics).toBe(false);
    });

    it('vscode should support sync output and styled underlines', () => {
      const profile = getTerminalProfileById('vscode');
      expect(profile.knownCaps.synchronizedOutput).toBe(true);
      expect(profile.knownCaps.styledUnderlines).toBe(true);
      expect(profile.knownCaps.coloredUnderlines).toBe(true);
    });

    it('iterm2 should prefer iterm2 graphics', () => {
      const profile = getTerminalProfileById('iterm2');
      expect(profile.knownCaps.iterm2Graphics).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('iterm2');
    });

    it('ghostty should prefer kitty graphics', () => {
      const profile = getTerminalProfileById('ghostty');
      expect(profile.knownCaps.kittyGraphics).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('kitty');
    });

    it('rio should prefer iterm2 graphics', () => {
      const profile = getTerminalProfileById('rio');
      expect(profile.knownCaps.iterm2Graphics).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('iterm2');
    });

    it('kontour should have no reliable graphics', () => {
      const profile = getTerminalProfileById('contour');
      expect(profile.knownCaps.sixel).toBe(false);
      expect(profile.knownCaps.preferredGraphics).toBe(false);
    });

    it('konsole should have no reliable graphics (sixel not fixed)', () => {
      const profile = getTerminalProfileById('konsole');
      expect(profile.knownCaps.sixel).toBe(false);
      expect(profile.knownCaps.preferredGraphics).toBe(false);
    });

    it('mlterm should prefer sixel', () => {
      const profile = getTerminalProfileById('mlterm');
      expect(profile.knownCaps.sixel).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('sixel');
    });

    it('bobcat should prefer iterm2 with sixel fallback', () => {
      const profile = getTerminalProfileById('bobcat');
      expect(profile.knownCaps.iterm2Graphics).toBe(true);
      expect(profile.knownCaps.sixel).toBe(true);
      expect(profile.knownCaps.preferredGraphics).toBe('iterm2');
    });
  });

  // ===========================================================================
  // listTerminalIds
  // ===========================================================================

  describe('listTerminalIds', () => {
    it('should return all terminal IDs', () => {
      const ids = listTerminalIds();
      expect(ids).toContain('kitty');
      expect(ids).toContain('alacritty');
      expect(ids).toContain('ghostty');
      expect(ids).toContain('wezterm');
      expect(ids).toContain('unknown');
      expect(ids.length).toBeGreaterThanOrEqual(22);
    });
  });
});
