/**
 * Terminal-Adaptive Rendering Utilities
 *
 * Provides helpers that pick the best rendering variant based on
 * detected terminal capabilities. Components use these internally
 * to degrade gracefully across different terminal environments.
 */

import { getCapabilities } from './capabilities.js';
import { hasNerdFonts } from './progressive.js';

/**
 * Pick the best variant based on terminal capabilities.
 * First match wins.
 */
export function adaptive<T>(variants: {
  nerdFont?: T;
  unicode?: T;
  ascii: T;
}): T {
  if (variants.nerdFont !== undefined && hasNerdFonts()) return variants.nerdFont;
  const caps = getCapabilities();
  if (variants.unicode !== undefined && caps.unicode) return variants.unicode;
  return variants.ascii;
}

/**
 * Get the best underline style for the current terminal.
 * Falls back gracefully: styled variant -> simple boolean true
 */
export function adaptiveUnderline(
  preferred: 'curly' | 'dotted' | 'dashed' | 'double' | 'single' | true,
): 'curly' | 'dotted' | 'dashed' | 'double' | 'single' | true {
  const caps = getCapabilities();
  if (caps.styledUnderlines) return preferred;
  return true; // Simple underline fallback
}

/**
 * Get a color that degrades gracefully.
 * Returns the hex color if truecolor, otherwise a named ANSI color fallback.
 */
export function adaptiveColor(truecolor: string, ansi256Fallback?: string, basicFallback?: string): string {
  const caps = getCapabilities();
  if (caps.trueColor) return truecolor;
  if (caps.colors === 256 && ansi256Fallback) return ansi256Fallback;
  return basicFallback ?? truecolor;
}

/**
 * Capability query helpers
 */
export function canSyncOutput(): boolean { return !!getCapabilities().synchronizedOutput; }
export function canStyleUnderlines(): boolean { return !!getCapabilities().styledUnderlines; }
export function canColorUnderlines(): boolean { return !!getCapabilities().coloredUnderlines; }
export function canClipboard(): boolean { return !!getCapabilities().clipboard; }
export function canNotify(): boolean { return !!getCapabilities().notifications; }
export function canHyperlink(): boolean { return !!getCapabilities().hyperlinks; }
export function hasGpuAcceleration(): boolean { return !!getCapabilities().gpuAccelerated; }
export function getTerminalName(): string { return getCapabilities().profile?.name ?? getCapabilities().terminalName; }
