import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import {
  Box,
  Text,
  darkTheme,
  render,
  setTheme,
  useInput,
  useMouse,
  useState,
} from '../../src/index.js';
import { generateSGRMouseSequence } from '../../src/dev-tools/mouse-simulator.js';
import {
  benchmarkBurstScheduler,
  benchmarkLocalizedRuntime,
  createBenchmarkStdin,
  createBenchmarkStdout,
  isCI,
  waitForMacrotask,
} from './_shared/runtime-benchmark.js';

const describeOrSkip = isCI ? describe.skip : describe;

const STRESS_BUDGETS = {
  churn: { frame: 65, layout: 45, draw: 28, delta: 22 },
  localizedBoard: { frame: 28, delta: 12, ansi: 22 },
  fullBoard: { frame: 45, delta: 35, ansi: 28 },
  keyboardBurst: { burstMs: 150, maxRenders: 32 },
  mouseBurst: { burstMs: 180, maxRenders: 40 },
  schedulerBurst: { burstMs: 300, maxRenders: 2 },
} as const;

function buildStressCard(section: number, row: number, col: number, tick: number, hot: boolean) {
  const index = section * 1000 + row * 100 + col;
  const value = hot ? `${String(3000 + tick + index).padStart(4, '0')} ops` : '3000 ops';
  const borderColor = hot ? 'magentaBright' : col % 2 === 0 ? 'cyanBright' : 'blueBright';
  const backgroundColor = hot ? '#22162b' : section % 2 === 0 ? '#111827' : '#161d2c';

  return Box(
    {
      borderStyle: 'round',
      borderColor,
      backgroundColor,
      padding: 1,
      width: 18,
      height: 6,
    },
    Text({ color: hot ? 'yellowBright' : 'whiteBright', bold: true }, `Node ${index}`),
    Text({ color: hot ? 'greenBright' : 'green' }, value),
    Text({ color: hot ? 'cyanBright' : 'cyan' }, hot ? `tick ${tick}` : 'steady'),
    Text({ color: 'gray' }, hot ? 'localized churn' : 'stable branch'),
  );
}

function buildLargeTreeChurnDashboard(tick: number) {
  const sections = [];

  for (let section = 0; section < 5; section++) {
    const rows = [];

    for (let row = 0; row < 6; row++) {
      const cards = [];
      for (let col = 0; col < 8; col++) {
        const hot = section === (tick % 5) && (row + col + tick) % 5 === 0;
        cards.push(buildStressCard(section, row, col, tick, hot));
      }
      rows.push(Box({ flexDirection: 'row', columnGap: 1 }, ...cards));
    }

    sections.push(
      Box(
        { flexDirection: 'column', rowGap: 1 },
        Text({ color: 'whiteBright', bold: true }, `Section ${section + 1}`),
        ...rows,
      ),
    );
  }

  return Box(
    { flexDirection: 'column', padding: 1, rowGap: 1, width: 'fill' },
    Text({ color: 'cyanBright', bold: true }, 'Large Tree Churn Dashboard'),
    ...sections,
  );
}

function buildBoardLines(width: number, height: number, tick: number, mode: 'localized' | 'full'): string[] {
  const rows: string[] = [];

  for (let y = 0; y < height; y++) {
    let line = '';
    for (let x = 0; x < width; x++) {
      if (mode === 'localized') {
        const hot = x === tick % width && y === (tick * 3) % height;
        line += hot ? '@' : ((x + y) % 2 === 0 ? '·' : '•');
      } else {
        line += ((x + y + tick) % 4 === 0 ? '#' : (x + tick) % 3 === 0 ? '+' : '·');
      }
    }
    rows.push(line);
  }

  return rows;
}

function buildStressBoard(tick: number, mode: 'localized' | 'full') {
  const lines = buildBoardLines(80, 28, tick, mode);

  return Box(
    { flexDirection: 'column', width: 'fill', padding: 1 },
    Text({ color: mode === 'localized' ? 'greenBright' : 'yellowBright', bold: true }, `Board ${mode}`),
    Box(
      {
        flexDirection: 'column',
        borderStyle: 'round',
        borderColor: mode === 'localized' ? 'greenBright' : 'yellow',
        width: 82,
      },
      ...lines.map((line) => Text({}, line)),
    ),
  );
}

async function benchmarkKeyboardStorm(burstSize = 400) {
  const stdin = createBenchmarkStdin();
  const stdout = createBenchmarkStdout(120, 40);
  let renderCount = 0;
  let handledEvents = 0;
  let latestCount = 0;

  function App() {
    const [count, setCount] = useState(0);

    useInput((input) => {
      if (input === 'j') {
        handledEvents++;
        setCount(handledEvents);
        latestCount = handledEvents;
      }
    });

    return Box(
      { flexDirection: 'column', width: 20 },
      Text({ bold: true }, 'Keyboard storm'),
      Text({}, `count:${count()}`),
    );
  }

  const instance = render(
    () => {
      renderCount++;
      return App();
    },
    {
      stdin,
      stdout,
      clearOnStart: false,
      showCursor: false,
      useDeltaRenderer: false,
      maxFps: 0,
    },
  );

  const burstStart = performance.now();
  for (let index = 0; index < burstSize; index++) {
    stdin.emit('data', Buffer.from('j'));
  }
  await waitForMacrotask();
  const burstMs = performance.now() - burstStart;

  instance.unmount();

  return {
    burstMs,
    renderCount,
    handledEvents,
    finalCount: latestCount,
  };
}

