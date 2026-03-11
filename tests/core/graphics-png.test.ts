/**
 * Tests for PNG encoding and Kitty graphics f=100 integration
 */

import { describe, it, expect } from 'vitest';
import { inflateSync } from 'node:zlib';
import {
  encodePng,
  kittyGraphics,
  createImageData,
  createSolidImage,
  createGradientImage,
} from '../../src/core/graphics.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Read a 4-byte big-endian uint from a Uint8Array */
function readU32BE(buf: Uint8Array, offset: number): number {
  return (
    ((buf[offset] << 24) |
      (buf[offset + 1] << 16) |
      (buf[offset + 2] << 8) |
      buf[offset + 3]) >>>
    0
  );
}

/** PNG magic bytes */
const PNG_SIGNATURE = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

/** Walk PNG chunks, returning { type, data } for each */
function parsePngChunks(png: Uint8Array): { type: string; data: Uint8Array }[] {
  const chunks: { type: string; data: Uint8Array }[] = [];
  let offset = 8; // skip signature
  while (offset < png.length) {
    const length = readU32BE(png, offset);
    const type = String.fromCharCode(
      png[offset + 4],
      png[offset + 5],
      png[offset + 6],
      png[offset + 7],
    );
    const data = png.slice(offset + 8, offset + 8 + length);
    chunks.push({ type, data });
    offset += 4 + 4 + length + 4; // length + type + data + crc
  }
  return chunks;
}

// ---------------------------------------------------------------------------
// encodePng
// ---------------------------------------------------------------------------

