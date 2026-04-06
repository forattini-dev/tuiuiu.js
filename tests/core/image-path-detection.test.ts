/**
 * Tests for Image Path Detection utilities
 *
 * Tests isImagePath and extractImagePaths from image-file.ts
 */

import { describe, it, expect } from 'vitest';
import { isImagePath, extractImagePaths } from '../../src/core/image-file.js';

describe('isImagePath', () => {
  describe('returns true for supported image extensions', () => {
    const supportedExtensions = [
      '.png',
      '.jpg',
      '.jpeg',
      '.gif',
      '.webp',
      '.bmp',
      '.tiff',
      '.tif',
      '.svg',
      '.ico',
      '.avif',
    ];

    for (const ext of supportedExtensions) {
      it(`recognizes ${ext}`, () => {
        expect(isImagePath(`/path/to/image${ext}`)).toBe(true);
      });

      it(`recognizes ${ext.toUpperCase()} (case insensitive)`, () => {
        expect(isImagePath(`/path/to/image${ext.toUpperCase()}`)).toBe(true);
      });
    }
  });

  describe('returns false for non-image extensions', () => {
    it('rejects .txt', () => {
      expect(isImagePath('/path/to/file.txt')).toBe(false);
    });

    it('rejects .ts', () => {
      expect(isImagePath('/path/to/file.ts')).toBe(false);
    });

    it('rejects .json', () => {
      expect(isImagePath('/path/to/file.json')).toBe(false);
    });

    it('rejects .js', () => {
      expect(isImagePath('/path/to/file.js')).toBe(false);
    });

    it('rejects .html', () => {
      expect(isImagePath('/path/to/file.html')).toBe(false);
    });

    it('rejects empty string', () => {
      expect(isImagePath('')).toBe(false);
    });

    it('rejects string with only whitespace', () => {
      expect(isImagePath('   ')).toBe(false);
    });

    it('rejects path without extension', () => {
      expect(isImagePath('/path/to/file')).toBe(false);
    });
  });

  describe('handles quoted paths', () => {
    it('handles double-quoted paths', () => {
      expect(isImagePath('"path/to/image.png"')).toBe(true);
    });

    it('handles single-quoted paths', () => {
      expect(isImagePath("'path/to/image.jpg'")).toBe(true);
    });

    it('handles double-quoted non-image paths', () => {
      expect(isImagePath('"path/to/file.txt"')).toBe(false);
    });

    it('handles quoted path with spaces', () => {
      expect(isImagePath('"path/to/my image.png"')).toBe(true);
    });
  });

  describe('handles shell-escaped paths', () => {
    it('handles backslash-escaped spaces', () => {
      expect(isImagePath('path/to/my\\ image.png')).toBe(true);
    });

    it('handles backslash-escaped characters in filename', () => {
      expect(isImagePath('/home/user/my\\ photo\\ (1).jpeg')).toBe(true);
    });
  });

  describe('handles various path formats', () => {
    it('handles absolute Unix paths', () => {
      expect(isImagePath('/home/user/photos/sunset.webp')).toBe(true);
    });

    it('handles relative paths', () => {
      expect(isImagePath('./images/logo.svg')).toBe(true);
    });

    it('handles paths with leading/trailing whitespace', () => {
      expect(isImagePath('  /path/to/image.png  ')).toBe(true);
    });

    it('handles Windows-style paths', () => {
      expect(isImagePath('C:\\Users\\user\\image.png')).toBe(true);
    });
  });
});

describe('extractImagePaths', () => {
  describe('newline-separated paths', () => {
    it('splits newline-separated image paths', () => {
      const input = '/home/user/photo.png\n/tmp/screenshot.jpg';
      const result = extractImagePaths(input);
      expect(result).toEqual(['/home/user/photo.png', '/tmp/screenshot.jpg']);
    });

    it('handles multiple newline-separated paths', () => {
      const input = '/a.png\n/b.jpg\n/c.gif';
      const result = extractImagePaths(input);
      expect(result).toHaveLength(3);
      expect(result).toContain('/a.png');
      expect(result).toContain('/b.jpg');
      expect(result).toContain('/c.gif');
    });
  });

  describe('space-separated absolute paths', () => {
    it('splits space-separated absolute paths', () => {
      const input = '/home/user/a.png /home/user/b.jpg';
      const result = extractImagePaths(input);
      expect(result).toEqual(['/home/user/a.png', '/home/user/b.jpg']);
    });
  });

  describe('filters non-image paths', () => {
    it('filters out non-image files', () => {
      const input = '/path/to/file.txt\n/path/to/image.png\n/path/to/data.json';
      const result = extractImagePaths(input);
      expect(result).toEqual(['/path/to/image.png']);
    });

    it('returns empty array when no image paths found', () => {
      const input = '/path/to/file.txt\n/path/to/data.json';
      const result = extractImagePaths(input);
      expect(result).toEqual([]);
    });
  });

  describe('handles mixed valid/invalid paths', () => {
    it('extracts only image paths from mixed input', () => {
      const input = '/docs/readme.md\n/images/logo.png\n/src/app.ts\n/photos/vacation.jpg';
      const result = extractImagePaths(input);
      expect(result).toEqual(['/images/logo.png', '/photos/vacation.jpg']);
    });
  });

  describe('handles quoted paths', () => {
    it('extracts image from quoted path', () => {
      const input = '"/path/to/my image.png"';
      const result = extractImagePaths(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('/path/to/my image.png');
    });
  });

  describe('handles empty input', () => {
    it('returns empty array for empty string', () => {
      expect(extractImagePaths('')).toEqual([]);
    });

    it('returns empty array for whitespace-only string', () => {
      expect(extractImagePaths('   ')).toEqual([]);
    });

    it('returns empty array for newlines only', () => {
      expect(extractImagePaths('\n\n\n')).toEqual([]);
    });
  });

  describe('handles Windows paths', () => {
    // Windows paths with backslashes are only preserved on win32.
    // On Linux/macOS, backslash escapes are stripped.
    const isWindows = process.platform === 'win32';

    it('extracts Windows-style image paths', () => {
      const input = 'C:\\Users\\user\\image.png';
      const result = extractImagePaths(input);
      // On all platforms the path ends in .png after cleaning, so it matches.
      // On Linux/macOS backslash escapes are stripped: C:Usersuserimage.png
      // On Windows backslashes are preserved: C:\Users\user\image.png
      expect(result).toHaveLength(1);
      expect(result[0]).toMatch(/image\.png$/);
    });

    it('handles forward-slash Windows paths on any platform', () => {
      // Forward slashes work cross-platform
      const input = 'C:/Users/user/image.png';
      const result = extractImagePaths(input);
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('C:/Users/user/image.png');
    });
  });

  describe('handles shell-escaped paths', () => {
    it('cleans backslash-escaped paths', () => {
      const input = '/path/to/my\\ image.png';
      const result = extractImagePaths(input);
      expect(result).toHaveLength(1);
      // Backslash escapes are stripped
      expect(result[0]).toBe('/path/to/my image.png');
    });
  });

  describe('handles edge cases', () => {
    it('handles single image path without separators', () => {
      const input = '/home/user/photo.png';
      const result = extractImagePaths(input);
      expect(result).toEqual(['/home/user/photo.png']);
    });

    it('handles paths with multiple dots', () => {
      const input = '/path/to/file.backup.2024.png';
      const result = extractImagePaths(input);
      expect(result).toHaveLength(1);
    });
  });
});