async function benchmarkMouseStorm(burstSize = 240) {
  const stdin = createBenchmarkStdin();
  const stdout = createBenchmarkStdout(120, 40);
  let renderCount = 0;
  let handledEvents = 0;
  let latestCount = 0;

  function App() {
    const [count, setCount] = useState(0);

    useMouse((event) => {
      if ((event.action === 'click' || event.action === 'double-click') && event.button === 'left') {
        handledEvents++;
        setCount(handledEvents);
        latestCount = handledEvents;
      }
    });

    return Box(
      { flexDirection: 'column', width: 20 },
      Text({ bold: true }, 'Mouse storm'),
      Text({}, `count:${count()}`),
    );
  }

  const instance = render(
    () => {
      renderCount++;
      return App();
    },
    {
      stdin,
      stdout,
      clearOnStart: false,
      showCursor: false,
      useDeltaRenderer: false,
      maxFps: 0,
    },
  );

  const burstStart = performance.now();
  for (let index = 0; index < burstSize; index++) {
    stdin.emit('data', Buffer.from(generateSGRMouseSequence(10 + (index % 3), 8 + (index % 2), 'left', 'click')));
  }
  await waitForMacrotask();
  const burstMs = performance.now() - burstStart;

  instance.unmount();

  return {
    burstMs,
    renderCount,
    handledEvents,
    finalCount: latestCount,
  };
}

describeOrSkip('Runtime stress benchmarks', () => {
  beforeEach(() => {
    setTheme(darkTheme);
  });

  afterEach(() => {
    setTheme(darkTheme);
  });

  it('keeps a large partially churning tree within conservative local budgets', () => {
    const result = benchmarkLocalizedRuntime(
      (tick) => buildLargeTreeChurnDashboard(tick),
      { width: 180, height: 60 },
      10,
    );

    expect(result.drawCommands).toBeGreaterThan(1000);
    expect(result.avgFrameMs).toBeLessThan(STRESS_BUDGETS.churn.frame);
    expect(result.avgLayoutMs).toBeLessThan(STRESS_BUDGETS.churn.layout);
    expect(result.avgDrawCommandMs).toBeLessThan(STRESS_BUDGETS.churn.draw);
    expect(result.avgDeltaMs).toBeLessThan(STRESS_BUDGETS.churn.delta);
  });

  it('keeps localized board repaint materially cheaper than full repaint', () => {
    const localized = benchmarkLocalizedRuntime(
      (tick) => buildStressBoard(tick, 'localized'),
      { width: 120, height: 40 },
      12,
    );
    const full = benchmarkLocalizedRuntime(
      (tick) => buildStressBoard(tick, 'full'),
      { width: 120, height: 40 },
      12,
    );

    expect(localized.avgFrameMs).toBeLessThan(STRESS_BUDGETS.localizedBoard.frame);
    expect(localized.avgDeltaMs).toBeLessThan(STRESS_BUDGETS.localizedBoard.delta);
    expect(localized.avgAnsiMs).toBeLessThan(STRESS_BUDGETS.localizedBoard.ansi);

    expect(full.avgFrameMs).toBeLessThan(STRESS_BUDGETS.fullBoard.frame);
    expect(full.avgDeltaMs).toBeLessThan(STRESS_BUDGETS.fullBoard.delta);
    expect(full.avgAnsiMs).toBeLessThan(STRESS_BUDGETS.fullBoard.ansi);

    // Delta rendering trades a small amount of local CPU for substantially
    // less terminal I/O. Compare each resource directly instead of assuming
    // that producing a patch must be faster than producing a single string.
    expect(localized.avgDeltaBytes).toBeLessThan(localized.avgAnsiBytes);
    expect(localized.avgDeltaMs).toBeLessThan(full.avgDeltaMs);
    expect(localized.avgDeltaBytes).toBeLessThan(full.avgDeltaBytes);
  });

  it('coalesces keyboard bursts without runaway rerenders', async () => {
    const result = await benchmarkKeyboardStorm();

    expect(result.handledEvents).toBe(400);
    expect(result.finalCount).toBe(400);
    expect(result.renderCount).toBeLessThanOrEqual(STRESS_BUDGETS.keyboardBurst.maxRenders);
    expect(result.burstMs).toBeLessThan(STRESS_BUDGETS.keyboardBurst.burstMs);
  });

  it('coalesces mouse bursts without runaway rerenders', async () => {
    const result = await benchmarkMouseStorm();

    expect(result.handledEvents).toBe(240);
    expect(result.finalCount).toBe(240);
    expect(result.renderCount).toBeLessThanOrEqual(STRESS_BUDGETS.mouseBurst.maxRenders);
    expect(result.burstMs).toBeLessThan(STRESS_BUDGETS.mouseBurst.burstMs);
  });

  it('survives heavier scheduler bursts with bounded rerenders', async () => {
    const result = await benchmarkBurstScheduler(
      (tick) => buildLargeTreeChurnDashboard(tick),
      { width: 180, height: 60 },
      1000,
    );

    expect(result.finalValue).toBe(1000);
    expect(result.renderCount).toBeLessThanOrEqual(STRESS_BUDGETS.schedulerBurst.maxRenders);
    expect(result.burstMs).toBeLessThan(STRESS_BUDGETS.schedulerBurst.burstMs);
  });
});
