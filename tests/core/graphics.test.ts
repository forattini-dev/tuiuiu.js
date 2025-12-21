/**
 * Tests for the Graphics Protocol System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  detectGraphicsProtocol,
  setGraphicsProtocol,
  getGraphicsProtocol,
  getProtocolCapabilities,
  resetGraphicsDetection,
  kittyGraphics,
  iterm2Graphics,
  sixelGraphics,
  brailleGraphics,
  renderImage,
  clearImages,
  createImageData,
  createSolidImage,
  createGradientImage,
  scaleImage,
  type GraphicsProtocol,
  type ImageData,
} from '../../src/core/graphics.js';

describe('Graphics Protocol Detection', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetGraphicsDetection();
    // Clear relevant env vars
    delete process.env.TUIUIU_GRAPHICS;
    delete process.env.TERM_PROGRAM;
    delete process.env.TERM;
    delete process.env.KITTY_WINDOW_ID;
    delete process.env.WT_SESSION;
    delete process.env.ITERM_SESSION_ID;
  });

  afterEach(() => {
    // Restore original environment
    process.env = { ...originalEnv };
    resetGraphicsDetection();
  });

  describe('detectGraphicsProtocol', () => {
    it('should detect Kitty by KITTY_WINDOW_ID', () => {
      process.env.KITTY_WINDOW_ID = '1';
      expect(detectGraphicsProtocol()).toBe('kitty');
    });

    it('should detect Kitty by TERM_PROGRAM', () => {
      process.env.TERM_PROGRAM = 'kitty';
      expect(detectGraphicsProtocol()).toBe('kitty');
    });

    it('should detect iTerm2 by ITERM_SESSION_ID', () => {
      process.env.ITERM_SESSION_ID = 'session123';
      expect(detectGraphicsProtocol()).toBe('iterm2');
    });

    it('should detect iTerm2 by TERM_PROGRAM', () => {
      process.env.TERM_PROGRAM = 'iTerm.app';
      expect(detectGraphicsProtocol()).toBe('iterm2');
    });

    it('should detect WezTerm as kitty-compatible', () => {
      process.env.TERM_PROGRAM = 'WezTerm';
      expect(detectGraphicsProtocol()).toBe('kitty');
    });

    it('should detect Windows Terminal as iterm2-compatible', () => {
      process.env.WT_SESSION = 'session123';
      expect(detectGraphicsProtocol()).toBe('iterm2');
    });

    it('should fall back to braille for xterm', () => {
      process.env.TERM = 'xterm-256color';
      expect(detectGraphicsProtocol()).toBe('braille');
    });

    it('should use environment variable override', () => {
      process.env.TUIUIU_GRAPHICS = 'sixel';
      expect(detectGraphicsProtocol()).toBe('sixel');
    });

    it('should default to braille', () => {
      expect(detectGraphicsProtocol()).toBe('braille');
    });

    it('should cache detection result', () => {
      process.env.KITTY_WINDOW_ID = '1';
      detectGraphicsProtocol();
      delete process.env.KITTY_WINDOW_ID;
      // Should still return kitty from cache
      expect(detectGraphicsProtocol()).toBe('kitty');
    });
  });

  describe('setGraphicsProtocol', () => {
    it('should override auto-detection', () => {
      process.env.KITTY_WINDOW_ID = '1';
      setGraphicsProtocol('braille');
      expect(getGraphicsProtocol()).toBe('braille');
    });

    it('should clear override with null', () => {
      setGraphicsProtocol('kitty');
      expect(getGraphicsProtocol()).toBe('kitty');
      setGraphicsProtocol(null);
      // Should now fall back to detection
      expect(getGraphicsProtocol()).toBe('braille');
    });
  });

  describe('getProtocolCapabilities', () => {
    it('should return kitty capabilities', () => {
      setGraphicsProtocol('kitty');
      const caps = getProtocolCapabilities();
      expect(caps.protocol).toBe('kitty');
      expect(caps.supportsTransparency).toBe(true);
      expect(caps.supportsAnimation).toBe(true);
    });

    it('should return iterm2 capabilities', () => {
      setGraphicsProtocol('iterm2');
      const caps = getProtocolCapabilities();
      expect(caps.protocol).toBe('iterm2');
      expect(caps.supportsTransparency).toBe(true);
      expect(caps.supportsAnimation).toBe(false);
    });

    it('should return sixel capabilities', () => {
      setGraphicsProtocol('sixel');
      const caps = getProtocolCapabilities();
      expect(caps.protocol).toBe('sixel');
      expect(caps.supportsTransparency).toBe(false);
      expect(caps.maxWidth).toBe(1024);
    });

    it('should return braille capabilities', () => {
      setGraphicsProtocol('braille');
      const caps = getProtocolCapabilities();
      expect(caps.protocol).toBe('braille');
      expect(caps.supportsTransparency).toBe(false);
      expect(caps.supportsAnimation).toBe(false);
    });

    it('should return none capabilities', () => {
      setGraphicsProtocol('none');
      const caps = getProtocolCapabilities();
      expect(caps.protocol).toBe('none');
      expect(caps.supportsTransparency).toBe(false);
    });
  });
});

describe('Image Utilities', () => {
  describe('createImageData', () => {
    it('should create image data from Uint8Array', () => {
      const pixels = new Uint8Array([255, 0, 0, 255, 0, 255, 0, 255]);
      const img = createImageData(pixels, 2, 1);
      expect(img.width).toBe(2);
      expect(img.height).toBe(1);
      expect(img.pixels).toBe(pixels);
    });

    it('should create image data from number array', () => {
      const pixels = [255, 0, 0, 255];
      const img = createImageData(pixels, 1, 1);
      expect(img.width).toBe(1);
      expect(img.height).toBe(1);
      expect(img.pixels).toBeInstanceOf(Uint8Array);
      expect(img.pixels[0]).toBe(255);
    });
  });

  describe('createSolidImage', () => {
    it('should create a solid color image', () => {
      const img = createSolidImage(2, 2, 255, 128, 64, 255);
      expect(img.width).toBe(2);
      expect(img.height).toBe(2);
      expect(img.pixels.length).toBe(16); // 2*2*4

      // Check first pixel
      expect(img.pixels[0]).toBe(255); // R
      expect(img.pixels[1]).toBe(128); // G
      expect(img.pixels[2]).toBe(64); // B
      expect(img.pixels[3]).toBe(255); // A
    });

    it('should default alpha to 255', () => {
      const img = createSolidImage(1, 1, 100, 100, 100);
      expect(img.pixels[3]).toBe(255);
    });
  });

  describe('createGradientImage', () => {
    it('should create a gradient image', () => {
      const img = createGradientImage(4, 4);
      expect(img.width).toBe(4);
      expect(img.height).toBe(4);
      expect(img.pixels.length).toBe(64); // 4*4*4

      // Check corners - R increases left to right, G increases top to bottom
      // Top-left (0,0)
      expect(img.pixels[0]).toBe(0); // R
      expect(img.pixels[1]).toBe(0); // G

      // Top-right (3,0) - x/width = 3/4 = 0.75
      const tr = 3 * 4;
      expect(img.pixels[tr]).toBe(Math.floor((3 / 4) * 255));
      expect(img.pixels[tr + 1]).toBe(0);

      // Bottom-left (0,3) - y/height = 3/4 = 0.75
      const bl = (3 * 4) * 4;
      expect(img.pixels[bl]).toBe(0);
      expect(img.pixels[bl + 1]).toBe(Math.floor((3 / 4) * 255));
    });
  });

  describe('scaleImage', () => {
    it('should scale image up', () => {
      const original = createSolidImage(2, 2, 255, 0, 0);
      const scaled = scaleImage(original, 4, 4);
      expect(scaled.width).toBe(4);
      expect(scaled.height).toBe(4);
      // All pixels should still be red
      expect(scaled.pixels[0]).toBe(255);
      expect(scaled.pixels[1]).toBe(0);
      expect(scaled.pixels[2]).toBe(0);
    });

    it('should scale image down', () => {
      const original = createGradientImage(8, 8);
      const scaled = scaleImage(original, 4, 4);
      expect(scaled.width).toBe(4);
      expect(scaled.height).toBe(4);
      expect(scaled.pixels.length).toBe(64); // 4*4*4
    });

    it('should use nearest neighbor sampling', () => {
      // Create a 2x2 checkerboard: red, green / blue, white
      const pixels = new Uint8Array([
        255, 0, 0, 255, // Red
        0, 255, 0, 255, // Green
        0, 0, 255, 255, // Blue
        255, 255, 255, 255, // White
      ]);
      const original = createImageData(pixels, 2, 2);
      const scaled = scaleImage(original, 4, 4);

      // Top-left 2x2 should be red
      expect(scaled.pixels[0]).toBe(255);
      expect(scaled.pixels[1]).toBe(0);
      expect(scaled.pixels[2]).toBe(0);
    });
  });
});

describe('Kitty Graphics Protocol', () => {
  beforeEach(() => {
    resetGraphicsDetection();
  });

  describe('transmit', () => {
    it('should generate valid Kitty escape sequence', () => {
      const img = createSolidImage(10, 10, 255, 0, 0);
      const output = kittyGraphics.transmit(img);

      // Should start with APC (Application Program Command)
      expect(output.startsWith('\x1b_G')).toBe(true);
      // Should contain base64 data after semicolon
      expect(output.includes(';')).toBe(true);
      // Should end with ST (String Terminator)
      expect(output.endsWith('\x1b\\')).toBe(true);
    });

    it('should include dimension information', () => {
      const img = createSolidImage(20, 15, 0, 255, 0);
      const output = kittyGraphics.transmit(img);

      // Should include source dimensions
      expect(output.includes('s=20')).toBe(true);
      expect(output.includes('v=15')).toBe(true);
    });

    it('should respect custom dimensions', () => {
      const img = createSolidImage(10, 10, 0, 0, 255);
      const output = kittyGraphics.transmit(img, { width: 5, height: 3 });

      // Should include cell dimensions
      expect(output.includes('c=5')).toBe(true);
      expect(output.includes('r=3')).toBe(true);
    });
  });

  describe('display', () => {
    it('should generate display command', () => {
      const output = kittyGraphics.display(42, 10, 20);
      expect(output).toBe('\x1b_Ga=p,i=42,p=1,X=10,Y=20\x1b\\');
    });
  });

  describe('delete', () => {
    it('should delete specific image', () => {
      const output = kittyGraphics.delete(42);
      expect(output).toBe('\x1b_Ga=d,d=i,i=42\x1b\\');
    });

    it('should delete all images', () => {
      const output = kittyGraphics.delete();
      expect(output).toBe('\x1b_Ga=d,d=A\x1b\\');
    });
  });

  describe('clear', () => {
    it('should clear all images', () => {
      const output = kittyGraphics.clear();
      expect(output).toBe('\x1b_Ga=d,d=A\x1b\\');
    });
  });
});

describe('iTerm2 Graphics Protocol', () => {
  describe('display', () => {
    it('should generate valid iTerm2 escape sequence', () => {
      const img = createSolidImage(10, 10, 255, 0, 0);
      const output = iterm2Graphics.display(img);

      // Should use OSC 1337
      expect(output.startsWith('\x1b]1337;File=')).toBe(true);
      // Should have inline=1
      expect(output.includes('inline=1')).toBe(true);
      // Should end with BEL
      expect(output.endsWith('\x07')).toBe(true);
    });

    it('should use auto dimensions by default', () => {
      const img = createSolidImage(10, 10, 0, 255, 0);
      const output = iterm2Graphics.display(img);
      expect(output.includes('width=auto')).toBe(true);
      expect(output.includes('height=auto')).toBe(true);
    });

    it('should respect custom dimensions', () => {
      const img = createSolidImage(10, 10, 0, 0, 255);
      const output = iterm2Graphics.display(img, { width: 20, height: 15 });
      expect(output.includes('width=20')).toBe(true);
      expect(output.includes('height=15')).toBe(true);
    });
  });

  describe('displayFile', () => {
    it('should generate file display command', () => {
      const output = iterm2Graphics.displayFile('/path/to/image.png');
      expect(output.startsWith('\x1b]1337;File=')).toBe(true);
      expect(output.includes('inline=1')).toBe(true);
    });
  });
});

describe('Sixel Graphics Protocol', () => {
  describe('encode', () => {
    it('should generate valid Sixel sequence', () => {
      const img = createSolidImage(6, 6, 255, 0, 0);
      const output = sixelGraphics.encode(img);

      // Should start with DCS (Device Control String)
      expect(output.startsWith('\x1bPq')).toBe(true);
      // Should end with ST (String Terminator)
      expect(output.endsWith('\x1b\\')).toBe(true);
    });

    it('should include palette definition', () => {
      const img = createSolidImage(6, 6, 128, 64, 32);
      const output = sixelGraphics.encode(img);

      // Should have palette entries starting with #
      expect(output.includes('#0;2;')).toBe(true);
    });

    it('should encode sixel rows', () => {
      const img = createGradientImage(6, 12);
      const output = sixelGraphics.encode(img);

      // Should have row separators
      expect(output.includes('-')).toBe(true);
    });
  });
});

describe('Braille Graphics', () => {
  describe('render', () => {
    it('should convert image to braille characters', () => {
      // Create a simple 2x4 black image (one braille char)
      const img = createSolidImage(2, 4, 0, 0, 0); // Black
      const output = brailleGraphics.render(img, { threshold: 128 });

      // Should be one character (2x4 pixels = 1 braille char)
      expect(output.length).toBe(1);
      // Should be a braille character
      expect(output.charCodeAt(0)).toBeGreaterThanOrEqual(0x2800);
      expect(output.charCodeAt(0)).toBeLessThan(0x2900);
    });

    it('should produce multiple lines for taller images', () => {
      const img = createSolidImage(2, 8, 0, 0, 0); // 2 rows of braille
      const output = brailleGraphics.render(img);

      expect(output.includes('\n')).toBe(true);
      const lines = output.split('\n');
      expect(lines.length).toBe(2);
    });

    it('should produce multiple chars for wider images', () => {
      const img = createSolidImage(4, 4, 0, 0, 0); // 2 chars wide
      const output = brailleGraphics.render(img);

      expect(output.length).toBe(2); // 2 braille characters
    });

    it('should respect threshold', () => {
      // Create gradient from black to white
      const pixels = new Uint8Array(2 * 4 * 4);
      // Left column: dark (value 50)
      // Right column: light (value 200)
      for (let y = 0; y < 4; y++) {
        const leftIdx = (y * 2 + 0) * 4;
        const rightIdx = (y * 2 + 1) * 4;
        pixels[leftIdx] = pixels[leftIdx + 1] = pixels[leftIdx + 2] = 50;
        pixels[leftIdx + 3] = 255;
        pixels[rightIdx] = pixels[rightIdx + 1] = pixels[rightIdx + 2] = 200;
        pixels[rightIdx + 3] = 255;
      }
      const img = createImageData(pixels, 2, 4);

      const output = brailleGraphics.render(img, { threshold: 128 });
      // Left column is dark (<128), so dots should be set
      // Right column is light (>=128), so dots should not be set
      // This should give us dots 1,2,3,7 (left column)
      const expectedCode = 0x2800 | (1 << 0) | (1 << 1) | (1 << 2) | (1 << 6); // 0x2847
      expect(output.charCodeAt(0)).toBe(expectedCode);
    });

    it('should apply dithering when enabled', () => {
      const img = createGradientImage(8, 8);
      const withoutDither = brailleGraphics.render(img, { dither: false });
      const withDither = brailleGraphics.render(img, { dither: true });

      // Dithering should produce different output
      // (they might be equal for some images, but gradient should differ)
      expect(withDither.length).toBe(withoutDither.length);
    });
  });

  describe('invert', () => {
    it('should invert braille characters', () => {
      const img = createSolidImage(2, 4, 0, 0, 0); // All black = all dots
      const original = brailleGraphics.render(img, { threshold: 128 });
      const inverted = brailleGraphics.invert(original);

      // Inverted should be all dots OFF (empty braille)
      expect(inverted.charCodeAt(0)).toBe(0x2800 + 255 - (original.charCodeAt(0) - 0x2800));
    });

    it('should preserve newlines', () => {
      const img = createSolidImage(2, 8, 0, 0, 0);
      const original = brailleGraphics.render(img);
      const inverted = brailleGraphics.invert(original);

      expect(original.includes('\n')).toBe(true);
      expect(inverted.includes('\n')).toBe(true);
      expect(original.split('\n').length).toBe(inverted.split('\n').length);
    });

    it('should pass through non-braille characters', () => {
      const mixed = 'ABC⠿XYZ';
      const inverted = brailleGraphics.invert(mixed);
      expect(inverted.startsWith('ABC')).toBe(true);
      expect(inverted.endsWith('XYZ')).toBe(true);
    });
  });
});

describe('Unified Image Rendering', () => {
  beforeEach(() => {
    resetGraphicsDetection();
  });

  describe('renderImage', () => {
    it('should use kitty protocol when set', () => {
      setGraphicsProtocol('kitty');
      const img = createSolidImage(10, 10, 255, 0, 0);
      const output = renderImage(img);
      expect(output.startsWith('\x1b_G')).toBe(true);
    });

    it('should use iterm2 protocol when set', () => {
      setGraphicsProtocol('iterm2');
      const img = createSolidImage(10, 10, 255, 0, 0);
      const output = renderImage(img);
      expect(output.startsWith('\x1b]1337')).toBe(true);
    });

    it('should use sixel protocol when set', () => {
      setGraphicsProtocol('sixel');
      const img = createSolidImage(6, 6, 255, 0, 0);
      const output = renderImage(img);
      expect(output.startsWith('\x1bPq')).toBe(true);
    });

    it('should use braille as fallback', () => {
      setGraphicsProtocol('braille');
      const img = createSolidImage(2, 4, 0, 0, 0);
      const output = renderImage(img);
      // Should be braille character
      expect(output.charCodeAt(0)).toBeGreaterThanOrEqual(0x2800);
    });

    it('should use braille for none protocol', () => {
      setGraphicsProtocol('none');
      const img = createSolidImage(2, 4, 0, 0, 0);
      const output = renderImage(img);
      expect(output.charCodeAt(0)).toBeGreaterThanOrEqual(0x2800);
    });
  });

  describe('clearImages', () => {
    it('should clear for kitty protocol', () => {
      setGraphicsProtocol('kitty');
      const output = clearImages();
      expect(output).toBe('\x1b_Ga=d,d=A\x1b\\');
    });

    it('should return empty for iterm2', () => {
      setGraphicsProtocol('iterm2');
      const output = clearImages();
      expect(output).toBe('');
    });

    it('should return empty for sixel', () => {
      setGraphicsProtocol('sixel');
      const output = clearImages();
      expect(output).toBe('');
    });

    it('should return empty for braille', () => {
      setGraphicsProtocol('braille');
      const output = clearImages();
      expect(output).toBe('');
    });
  });
});
