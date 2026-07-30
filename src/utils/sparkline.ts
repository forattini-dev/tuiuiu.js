import { getRenderMode } from '../core/capabilities.js';

export type SparklineRenderStyle = 'block' | 'braille' | 'ascii';

export const SPARKLINE_BLOCK_CHARS = '▁▂▃▄▅▆▇█';
export const SPARKLINE_ASCII_CHARS = '_.-:=*#@';
export const SPARKLINE_BRAILLE_BASE = 0x2800;

function resample(data: number[], width: number): number[] {
  if (data.length <= width) return data;
  const ratio = data.length / width;
  return Array.from({ length: width }, (_, index) => {
    const start = Math.floor(index * ratio);
    const end = Math.max(start + 1, Math.floor((index + 1) * ratio));
    const bucket = data
      .slice(start, end)
      .filter(Number.isFinite);
    return bucket.length > 0
      ? bucket.reduce((sum, value) => sum + value, 0) / bucket.length
      : 0;
  });
}

export function normalizeSparklineData(
  data: number[],
  min?: number,
  max?: number,
): { normalized: number[]; min: number; max: number } {
  if (data.length === 0) {
    return { normalized: [], min: 0, max: 0 };
  }

  const finite = data.filter(Number.isFinite);
  if (finite.length === 0) {
    return { normalized: data.map(() => 0), min: 0, max: 0 };
  }

  const actualMin = min ?? Math.min(...finite);
  const actualMax = max ?? Math.max(...finite);
  const range = actualMax - actualMin || 1;
  return {
    normalized: data.map((value) =>
      Number.isFinite(value) ? (value - actualMin) / range : 0
    ),
    min: actualMin,
    max: actualMax,
  };
}

/** Low-level sparkline text renderer shared by components in different layers. */
export function renderSparklineText(
  data: number[],
  options: {
    width?: number;
    min?: number;
    max?: number;
    style?: SparklineRenderStyle;
    emptyChar?: string;
  } = {},
): string {
  const width = Math.max(0, Math.floor(options.width ?? data.length));
  const emptyChar = options.emptyChar ?? ' ';
  if (data.length === 0) return emptyChar.repeat(width);

  const values = resample(data, width);
  const { normalized } = normalizeSparklineData(
    values,
    options.min,
    options.max,
  );
  const chars = options.style === 'ascii' || getRenderMode() === 'ascii'
    ? SPARKLINE_ASCII_CHARS
    : SPARKLINE_BLOCK_CHARS;
  const rendered = normalized.map((value) => {
    const index = Math.max(
      0,
      Math.min(chars.length - 1, Math.floor(value * chars.length)),
    );
    return chars[index]!;
  }).join('');
  return emptyChar.repeat(Math.max(0, width - values.length)) + rendered;
}
