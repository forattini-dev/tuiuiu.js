/**
 * Generate PixelGrid data from BBCode file
 * Run with: node scripts/gen-bird-data.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

// Read and clean BBCode
let bbcode = readFileSync('node_modules/tuiuiu3.txt', 'utf-8');
bbcode = bbcode.replace(/<[^>]*>/g, '');
bbcode = bbcode.replace(/\[size=9px\]/g, '');
bbcode = bbcode.replace(/\[font=monospace\]/g, '');
bbcode = bbcode.replace(/\[\/font\]/g, '');
bbcode = bbcode.replace(/\[\/size\]/g, '');

// Parse to PixelGrid format
const lines = bbcode.split('\n').filter(l => l.trim());
const colorPattern = /\[color=(#[0-9a-fA-F]{6})\]([^\[]*)\[\/color\]/g;

const result = [];
for (const line of lines) {
  const row = [];
  let match;
  colorPattern.lastIndex = 0;
  while ((match = colorPattern.exec(line)) !== null) {
    const color = match[1];
    const chars = match[2];
    for (const char of chars) {
      row.push({ char, fg: color });
    }
  }
  if (row.length > 0) {
    result.push(row);
  }
}

// Generate TypeScript output
const width = result[0]?.length || 0;
const height = result.length;
const jsonData = JSON.stringify(result, null, 0);

const output = `/**
 * Tuiuiu Bird Colored ASCII Art - Pre-parsed PixelGrid
 *
 * Generated from tuiuiu3.txt BBCode format
 * Dimensions: ${width}x${height} (width x height)
 */

import type { PixelGrid } from '../../design-system/media/picture.js';

/**
 * Tuiuiu bird colored ASCII art as PixelGrid
 * Ready to use with ColoredPicture or SplashScreen components
 */
export const TUIUIU_BIRD_COLORED: PixelGrid = ${jsonData};
`;

writeFileSync('src/storybook/data/tuiuiu-bird-colored.ts', output);
console.log('Done! Written to src/storybook/data/tuiuiu-bird-colored.ts');
console.log('Rows:', height, 'Cols:', width);
console.log('File size:', (output.length / 1024).toFixed(1), 'KB');
