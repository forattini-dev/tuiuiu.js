export const TERMINAL_WIDTH = 120;
export const TERMINAL_HEIGHT = 40;
export const ROW_COUNT = 24;
export const OUTPUT_MARKER = 'runtime benchmark';

export function headerLine(tick) {
  return `${OUTPUT_MARKER} | tick ${String(tick).padStart(6, '0')}`;
}

export function workerLine(index, tick, scenario) {
  const value = scenario === 'full' ? tick + index * 17 : index * 17;
  const progress = scenario === 'full' ? (tick + index) % 20 : index % 20;
  const bar = `${'#'.repeat(progress)}${'.'.repeat(20 - progress)}`;
  return `worker ${String(index).padStart(3, '0')} | [${bar}] | state ready | value ${String(value).padStart(8, '0')}`;
}

export function footerLine(tick, scenario) {
  return `updates ${String(tick).padStart(6, '0')} | rows ${ROW_COUNT} | mode ${scenario}`;
}

export function textLines(tick, scenario) {
  return [
    headerLine(tick),
    ...Array.from(
      { length: ROW_COUNT },
      (_, index) => workerLine(index, tick, scenario),
    ),
    footerLine(tick, scenario),
  ];
}
