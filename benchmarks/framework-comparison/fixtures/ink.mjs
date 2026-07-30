import { performance } from 'node:perf_hooks';

import { runCase } from '../lib/run-case.mjs';
import {
  ROW_COUNT,
  footerLine,
  headerLine,
  workerLine,
} from '../lib/scenario.mjs';

const moduleStartedAt = performance.now();
const [
  { Box, Text, render },
  { createElement, useState },
] = await Promise.all([
  import('ink'),
  import('react'),
]);
const moduleLoadMs = performance.now() - moduleStartedAt;

function createAdapter({ scenario, stdout, stderr, stdin }) {
  const staticRows = Array.from(
    { length: ROW_COUNT },
    (_, index) => createElement(
      Text,
      { key: `worker-${index}` },
      workerLine(index, 0, 'localized'),
    ),
  );
  let instance;
  let setTick;

  function view(tick) {
    const rows = scenario === 'localized'
      ? staticRows
      : Array.from(
          { length: ROW_COUNT },
          (_, index) => createElement(
            Text,
            { key: `worker-${index}` },
            workerLine(index, tick, scenario),
          ),
        );

    return createElement(
      Box,
      { flexDirection: 'column', width: '100%' },
      createElement(Text, { key: 'header' }, headerLine(tick)),
      ...rows,
      createElement(Text, { key: 'footer' }, footerLine(tick, scenario)),
    );
  }

  function App() {
    const [tick, updateTick] = useState(0);
    setTick = updateTick;
    return view(tick);
  }

  return {
    async mount() {
      instance = render(
        createElement(App),
        {
          stdout,
          stderr,
          stdin,
          debug: false,
          exitOnCtrlC: false,
          incrementalRendering: true,
          interactive: true,
          isScreenReaderEnabled: false,
          maxFps: 0,
          patchConsole: false,
        },
      );
      await instance.waitUntilRenderFlush();
    },

    async flush() {
      await instance.waitUntilRenderFlush();
    },

    async update(tick) {
      setTick(tick);
      await instance.waitUntilRenderFlush();
    },

    async burst(startTick, iterations) {
      for (let offset = 0; offset < iterations; offset += 1) {
        setTick(startTick + offset);
      }
      await instance.waitUntilRenderFlush();
    },

    async unmount() {
      instance.unmount();
      await instance.waitUntilExit();
    },
  };
}

const scenario = process.env.TUIUIU_BENCH_SCENARIO;
const config = JSON.parse(process.env.TUIUIU_BENCH_CONFIG ?? '{}');
const result = await runCase({
  createAdapter,
  framework: 'ink',
  moduleLoadMs,
  scenario,
  config,
});

process.stdout.write(`@@RESULT@@${JSON.stringify(result)}\n`);
