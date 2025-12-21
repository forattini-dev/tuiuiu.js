/**
 * BigText - Large ASCII art text display
 *
 * Features:
 * - Multiple font styles (block, slant, standard)
 * - Color support
 * - Gradient colors
 * - Alignment options
 */

import { Box, Text } from '../../components/components.js';
import type { VNode, ColorValue } from '../../utils/types.js';

// =============================================================================
// Types
// =============================================================================

export type BigTextFont = 'block' | 'slant' | 'small' | 'standard' | 'banner' | 'mini' | 'shadow' | 'doom' | 'graffiti';

export interface BigTextOptions {
  /** Text to display */
  text: string;
  /** Font style */
  font?: BigTextFont;
  /** Text color */
  color?: ColorValue;
  /** Gradient colors (overrides color) */
  gradient?: ColorValue[];
  /** Alignment */
  align?: 'left' | 'center' | 'right';
  /** Max width (for alignment) */
  maxWidth?: number;
  /** Letter spacing */
  letterSpacing?: number;
}

// =============================================================================
// Font Definitions
// =============================================================================

// Block font (5x5 characters using box drawing)
const BLOCK_FONT: Record<string, string[]> = {
  A: ['█████', '█   █', '█████', '█   █', '█   █'],
  B: ['████ ', '█   █', '████ ', '█   █', '████ '],
  C: ['█████', '█    ', '█    ', '█    ', '█████'],
  D: ['████ ', '█   █', '█   █', '█   █', '████ '],
  E: ['█████', '█    ', '████ ', '█    ', '█████'],
  F: ['█████', '█    ', '████ ', '█    ', '█    '],
  G: ['█████', '█    ', '█ ███', '█   █', '█████'],
  H: ['█   █', '█   █', '█████', '█   █', '█   █'],
  I: ['█████', '  █  ', '  █  ', '  █  ', '█████'],
  J: ['█████', '    █', '    █', '█   █', '█████'],
  K: ['█   █', '█  █ ', '███  ', '█  █ ', '█   █'],
  L: ['█    ', '█    ', '█    ', '█    ', '█████'],
  M: ['█   █', '██ ██', '█ █ █', '█   █', '█   █'],
  N: ['█   █', '██  █', '█ █ █', '█  ██', '█   █'],
  O: ['█████', '█   █', '█   █', '█   █', '█████'],
  P: ['█████', '█   █', '█████', '█    ', '█    '],
  Q: ['█████', '█   █', '█   █', '█  █ ', '███ █'],
  R: ['█████', '█   █', '█████', '█  █ ', '█   █'],
  S: ['█████', '█    ', '█████', '    █', '█████'],
  T: ['█████', '  █  ', '  █  ', '  █  ', '  █  '],
  U: ['█   █', '█   █', '█   █', '█   █', '█████'],
  V: ['█   █', '█   █', '█   █', ' █ █ ', '  █  '],
  W: ['█   █', '█   █', '█ █ █', '██ ██', '█   █'],
  X: ['█   █', ' █ █ ', '  █  ', ' █ █ ', '█   █'],
  Y: ['█   █', ' █ █ ', '  █  ', '  █  ', '  █  '],
  Z: ['█████', '   █ ', '  █  ', ' █   ', '█████'],
  '0': ['█████', '█  ██', '█ █ █', '██  █', '█████'],
  '1': [' ██  ', '  █  ', '  █  ', '  █  ', '█████'],
  '2': ['█████', '    █', '█████', '█    ', '█████'],
  '3': ['█████', '    █', '█████', '    █', '█████'],
  '4': ['█   █', '█   █', '█████', '    █', '    █'],
  '5': ['█████', '█    ', '█████', '    █', '█████'],
  '6': ['█████', '█    ', '█████', '█   █', '█████'],
  '7': ['█████', '    █', '   █ ', '  █  ', '  █  '],
  '8': ['█████', '█   █', '█████', '█   █', '█████'],
  '9': ['█████', '█   █', '█████', '    █', '█████'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
  '.': ['     ', '     ', '     ', '     ', '  █  '],
  ',': ['     ', '     ', '     ', '  █  ', ' █   '],
  '!': ['  █  ', '  █  ', '  █  ', '     ', '  █  '],
  '?': ['█████', '    █', '  ██ ', '     ', '  █  '],
  '-': ['     ', '     ', '█████', '     ', '     '],
  ':': ['     ', '  █  ', '     ', '  █  ', '     '],
};

// Small font (3x3 characters)
const SMALL_FONT: Record<string, string[]> = {
  A: ['▄█▄', '█▀█', '▀ ▀'],
  B: ['██▄', '█▄█', '██▀'],
  C: ['▄██', '█  ', '▀██'],
  D: ['██▄', '█ █', '██▀'],
  E: ['███', '█▄ ', '███'],
  F: ['███', '█▄ ', '█  '],
  G: ['▄██', '█▄█', '▀██'],
  H: ['█ █', '███', '█ █'],
  I: ['███', ' █ ', '███'],
  J: ['███', ' ▄█', '██▀'],
  K: ['█▄█', '██ ', '█ █'],
  L: ['█  ', '█  ', '███'],
  M: ['█▄█', '█▀█', '▀ ▀'],
  N: ['█▄█', '█▀█', '▀ ▀'],
  O: ['▄█▄', '█ █', '▀█▀'],
  P: ['██▄', '█▀ ', '█  '],
  Q: ['▄█▄', '█ █', '▀██'],
  R: ['██▄', '█▀ ', '█ █'],
  S: ['▄██', '▀█▄', '██▀'],
  T: ['███', ' █ ', ' █ '],
  U: ['█ █', '█ █', '▀█▀'],
  V: ['█ █', '█ █', ' ▀ '],
  W: ['█ █', '█▄█', '▀▀▀'],
  X: ['█ █', ' ▀ ', '█ █'],
  Y: ['█ █', ' █ ', ' █ '],
  Z: ['██▄', ' █ ', '▀██'],
  '0': ['▄█▄', '█ █', '▀█▀'],
  '1': ['▄█ ', ' █ ', '▄█▄'],
  '2': ['▀█▄', ' █ ', '▄█▀'],
  '3': ['▀█▄', ' █▄', '▀█▀'],
  '4': ['█ █', '▀█▀', '  █'],
  '5': ['▄█▀', '▀█▄', '▄█▀'],
  '6': ['▄█▄', '█▄ ', '▀█▀'],
  '7': ['▀▀█', '  █', '  █'],
  '8': ['▄█▄', '▄█▄', '▀█▀'],
  '9': ['▄█▄', '▀█▀', '▄█▀'],
  ' ': ['   ', '   ', '   '],
  '.': ['   ', '   ', ' ▄ '],
  '!': [' █ ', ' █ ', ' ▀ '],
  '-': ['   ', '▀▀▀', '   '],
};

// Slant font (4x4)
const SLANT_FONT: Record<string, string[]> = {
  A: ['  ▄█▄  ', ' █▀ ▀█ ', '█▄▄▄▄█ ', '█     █'],
  B: ['█████▄ ', '█    █ ', '█████▄ ', '█████▀ '],
  C: [' ▄████ ', '█      ', '█      ', ' ▀████ '],
  D: ['████▄  ', '█   ▀█ ', '█    █ ', '████▀  '],
  E: ['██████ ', '█▄▄    ', '█▀▀    ', '██████ '],
  F: ['██████ ', '█▄▄    ', '█▀▀    ', '█      '],
  G: [' ▄████ ', '█      ', '█  ▄██ ', ' ▀████ '],
  H: ['█    █ ', '██████ ', '█    █ ', '█    █ '],
  I: ['██████ ', '  ██   ', '  ██   ', '██████ '],
  J: ['██████ ', '    ██ ', '█   ██ ', ' ████  '],
  K: ['█   █  ', '█ ▄█   ', '██▀    ', '█  ▀█  '],
  L: ['█      ', '█      ', '█      ', '██████ '],
  M: ['█▄  ▄█ ', '█ ▀▀ █ ', '█    █ ', '█    █ '],
  N: ['█▄   █ ', '█ ▀▄ █ ', '█  ▀▄█ ', '█    █ '],
  O: [' ▄██▄  ', '█    █ ', '█    █ ', ' ▀██▀  '],
  P: ['█████▄ ', '█    █ ', '█████▀ ', '█      '],
  Q: [' ▄██▄  ', '█    █ ', '█  ▀▄█ ', ' ▀██ █ '],
  R: ['█████▄ ', '█    █ ', '█████▀ ', '█   ▀█ '],
  S: [' ▄███▄ ', '█▄▄▄   ', '   ▀▀█ ', ' ▀███▀ '],
  T: ['██████ ', '  ██   ', '  ██   ', '  ██   '],
  U: ['█    █ ', '█    █ ', '█    █ ', ' ▀██▀  '],
  V: ['█    █ ', '█    █ ', ' █  █  ', '  ▀▀   '],
  W: ['█    █ ', '█    █ ', '█ ▄▄ █ ', '█▀  ▀█ '],
  X: ['█    █ ', ' ▀▄▄▀  ', ' ▄▀▀▄  ', '█    █ '],
  Y: ['█    █ ', ' ▀▄▄▀  ', '  ██   ', '  ██   '],
  Z: ['██████ ', '   ▄█  ', '  █▀   ', '██████ '],
  ' ': ['       ', '       ', '       ', '       '],
};

// Mini font (2x2)
const MINI_FONT: Record<string, string[]> = {
  A: ['▄▀', '█▄'],
  B: ['█▀', '█▄'],
  C: ['█▀', '▀▄'],
  D: ['█▀', '█▄'],
  E: ['█▀', '█▄'],
  F: ['█▀', '█ '],
  G: ['█▀', '▀█'],
  H: ['▄▄', '█▀'],
  I: ['█▀', '█▄'],
  J: ['▄█', '▀█'],
  K: ['█▄', '█▀'],
  L: ['█ ', '█▄'],
  M: ['██', '▀▀'],
  N: ['█▄', '▀█'],
  O: ['█▀', '▀█'],
  P: ['█▀', '█ '],
  Q: ['█▀', '▄█'],
  R: ['█▀', '█▄'],
  S: ['█▀', '▄█'],
  T: ['█▀', ' █'],
  U: ['▄▄', '▀█'],
  V: ['▄▄', ' ▀'],
  W: ['▄▄', '██'],
  X: ['▀▄', '▄▀'],
  Y: ['▀▄', ' █'],
  Z: ['▀█', '█▄'],
  '0': ['█▀', '▀█'],
  '1': ['▄█', ' █'],
  '2': ['▀█', '█▄'],
  '3': ['▀█', '▄█'],
  '4': ['▄▄', ' █'],
  '5': ['█▀', '▄█'],
  '6': ['█▀', '██'],
  '7': ['▀█', ' █'],
  '8': ['█▀', '██'],
  '9': ['██', '▄█'],
  ' ': ['  ', '  '],
  '.': ['  ', ' ▄'],
  '!': ['█ ', '▄ '],
  '-': ['  ', '▄▄'],
};

// Banner font (5x6 using half blocks)
const BANNER_FONT: Record<string, string[]> = {
  A: ['  ▄▄   ', ' █  █  ', '█    █ ', '██████ ', '█    █ ', '█    █ '],
  B: ['█████  ', '█    █ ', '█████  ', '█    █ ', '█    █ ', '█████  '],
  C: [' ████  ', '█    █ ', '█      ', '█      ', '█    █ ', ' ████  '],
  D: ['████   ', '█   █  ', '█    █ ', '█    █ ', '█   █  ', '████   '],
  E: ['██████ ', '█      ', '█████  ', '█      ', '█      ', '██████ '],
  F: ['██████ ', '█      ', '█████  ', '█      ', '█      ', '█      '],
  G: [' ████  ', '█      ', '█  ███ ', '█    █ ', '█    █ ', ' ████  '],
  H: ['█    █ ', '█    █ ', '██████ ', '█    █ ', '█    █ ', '█    █ '],
  I: ['██████ ', '  ██   ', '  ██   ', '  ██   ', '  ██   ', '██████ '],
  J: ['    ██ ', '    ██ ', '    ██ ', '█   ██ ', '█   ██ ', ' ████  '],
  K: ['█   █  ', '█  █   ', '███    ', '█  █   ', '█   █  ', '█    █ '],
  L: ['█      ', '█      ', '█      ', '█      ', '█      ', '██████ '],
  M: ['█    █ ', '██  ██ ', '█ ██ █ ', '█    █ ', '█    █ ', '█    █ '],
  N: ['█    █ ', '██   █ ', '█ █  █ ', '█  █ █ ', '█   ██ ', '█    █ '],
  O: [' ████  ', '█    █ ', '█    █ ', '█    █ ', '█    █ ', ' ████  '],
  P: ['█████  ', '█    █ ', '█████  ', '█      ', '█      ', '█      '],
  Q: [' ████  ', '█    █ ', '█    █ ', '█  █ █ ', '█   █  ', ' ████▄ '],
  R: ['█████  ', '█    █ ', '█████  ', '█  █   ', '█   █  ', '█    █ '],
  S: [' ████  ', '█      ', ' ████  ', '     █ ', '     █ ', '█████  '],
  T: ['██████ ', '  ██   ', '  ██   ', '  ██   ', '  ██   ', '  ██   '],
  U: ['█    █ ', '█    █ ', '█    █ ', '█    █ ', '█    █ ', ' ████  '],
  V: ['█    █ ', '█    █ ', '█    █ ', '█    █ ', ' █  █  ', '  ██   '],
  W: ['█    █ ', '█    █ ', '█    █ ', '█ ██ █ ', '██  ██ ', '█    █ '],
  X: ['█    █ ', ' █  █  ', '  ██   ', '  ██   ', ' █  █  ', '█    █ '],
  Y: ['█    █ ', ' █  █  ', '  ██   ', '  ██   ', '  ██   ', '  ██   '],
  Z: ['██████ ', '    █  ', '   █   ', '  █    ', ' █     ', '██████ '],
  '0': [' ████  ', '█   ██ ', '█  █ █ ', '█ █  █ ', '██   █ ', ' ████  '],
  '1': ['   █   ', '  ██   ', '   █   ', '   █   ', '   █   ', ' ████  '],
  '2': [' ████  ', '█    █ ', '    █  ', '   █   ', '  █    ', '██████ '],
  '3': [' ████  ', '     █ ', '  ███  ', '     █ ', '     █ ', ' ████  '],
  '4': ['█    █ ', '█    █ ', '██████ ', '     █ ', '     █ ', '     █ '],
  '5': ['██████ ', '█      ', '█████  ', '     █ ', '     █ ', '█████  '],
  '6': [' ████  ', '█      ', '█████  ', '█    █ ', '█    █ ', ' ████  '],
  '7': ['██████ ', '    █  ', '   █   ', '  █    ', '  █    ', '  █    '],
  '8': [' ████  ', '█    █ ', ' ████  ', '█    █ ', '█    █ ', ' ████  '],
  '9': [' ████  ', '█    █ ', ' █████ ', '     █ ', '     █ ', ' ████  '],
  ' ': ['       ', '       ', '       ', '       ', '       ', '       '],
  '.': ['       ', '       ', '       ', '       ', '  ██   ', '  ██   '],
  '!': ['  ██   ', '  ██   ', '  ██   ', '  ██   ', '       ', '  ██   '],
  '-': ['       ', '       ', '██████ ', '       ', '       ', '       '],
  ':': ['       ', '  ██   ', '       ', '       ', '  ██   ', '       '],
};

// Standard font (same as block but 5 lines)
const STANDARD_FONT = BLOCK_FONT;

// Shadow font (with 3D shadow effect)
const SHADOW_FONT: Record<string, string[]> = {
  A: ['▄█▀█▄   ', '█░░░█▒  ', '█▀▀▀█▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  B: ['█▀▀▀▄   ', '█░░░█▒  ', '█▀▀▀▄▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  C: ['▄▀▀▀▀   ', '█░░░░▒  ', '█░░░░▒  ', '▀▄▄▄▄▒  ', ' ▀▀▀▀▀  '],
  D: ['█▀▀▀▄   ', '█░░░█▒  ', '█░░░█▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  E: ['█▀▀▀▀   ', '█▀▀▀░▒  ', '█░░░░▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  F: ['█▀▀▀▀   ', '█▀▀▀░▒  ', '█░░░░▒  ', '▀░░░░▒  ', ' ▀▀▀▀▀  '],
  G: ['▄▀▀▀▀   ', '█░▄▄░▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  H: ['█░░░█   ', '█▀▀▀█▒  ', '█░░░█▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  I: ['▄█▄  ', '░█░▒ ', '░█░▒ ', '▀▀▀▒ ', ' ▀▀▀ '],
  J: ['   ▄█', '   ░█▒', '▄░░░█▒', '▀▀▀▀▀▒', ' ▀▀▀▀▀'],
  K: ['█░░█    ', '█░█░▒   ', '█▀▄░▒   ', '▀░░▀▒   ', ' ▀▀▀▀   '],
  L: ['█░░░    ', '█░░░▒   ', '█░░░▒   ', '▀▀▀▀▒   ', ' ▀▀▀▀   '],
  M: ['█▄░▄█   ', '█░█░█▒  ', '█░░░█▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  N: ['█▄░░█   ', '█░█░█▒  ', '█░░█▒▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  O: ['▄▀▀▀▄   ', '█░░░█▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  P: ['█▀▀▀▄   ', '█░░░█▒  ', '█▀▀▀░▒  ', '▀░░░░▒  ', ' ▀▀▀▀▀  '],
  Q: ['▄▀▀▀▄   ', '█░░░█▒  ', '█░░▄▀▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀█  '],
  R: ['█▀▀▀▄   ', '█░░░█▒  ', '█▀▀▄░▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  S: ['▄▀▀▀▀   ', '▀▀▀▀▄▒  ', '░░░░█▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  T: ['▀█▀▀▀  ', '░█░░▒  ', '░█░░▒  ', '░▀░░▒  ', ' ▀▀▀▀  '],
  U: ['█░░░█   ', '█░░░█▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  V: ['█░░░█   ', '█░░░█▒  ', '░█░█░▒  ', '░░▀░░▒  ', ' ▀▀▀▀▀  '],
  W: ['█░░░█   ', '█░█░█▒  ', '█▀░▀█▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  X: ['█░░░█   ', '░█░█░▒  ', '░█░█░▒  ', '▀░░░▀▒  ', ' ▀▀▀▀▀  '],
  Y: ['█░░█   ', '░█▄▀▒  ', '░░█░▒  ', '░░▀░▒  ', ' ▀▀▀▀  '],
  Z: ['▀▀▀▀█   ', '░░▄▀░▒  ', '▄▀░░░▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  '0': ['▄▀▀▀▄   ', '█░░░█▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  '1': ['  ▄█  ', '  ░█▒ ', '  ░█▒ ', '  ▀▀▒ ', '  ▀▀▀ '],
  '2': ['▄▀▀▀▄   ', '░░░▄▀▒  ', '░▄▀░░▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  '3': ['▄▀▀▀▄   ', '░░▀█░▒  ', '░░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  '4': ['█░░░█   ', '█░░░█▒  ', '▀▀▀▀█▒  ', '░░░░▀▒  ', ' ▀▀▀▀▀  '],
  '5': ['█▀▀▀▀   ', '▀▀▀▀▄▒  ', '░░░░█▒  ', '▀▀▀▀▀▒  ', ' ▀▀▀▀▀  '],
  '6': ['▄▀▀▀▀   ', '█▀▀▀▄▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  '7': ['▀▀▀▀█   ', '░░░▄▀▒  ', '░░▄▀░▒  ', '░░▀░░▒  ', ' ▀▀▀▀▀  '],
  '8': ['▄▀▀▀▄   ', '█▀▀▀█▒  ', '█░░░█▒  ', '▀▄▄▄▀▒  ', ' ▀▀▀▀▀  '],
  '9': ['▄▀▀▀▄   ', '█░░░█▒  ', '▀▄▄▄█▒  ', '░░░░▀▒  ', ' ▀▀▀▀▀  '],
  ' ': ['      ', '      ', '      ', '      ', '      '],
};

// DOOM font (inspired by DOOM game title)
const DOOM_FONT: Record<string, string[]> = {
  A: ['▄█████▄', '██▀▀▀██', '███████', '██   ██', '▀█   █▀'],
  B: ['██████▄', '██   ██', '██████▄', '██   ██', '▀█████▀'],
  C: ['▄█████▄', '██▀▀▀▀▀', '██     ', '██▄▄▄▄▄', '▀██████'],
  D: ['██████▄', '██   ██', '██   ██', '██   ██', '▀█████▀'],
  E: ['███████', '██▄▄▄  ', '██▀▀▀  ', '██▄▄▄▄▄', '▀██████'],
  F: ['███████', '██     ', '████▀  ', '██     ', '▀█     '],
  G: ['▄█████▄', '██▀▀▀▀▀', '██  ███', '██▄▄▄██', '▀█████▀'],
  H: ['██   ██', '██   ██', '███████', '██   ██', '▀█   █▀'],
  I: ['███', ' ██', ' ██', ' ██', '▀██'],
  J: ['    ██', '    ██', '    ██', '██  ██', '▀████▀'],
  K: ['██  ▄█▀', '██▄█▀  ', '████▄  ', '██  ▀█▄', '▀█   ▀█'],
  L: ['██     ', '██     ', '██     ', '██▄▄▄▄▄', '▀██████'],
  M: ['███▄███', '██ █ ██', '██   ██', '██   ██', '▀█   █▀'],
  N: ['██▄  ██', '███▄ ██', '██ ████', '██  ▀██', '▀█   █▀'],
  O: ['▄█████▄', '██   ██', '██   ██', '██   ██', '▀█████▀'],
  P: ['██████▄', '██   ██', '██████▀', '██     ', '▀█     '],
  Q: ['▄█████▄', '██   ██', '██   ██', '██ ▄▄██', '▀████▀█'],
  R: ['██████▄', '██   ██', '██████▀', '██ ▀█▄ ', '▀█  ▀█▄'],
  S: ['▄█████▄', '██▀▀▀▀▀', '▀█████▄', '▄▄▄▄▄██', '▀█████▀'],
  T: ['▀█████▀', '  ██   ', '  ██   ', '  ██   ', '  ▀█   '],
  U: ['██   ██', '██   ██', '██   ██', '██   ██', '▀█████▀'],
  V: ['██   ██', '██   ██', '██▄ ▄██', ' ██▄██ ', '  ▀█▀  '],
  W: ['██   ██', '██   ██', '██ █ ██', '███▀███', '▀█   █▀'],
  X: ['██   ██', ' ██ ██ ', '  ███  ', ' ██ ██ ', '▀█   █▀'],
  Y: ['██   ██', ' ██ ██ ', '  ███  ', '  ██   ', '  ▀█   '],
  Z: ['▀█████▀', '   ▄█▀ ', '  █▀   ', ' █▀▄▄▄▄', '▀██████'],
  '0': ['▄█████▄', '██  ▄██', '██ █ ██', '██▄▀ ██', '▀█████▀'],
  '1': ['  ▄██', '   ██', '   ██', '   ██', '  ▀██'],
  '2': ['▄█████▄', '▀▀▀▀▀██', '▄█████▀', '██▄▄▄▄▄', '▀██████'],
  '3': ['▄█████▄', '▀▀▀▀▀██', '  ████▀', '▄▄▄▄▄██', '▀█████▀'],
  '4': ['██   ██', '██   ██', '███████', '     ██', '     ▀█'],
  '5': ['███████', '██▄▄▄▄▄', '▀█████▄', '▄▄▄▄▄██', '▀█████▀'],
  '6': ['▄█████▄', '██▄▄▄▄▄', '██████▄', '██   ██', '▀█████▀'],
  '7': ['███████', '     ██', '    ██ ', '   ██  ', '  ▀█   '],
  '8': ['▄█████▄', '██   ██', '▄█████▄', '██   ██', '▀█████▀'],
  '9': ['▄█████▄', '██   ██', '▀██████', '▄▄▄▄▄██', '▀█████▀'],
  ' ': ['     ', '     ', '     ', '     ', '     '],
};

// Graffiti font (street art style)
const GRAFFITI_FONT: Record<string, string[]> = {
  A: ['   ▄▄   ', '  ████  ', ' ██  ██ ', '████████', '██    ██'],
  B: ['█████▄  ', '██   ██ ', '█████▀  ', '██   ██ ', '█████▀  '],
  C: [' ▄████▄ ', '██    ▀▀', '██      ', '██    ▄▄', ' ▀████▀ '],
  D: ['█████▄  ', '██   ██ ', '██   ██ ', '██   ██ ', '█████▀  '],
  E: ['███████ ', '██      ', '█████   ', '██      ', '███████ '],
  F: ['███████ ', '██      ', '█████   ', '██      ', '██      '],
  G: [' ▄████▄ ', '██    ▀▀', '██  ████', '██    ██', ' ▀████▀ '],
  H: ['██    ██', '██    ██', '████████', '██    ██', '██    ██'],
  I: ['████', ' ██ ', ' ██ ', ' ██ ', '████'],
  J: ['   ████', '     ██', '     ██', '██   ██', ' █████ '],
  K: ['██   ██ ', '██  ██  ', '█████   ', '██  ██  ', '██   ██ '],
  L: ['██      ', '██      ', '██      ', '██      ', '███████ '],
  M: ['███  ███', '████████', '██ ██ ██', '██    ██', '██    ██'],
  N: ['██    ██', '███   ██', '██ ██ ██', '██   ███', '██    ██'],
  O: [' ▄████▄ ', '██    ██', '██    ██', '██    ██', ' ▀████▀ '],
  P: ['█████▄  ', '██   ██ ', '█████▀  ', '██      ', '██      '],
  Q: [' ▄████▄ ', '██    ██', '██    ██', '██  ▄ ██', ' ▀████▀█'],
  R: ['█████▄  ', '██   ██ ', '█████▀  ', '██ ▀█▄  ', '██   ██ '],
  S: [' ▄█████▄', '██      ', ' ▀████▄ ', '      ██', '▀█████▀ '],
  T: ['████████', '   ██   ', '   ██   ', '   ██   ', '   ██   '],
  U: ['██    ██', '██    ██', '██    ██', '██    ██', ' ▀████▀ '],
  V: ['██    ██', '██    ██', ' ██  ██ ', '  ████  ', '   ██   '],
  W: ['██    ██', '██    ██', '██ ██ ██', '████████', '███  ███'],
  X: ['██    ██', ' ██  ██ ', '  ████  ', ' ██  ██ ', '██    ██'],
  Y: ['██    ██', ' ██  ██ ', '  ████  ', '   ██   ', '   ██   '],
  Z: ['████████', '    ▄██ ', '  ▄██   ', ' ██     ', '████████'],
  '0': [' ▄████▄ ', '██  ▄▄██', '██ █  ██', '██▄▄  ██', ' ▀████▀ '],
  '1': ['  ▄██', '   ██', '   ██', '   ██', '  ▀██'],
  '2': [' ▄████▄ ', '▀▀    ██', '  ████▀ ', ' ██     ', '████████'],
  '3': [' ▄████▄ ', '▀▀   ██ ', '   ███▀ ', '▄▄   ██ ', ' ▀████▀ '],
  '4': ['██    ██', '██    ██', '████████', '      ██', '      ██'],
  '5': ['████████', '██▄▄▄▄  ', '▀▀▀▀▀▀██', '▄▄    ██', ' ▀████▀ '],
  '6': [' ▄████▄ ', '██▄▄▄▄  ', '██████▄ ', '██    ██', ' ▀████▀ '],
  '7': ['████████', '     ▄██', '    ██  ', '   ██   ', '  ██    '],
  '8': [' ▄████▄ ', '██    ██', ' ▄████▄ ', '██    ██', ' ▀████▀ '],
  '9': [' ▄████▄ ', '██    ██', ' ▀██████', '▄▄▄▄▄ ██', ' ▀████▀ '],
  ' ': ['       ', '       ', '       ', '       ', '       '],
};

// Font map
const FONTS: Record<BigTextFont, Record<string, string[]>> = {
  block: BLOCK_FONT,
  small: SMALL_FONT,
  slant: SLANT_FONT,
  mini: MINI_FONT,
  banner: BANNER_FONT,
  standard: STANDARD_FONT,
  shadow: SHADOW_FONT,
  doom: DOOM_FONT,
  graffiti: GRAFFITI_FONT,
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get font definition for a character
 */
function getCharacter(char: string, font: BigTextFont): string[] {
  const fontDef = FONTS[font];
  const upperChar = char.toUpperCase();
  return fontDef[upperChar] || fontDef[' '] || [''];
}

/**
 * Get height of a font
 */
function getFontHeight(font: BigTextFont): number {
  const fontDef = FONTS[font];
  const sample = fontDef['A'] || [''];
  return sample.length;
}

/**
 * Apply color gradient to text
 */
function applyGradient(text: string, colors: ColorValue[], index: number): ColorValue {
  if (colors.length === 0) return 'white';
  if (colors.length === 1) return colors[0]!;
  return colors[index % colors.length]!;
}

// =============================================================================
// Component
// =============================================================================

/**
 * BigText - Large ASCII art text
 *
 * @example
 * // Simple block text
 * BigText({ text: 'HELLO', font: 'block', color: 'cyan' })
 *
 * @example
 * // With gradient
 * BigText({
 *   text: 'RAINBOW',
 *   font: 'banner',
 *   gradient: ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'],
 * })
 */
export function BigText(props: BigTextOptions): VNode {
  const {
    text,
    font = 'block',
    color = 'white',
    gradient,
    align = 'left',
    maxWidth,
    letterSpacing = 1,
  } = props;

  const height = getFontHeight(font);
  const chars = text.split('');

  // Build each line
  const lines: VNode[] = [];

  for (let row = 0; row < height; row++) {
    const lineParts: VNode[] = [];

    chars.forEach((char, i) => {
      const charDef = getCharacter(char, font);
      const charLine = charDef[row] || '';

      const charColor = gradient ? applyGradient(charLine, gradient, i) : color;

      lineParts.push(Text({ color: charColor }, charLine));

      // Add letter spacing (except after last character)
      if (i < chars.length - 1) {
        lineParts.push(Text({}, ' '.repeat(letterSpacing)));
      }
    });

    lines.push(
      Box({ flexDirection: 'row' }, ...lineParts)
    );
  }

  // Apply alignment if maxWidth is specified
  let containerProps: Record<string, unknown> = { flexDirection: 'column' };

  if (maxWidth && align !== 'left') {
    // For center/right alignment, we'd need to calculate total width and pad
    // For now, just use flexDirection
    containerProps = {
      flexDirection: 'column',
      width: maxWidth,
    };
  }

  return Box(containerProps as { flexDirection: 'column'; width?: number }, ...lines);
}

// =============================================================================
// Figlet-style text (simplified)
// =============================================================================

export interface FigletTextOptions {
  /** Text to display */
  text: string;
  /** Font style */
  font?: BigTextFont;
  /** Color */
  color?: ColorValue;
  /** Width constraint */
  width?: number;
}

/**
 * FigletText - Figlet-style ASCII art text
 *
 * @example
 * FigletText({ text: 'Welcome', font: 'banner' })
 */
export function FigletText(props: FigletTextOptions): VNode {
  const { text, font = 'banner', color = 'white', width } = props;

  return BigText({
    text,
    font,
    color,
    maxWidth: width,
  });
}

// =============================================================================
// Title - Styled title with underline
// =============================================================================

export interface BigTitleOptions {
  /** Title text */
  title: string;
  /** Subtitle (optional) */
  subtitle?: string;
  /** Font */
  font?: BigTextFont;
  /** Title color */
  color?: ColorValue;
  /** Subtitle color */
  subtitleColor?: ColorValue;
  /** Show underline */
  underline?: boolean;
  /** Underline character */
  underlineChar?: string;
}

/**
 * BigTitle - Large title with optional subtitle
 *
 * @example
 * BigTitle({
 *   title: 'MYAPP',
 *   subtitle: 'Version 2.0',
 *   font: 'small',
 *   color: 'cyan',
 * })
 */
export function BigTitle(props: BigTitleOptions): VNode {
  const {
    title,
    subtitle,
    font = 'block',
    color = 'white',
    subtitleColor = 'gray',
    underline = false,
    underlineChar = '═',
  } = props;

  const parts: VNode[] = [];

  // Main title
  parts.push(BigText({ text: title, font, color }));

  // Underline
  if (underline) {
    const width = title.length * 6; // Approximate width
    parts.push(Text({ color }, underlineChar.repeat(width)));
  }

  // Subtitle
  if (subtitle) {
    parts.push(
      Box(
        { marginTop: 1 },
        Text({ color: subtitleColor }, subtitle)
      )
    );
  }

  return Box({ flexDirection: 'column' }, ...parts);
}

// =============================================================================
// Logo - Centered logo display
// =============================================================================

export interface LogoOptions {
  /** Logo text */
  text: string;
  /** Font */
  font?: BigTextFont;
  /** Colors (gradient) */
  colors?: ColorValue[];
  /** Tagline */
  tagline?: string;
  /** Total width for centering */
  width?: number;
}

/**
 * Logo - Centered big text logo
 *
 * @example
 * Logo({
 *   text: 'TETIS',
 *   font: 'banner',
 *   colors: ['cyan', 'blue'],
 *   tagline: 'Cloud Infrastructure Platform',
 *   width: 80,
 * })
 */
export function Logo(props: LogoOptions): VNode {
  const { text, font = 'block', colors, tagline, width } = props;

  const parts: VNode[] = [];

  // Main logo
  if (colors && colors.length > 0) {
    parts.push(BigText({ text, font, gradient: colors }));
  } else {
    parts.push(BigText({ text, font, color: 'cyan' }));
  }

  // Tagline
  if (tagline) {
    parts.push(
      Box(
        { marginTop: 1 },
        Text({ color: 'gray', dim: true }, tagline)
      )
    );
  }

  return Box(
    {
      flexDirection: 'column',
      width,
    },
    ...parts
  );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * List all available BigText fonts
 *
 * @example
 * const fonts = listBigTextFonts();
 * // ['block', 'slant', 'small', 'standard', 'banner', 'mini', 'shadow', 'doom', 'graffiti']
 */
export function listBigTextFonts(): BigTextFont[] {
  return Object.keys(FONTS) as BigTextFont[];
}

/**
 * Get information about a BigText font
 *
 * @example
 * const info = getBigTextFontInfo('doom');
 * // { height: 5, sample: [...] }
 */
export function getBigTextFontInfo(font: BigTextFont): { height: number; sample: string[] } {
  const fontHeight = getFontHeight(font);
  const sampleChars = ['A', 'B', 'C'];
  const fontDef = FONTS[font];

  const sample: string[] = [];
  for (let row = 0; row < fontHeight; row++) {
    const lineParts: string[] = [];
    for (const char of sampleChars) {
      const charDef = fontDef[char] || [''];
      lineParts.push(charDef[row] || '');
    }
    sample.push(lineParts.join(' '));
  }

  return { height: fontHeight, sample };
}

/**
 * Render BigText to string array (no VNode, pure text)
 *
 * @example
 * const lines = renderBigText('HELLO', { font: 'block' });
 * console.log(lines.join('\n'));
 */
export function renderBigText(
  text: string,
  options: { font?: BigTextFont; letterSpacing?: number } = {}
): string[] {
  const { font = 'block', letterSpacing = 1 } = options;
  const fontHeight = getFontHeight(font);
  const chars = text.split('');
  const fontDef = FONTS[font];

  const lines: string[] = [];

  for (let row = 0; row < fontHeight; row++) {
    const lineParts: string[] = [];

    chars.forEach((char, i) => {
      const upperChar = char.toUpperCase();
      const charDef = fontDef[upperChar] || fontDef[' '] || [''];
      lineParts.push(charDef[row] || '');

      // Add letter spacing (except after last character)
      if (i < chars.length - 1) {
        lineParts.push(' '.repeat(letterSpacing));
      }
    });

    lines.push(lineParts.join(''));
  }

  return lines;
}

/**
 * Get the count of available BigText fonts
 *
 * @example
 * const count = getBigTextFontCount(); // 9
 */
export function getBigTextFontCount(): number {
  return Object.keys(FONTS).length;
}
