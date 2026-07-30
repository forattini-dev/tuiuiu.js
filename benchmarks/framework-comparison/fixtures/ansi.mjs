import { performance } from 'node:perf_hooks';

import { runCase } from '../lib/run-case.mjs';
import {
  ROW_COUNT,
  footerLine,
  headerLine,
  textLines,
} from '../lib/scenario.mjs';

const moduleStartedAt = performance.now();
const moduleLoadMs = performance.now() - moduleStartedAt;

function createAdapter({ scenario, stdout }) {
  function outputFor(tick) {
    if (scenario === 'localized') {
      return [
        `\u001B[1;1H${headerLine(tick)}`,
        `\u001B[${ROW_COUNT + 2};1H${footerLine(tick, scenario)}`,
      ].join('');
    }
    return `\u001B[H${textLines(tick, scenario).join('\n')}`;
  }

  return {
    async mount() {
      stdout.write(textLines(0, scenario).join('\n'));
    },

    async flush() {},

    async update(tick) {
      stdout.write(outputFor(tick));
    },

    async burst(startTick, iterations) {
      stdout.write(outputFor(startTick + iterations - 1));
    },

    async unmount() {},
  };
}

const scenario = process.env.TUIUIU_BENCH_SCENARIO;
const config = JSON.parse(process.env.TUIUIU_BENCH_CONFIG ?? '{}');
const result = await runCase({
  createAdapter,
  framework: 'ansi',
  moduleLoadMs,
  scenario,
  config,
});

process.stdout.write(`@@RESULT@@${JSON.stringify(result)}\n`);
