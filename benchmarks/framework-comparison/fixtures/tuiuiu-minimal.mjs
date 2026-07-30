import { performance } from 'node:perf_hooks';

import { runCase } from '../lib/run-case.mjs';
import { createTuiuiuAdapterFactory } from '../lib/tuiuiu-adapter.mjs';

const moduleStartedAt = performance.now();
const api = await import('../../../dist/minimal.js');
const moduleLoadMs = performance.now() - moduleStartedAt;
const createAdapter = createTuiuiuAdapterFactory(api);

const scenario = process.env.TUIUIU_BENCH_SCENARIO;
const config = JSON.parse(process.env.TUIUIU_BENCH_CONFIG ?? '{}');
const result = await runCase({
  createAdapter,
  framework: 'tuiuiu-minimal',
  moduleLoadMs,
  scenario,
  config,
});

process.stdout.write(`@@RESULT@@${JSON.stringify(result)}\n`);