describe('encodePng', () => {
  it('produces a valid PNG signature', () => {
    const img = createSolidImage(2, 2, 255, 0, 0);
    const png = encodePng(img);

    expect(png.slice(0, 8)).toEqual(PNG_SIGNATURE);
  });

  it('contains IHDR, IDAT and IEND chunks in order', () => {
    const img = createSolidImage(4, 4, 0, 255, 0);
    const png = encodePng(img);
    const chunks = parsePngChunks(png);
    const types = chunks.map((c) => c.type);

    expect(types[0]).toBe('IHDR');
    expect(types).toContain('IDAT');
    expect(types[types.length - 1]).toBe('IEND');
  });

  it('IHDR carries the correct width and height', () => {
    const img = createSolidImage(17, 31, 128, 128, 128);
    const png = encodePng(img);
    const chunks = parsePngChunks(png);
    const ihdr = chunks.find((c) => c.type === 'IHDR')!;

    expect(readU32BE(ihdr.data, 0)).toBe(17);
    expect(readU32BE(ihdr.data, 4)).toBe(31);
    // bit depth = 8, color type = 6 (RGBA)
    expect(ihdr.data[8]).toBe(8);
    expect(ihdr.data[9]).toBe(6);
  });

  it('encoded PNG is smaller than raw RGBA for a non-trivial image', () => {
    const img = createSolidImage(64, 64, 100, 150, 200);
    const rawSize = img.pixels.length; // 64*64*4 = 16384
    const png = encodePng(img);

    // A solid-color 64x64 image compresses extremely well
    expect(png.length).toBeLessThan(rawSize);
  });

  it('encoded PNG is smaller than raw RGBA for a gradient image', () => {
    const img = createGradientImage(32, 32);
    const rawSize = img.pixels.length;
    const png = encodePng(img);

    expect(png.length).toBeLessThan(rawSize);
  });

  it('IDAT decompresses to the correct filtered row data', () => {
    const w = 3;
    const h = 2;
    const img = createSolidImage(w, h, 10, 20, 30, 255);
    const png = encodePng(img);
    const chunks = parsePngChunks(png);
    const idat = chunks.find((c) => c.type === 'IDAT')!;

    const decompressed = inflateSync(Buffer.from(idat.data));
    // Each row: 1 filter byte + w*4 data bytes
    const rowLen = 1 + w * 4;
    expect(decompressed.length).toBe(rowLen * h);

    // Verify filter type for each row is 1 (Sub)
    for (let y = 0; y < h; y++) {
      expect(decompressed[y * rowLen]).toBe(1);
    }
  });

  it('handles a 1x1 image', () => {
    const img = createImageData(new Uint8Array([42, 43, 44, 255]), 1, 1);
    const png = encodePng(img);

    // Valid PNG header
    expect(png.slice(0, 8)).toEqual(PNG_SIGNATURE);

    const chunks = parsePngChunks(png);
    const ihdr = chunks.find((c) => c.type === 'IHDR')!;
    expect(readU32BE(ihdr.data, 0)).toBe(1);
    expect(readU32BE(ihdr.data, 4)).toBe(1);
  });

  it('IEND chunk has zero-length data', () => {
    const img = createSolidImage(2, 2, 0, 0, 0);
    const png = encodePng(img);
    const chunks = parsePngChunks(png);
    const iend = chunks.find((c) => c.type === 'IEND')!;

    expect(iend.data.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// kittyGraphics.transmit uses f=100
// ---------------------------------------------------------------------------

describe('kittyGraphics.transmit PNG integration', () => {
  it('uses f=100 (PNG format) in the escape sequence', () => {
    const img = createSolidImage(4, 4, 255, 0, 0);
    const result = kittyGraphics.transmit(img);

    expect(result).toContain('f=100');
    expect(result).not.toContain('f=32');
  });

  it('does not include s= or v= parameters (PNG carries dimensions)', () => {
    const img = createSolidImage(8, 8, 0, 255, 0);
    const result = kittyGraphics.transmit(img);

    // Extract the control portion (before the semicolon payload)
    const controlPart = result.split(';')[0];
    expect(controlPart).not.toMatch(/\bs=/);
    expect(controlPart).not.toMatch(/\bv=/);
  });

  it('still includes c= and r= for cell placement', () => {
    const img = createSolidImage(4, 4, 0, 0, 255);
    const result = kittyGraphics.transmit(img, { width: 10, height: 5 });

    expect(result).toContain('c=10');
    expect(result).toContain('r=5');
  });

  it('produces valid base64 payload from PNG data', () => {
    const img = createSolidImage(2, 2, 128, 128, 128);
    const result = kittyGraphics.transmit(img);

    // Extract base64 payload: everything between first ';' and '\x1b\\'
    const payloadParts: string[] = [];
    const chunkRegex = /;([A-Za-z0-9+/=]+)\x1b\\/g;
    let match;
    while ((match = chunkRegex.exec(result)) !== null) {
      payloadParts.push(match[1]);
    }
    const fullBase64 = payloadParts.join('');
    const decoded = Buffer.from(fullBase64, 'base64');

    // Should start with PNG signature
    expect(decoded[0]).toBe(137);
    expect(decoded[1]).toBe(80); // P
    expect(decoded[2]).toBe(78); // N
    expect(decoded[3]).toBe(71); // G
  });

  it('includes imageId when provided', () => {
    const img = createSolidImage(2, 2, 0, 0, 0);
    const result = kittyGraphics.transmit(img, { imageId: 42 });

    expect(result).toContain('i=42');
  });

  it('chunks large images correctly', () => {
    // Create a larger image that will produce > 4096 bytes of base64
    const img = createGradientImage(64, 64);
    const result = kittyGraphics.transmit(img);

    // Should have continuation chunks with m=1 followed by final m=0
    const chunks = result.split('\x1b\\').filter((s) => s.length > 0);

    if (chunks.length > 1) {
      // First chunk should have m=1
      expect(chunks[0]).toContain('m=1');
      // Last chunk should have m=0
      expect(chunks[chunks.length - 1]).toContain('m=0');
    } else {
      // Small enough for one chunk
      expect(chunks[0]).toContain('m=0');
    }
  });
});
