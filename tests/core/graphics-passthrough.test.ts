/**
 * Tests for Graphics Protocol Passthrough in Multiplexers
 *
 * Verifies that graphics payloads (kitty, iterm2, sixel) are correctly
 * wrapped through multiplexer passthrough (tmux, screen) and left
 * unchanged for zellij and direct terminals.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { passthroughWrap } from '../../src/core/progressive.js';
import { isProtocolGraphics } from '../../src/core/graphics.js';
import type { MultiplexerInfo } from '../../src/core/terminal-profile.js';

const tmuxMux: MultiplexerInfo = { type: 'tmux', needsPassthrough: true };
const screenMux: MultiplexerInfo = { type: 'screen', needsPassthrough: true };
const zellijMux: MultiplexerInfo = { type: 'zellij', needsPassthrough: false };

describe('Graphics Passthrough', () => {
  describe('isProtocolGraphics', () => {
    it('returns true for kitty', () => {
      expect(isProtocolGraphics('kitty')).toBe(true);
    });

    it('returns true for iterm2', () => {
      expect(isProtocolGraphics('iterm2')).toBe(true);
    });

    it('returns true for sixel', () => {
      expect(isProtocolGraphics('sixel')).toBe(true);
    });

    it('returns false for halfblock', () => {
      expect(isProtocolGraphics('halfblock')).toBe(false);
    });

    it('returns false for braille', () => {
      expect(isProtocolGraphics('braille')).toBe(false);
    });

    it('returns false for none', () => {
      expect(isProtocolGraphics('none')).toBe(false);
    });
  });

  describe('passthroughWrap with graphics payloads', () => {
    // Simulate a kitty graphics payload (APC + base64 data)
    const kittyPayload = '\x1b_Ga=T,f=32,s=1,v=1;AAAA\x1b\\';
    // Simulate an iterm2 inline image payload (OSC 1337)
    const iterm2Payload = '\x1b]1337;File=inline=1:AAAA\x07';
    // Simulate a sixel payload (DCS)
    const sixelPayload = '\x1bPq#0;2;0;0;0#0!10~-\x1b\\';

    // A positioned graphics sequence like the renderer produces
    function positionedPayload(payload: string, x: number, y: number): string {
      return `\x1b7\x1b[${y + 1};${x + 1}H${payload}\x1b8`;
    }

    describe('tmux passthrough', () => {
      it('wraps kitty payload in tmux DCS passthrough', () => {
        const positioned = positionedPayload(kittyPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, tmuxMux);

        // tmux wrapping: \x1bPtmux; + doubled ESCs + \x1b\\
        expect(wrapped).toContain('\x1bPtmux;');
        expect(wrapped).toMatch(/\x1b\\$/);
        // ESC characters inside should be doubled
        expect(wrapped).not.toBe(positioned);
      });

      it('wraps iterm2 payload in tmux DCS passthrough', () => {
        const positioned = positionedPayload(iterm2Payload, 5, 3);
        const wrapped = passthroughWrap(positioned, tmuxMux);

        expect(wrapped).toContain('\x1bPtmux;');
        expect(wrapped).toMatch(/\x1b\\$/);
        expect(wrapped).not.toBe(positioned);
      });

      it('wraps sixel payload in tmux DCS passthrough', () => {
        const positioned = positionedPayload(sixelPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, tmuxMux);

        expect(wrapped).toContain('\x1bPtmux;');
        expect(wrapped).toMatch(/\x1b\\$/);
        expect(wrapped).not.toBe(positioned);
      });

      it('doubles ESC characters inside tmux passthrough', () => {
        const positioned = positionedPayload(kittyPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, tmuxMux);

        // tmux passthrough format: \x1bPtmux;{content with doubled ESCs}\x1b\\
        // The content between prefix and suffix has every \x1b replaced with \x1b\x1b
        // Verify doubled ESC for cursor save (\x1b7 -> \x1b\x1b7)
        expect(wrapped).toContain('\x1b\x1b7');
        // Verify doubled ESC for cursor position (\x1b[ -> \x1b\x1b[)
        expect(wrapped).toContain('\x1b\x1b[');
      });
    });

    describe('screen passthrough', () => {
      it('wraps kitty payload in screen DCS passthrough', () => {
        const positioned = positionedPayload(kittyPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, screenMux);

        // screen wrapping: \x1bP + doubled ESCs + \x1b\\
        expect(wrapped).toMatch(/^\x1bP/);
        expect(wrapped).toMatch(/\x1b\\$/);
        expect(wrapped).not.toBe(positioned);
        // Should NOT contain "tmux" (that's tmux-specific)
        expect(wrapped).not.toContain('tmux');
      });

      it('wraps iterm2 payload in screen DCS passthrough', () => {
        const positioned = positionedPayload(iterm2Payload, 2, 1);
        const wrapped = passthroughWrap(positioned, screenMux);

        expect(wrapped).toMatch(/^\x1bP/);
        expect(wrapped).toMatch(/\x1b\\$/);
      });

      it('wraps sixel payload in screen DCS passthrough', () => {
        const positioned = positionedPayload(sixelPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, screenMux);

        expect(wrapped).toMatch(/^\x1bP/);
        expect(wrapped).toMatch(/\x1b\\$/);
      });
    });

    describe('zellij passthrough', () => {
      it('passes kitty payload through unchanged', () => {
        const positioned = positionedPayload(kittyPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, zellijMux);

        expect(wrapped).toBe(positioned);
      });

      it('passes iterm2 payload through unchanged', () => {
        const positioned = positionedPayload(iterm2Payload, 0, 0);
        const wrapped = passthroughWrap(positioned, zellijMux);

        expect(wrapped).toBe(positioned);
      });

      it('passes sixel payload through unchanged', () => {
        const positioned = positionedPayload(sixelPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, zellijMux);

        expect(wrapped).toBe(positioned);
      });
    });

    describe('no multiplexer', () => {
      it('passes kitty payload through unchanged with null multiplexer', () => {
        const positioned = positionedPayload(kittyPayload, 0, 0);
        const wrapped = passthroughWrap(positioned, null);

        expect(wrapped).toBe(positioned);
      });

      it('passes iterm2 payload through unchanged with undefined multiplexer', () => {
        const positioned = positionedPayload(iterm2Payload, 0, 0);
        const wrapped = passthroughWrap(positioned, undefined);

        // Without explicit multiplexer it falls back to getCapabilities()
        // which in test env should have no multiplexer
        expect(wrapped).toBe(positioned);
      });
    });

    describe('kitty cleanup commands', () => {
      // Simulate kitty delete command: \x1b_Ga=d,d=I,i={id};\x1b\\
      const kittyDeleteCmd = '\x1b_Ga=d,d=I,i=42;\x1b\\';
      const kittyCleanup = `\x1b7\x1b[H${kittyDeleteCmd}\x1b8`;

      it('wraps kitty cleanup in tmux DCS passthrough', () => {
        const wrapped = passthroughWrap(kittyCleanup, tmuxMux);

        expect(wrapped).toContain('\x1bPtmux;');
        expect(wrapped).toMatch(/\x1b\\$/);
        expect(wrapped).not.toBe(kittyCleanup);
      });

      it('wraps kitty cleanup in screen DCS passthrough', () => {
        const wrapped = passthroughWrap(kittyCleanup, screenMux);

        expect(wrapped).toMatch(/^\x1bP/);
        expect(wrapped).toMatch(/\x1b\\$/);
        expect(wrapped).not.toBe(kittyCleanup);
      });

      it('passes kitty cleanup through unchanged for zellij', () => {
        const wrapped = passthroughWrap(kittyCleanup, zellijMux);
        expect(wrapped).toBe(kittyCleanup);
      });

      it('passes kitty cleanup through unchanged with no multiplexer', () => {
        const wrapped = passthroughWrap(kittyCleanup, null);
        expect(wrapped).toBe(kittyCleanup);
      });
    });
  });
});
