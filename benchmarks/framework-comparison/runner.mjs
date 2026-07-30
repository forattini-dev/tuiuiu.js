import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { median, medianAbsoluteDeviation } from './lib/stats.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const resultsDirectory = path.join(here, 'results');
const quick = process.argv.includes('--quick');
const profile = quick ? 'quick' : 'full';
const frameworks = ['tuiuiu-root', 'tuiuiu-minimal', 'ink', 'ansi'];
const scenarios = ['localized', 'full'];
const frameworkLabels = {
  'tuiuiu-root': 'Tuiuiu (root)',
  'tuiuiu-minimal': 'Tuiuiu (minimal)',
  ink: 'Ink',
  ansi: 'Direct ANSI (reference)',
};

const profiles = {
  quick: {
    samples: 3,
    localized: {
      warmupIterations: 5,
      updateIterations: 20,
      burstIterations: 200,
      memoryIterations: 500,
    },
    full: {
      warmupIterations: 3,
      updateIterations: 12,
      burstIterations: 100,
      memoryIterations: 250,
    },
  },
  full: {
    samples: 7,
    localized: {
      warmupIterations: 15,
      updateIterations: 100,
      burstIterations: 1_000,
      memoryIterations: 5_000,
    },
    full: {
      warmupIterations: 10,
      updateIterations: 60,
      burstIterations: 500,
      memoryIterations: 2_000,
    },
  },
};

const selectedProfile = profiles[profile];

function rotate(values, offset) {
  const normalizedOffset = offset % values.length;
  return [...values.slice(normalizedOffset), ...values.slice(0, normalizedOffset)];
}

function runFixture(framework, scenario, config) {
  const fixture = path.join(here, 'fixtures', `${framework}.mjs`);

  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['--expose-gc', fixture], {
      cwd: here,
      env: {
        ...process.env,
        CI: 'false',
        FORCE_COLOR: '0',
        NO_COLOR: '1',
        TUIUIU_BENCH_CONFIG: JSON.stringify(config),
        TUIUIU_BENCH_SCENARIO: scenario,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error(`${framework}/${scenario} timed out after 120 seconds`));
    }, 120_000);

    child.stdout.setEncoding('utf8');
    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });
    child.stderr.setEncoding('utf8');
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
    child.on('exit', (code) => {
      clearTimeout(timeout);
      if (code !== 0) {
        reject(
          new Error(
            `${framework}/${scenario} exited with code ${code}\n${stderr || stdout}`,
          ),
        );
        return;
      }

      const resultLine = stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith('@@RESULT@@'));
      if (!resultLine) {
        reject(
          new Error(
            `${framework}/${scenario} did not produce a result\n${stderr || stdout}`,
          ),
        );
        return;
      }

      resolve(JSON.parse(resultLine.slice('@@RESULT@@'.length)));
    });
  });
}

function aggregate(samples) {
  const values = (selector) => samples.map(selector);
  const moduleLoadValues = values((sample) => sample.moduleLoadMs);
  const firstPaintValues = values((sample) => sample.processToFirstPaintMs);
  const updateP50Values = values((sample) => sample.updateLatencyMs.p50);
  return {
    framework: samples[0].framework,
    scenario: samples[0].scenario,
    samples: samples.length,
    moduleLoadMs: median(moduleLoadValues),
    processToFirstPaintMs: median(firstPaintValues),
    mountToFirstPaintMs: median(
      values((sample) => sample.mountToFirstPaintMs),
    ),
    updateLatencyMs: {
      p50: median(updateP50Values),
      p95: median(values((sample) => sample.updateLatencyMs.p95)),
      p99: median(values((sample) => sample.updateLatencyMs.p99)),
    },
    variationMadMs: {
      moduleLoad: medianAbsoluteDeviation(moduleLoadValues),
      processToFirstPaint: medianAbsoluteDeviation(firstPaintValues),
      updateP50: medianAbsoluteDeviation(updateP50Values),
    },
    avgUpdateBytes: median(values((sample) => sample.avgUpdateBytes)),
    avgUpdateWrites: median(values((sample) => sample.avgUpdateWrites)),
    burst: {
      iterations: samples[0].burst.iterations,
      durationMs: median(values((sample) => sample.burst.durationMs)),
      bytes: median(values((sample) => sample.burst.bytes)),
      writes: median(values((sample) => sample.burst.writes)),
    },
    memory: {
      iterations: samples[0].memory.iterations,
      heapGrowthBeforeGc: median(
        values((sample) => sample.memory.heapGrowthBeforeGc),
      ),
      retainedHeapGrowth: median(
        values((sample) => sample.memory.retainedHeapGrowth),
      ),
      rssGrowth: median(values((sample) => sample.memory.rssGrowth)),
    },
    totalOutputBytes: median(values((sample) => sample.totalOutputBytes)),
  };
}

function formatMs(value) {
  return value < 1 ? value.toFixed(3) : value.toFixed(2);
}

function formatBytes(value) {
  if (Math.abs(value) < 1_024) {
    return `${value.toFixed(0)} B`;
  }
  return `${(value / 1_024).toFixed(1)} KiB`;
}

function formatMemory(value) {
  return `${(value / (1024 * 1024)).toFixed(2)} MiB`;
}

function percentDifference(candidate, reference) {
  return ((candidate / reference) - 1) * 100;
}

function describeDifference(metric, candidate, reference, unit) {
  const difference = percentDifference(candidate, reference);
  const direction = difference <= 0 ? 'lower' : 'higher';
  return `- ${metric}: Tuiuiu was **${Math.abs(difference).toFixed(1)}% ${direction}** (${unit(candidate)} vs ${unit(reference)}).`;
}

function buildReport(metadata, aggregates) {
  const lines = [
    '# Tuiuiu vs Ink runtime benchmark',
    '',
    `- Profile: \`${metadata.profile}\``,
    `- Samples per framework/scenario: ${metadata.samples}`,
    `- Node: ${metadata.node}`,
    `- Platform: ${metadata.platform}`,
    `- CPU: ${metadata.cpu}`,
    `- Tuiuiu: ${metadata.versions.tuiuiu}`,
    `- Ink: ${metadata.versions.ink}`,
    `- React: ${metadata.versions.react}`,
    '',
    '> JSX syntax is not benchmarked because it is compiled away before runtime. The Ink fixture uses React.createElement, the runtime representation produced by JSX, while the Tuiuiu fixture uses its plain JavaScript API.',
    '',
    '> Direct ANSI output is a small handwritten reference, not an optimized lower bound. The product comparison is Tuiuiu versus Ink.',
    '',
  ];

  for (const scenario of scenarios) {
    const scenarioResults = Object.fromEntries(
      aggregates
        .filter((result) => result.scenario === scenario)
        .map((result) => [result.framework, result]),
    );
    lines.push(
      `## ${scenario === 'localized' ? 'Localized update' : 'Full-tree update'}`,
      '',
      '| Runtime | Module load | Process to first paint | Update p50 | Update p95 | Avg bytes/update | Burst | Retained heap |',
      '|---|---:|---:|---:|---:|---:|---:|---:|',
    );

    for (const framework of frameworks) {
      const result = scenarioResults[framework];
      lines.push(
        `| ${frameworkLabels[framework]} | ${formatMs(result.moduleLoadMs)} ms | ${formatMs(result.processToFirstPaintMs)} ms | ${formatMs(result.updateLatencyMs.p50)} ms | ${formatMs(result.updateLatencyMs.p95)} ms | ${formatBytes(result.avgUpdateBytes)} | ${formatMs(result.burst.durationMs)} ms / ${result.burst.iterations} | ${formatMemory(result.memory.retainedHeapGrowth)} |`,
      );
    }

    const tuiuiuRoot = scenarioResults['tuiuiu-root'];
    const tuiuiuMinimal = scenarioResults['tuiuiu-minimal'];
    const ink = scenarioResults.ink;
    lines.push(
      '',
      'Tuiuiu root relative to Ink:',
      '',
      describeDifference(
        'module load',
        tuiuiuRoot.moduleLoadMs,
        ink.moduleLoadMs,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'process to first paint',
        tuiuiuRoot.processToFirstPaintMs,
        ink.processToFirstPaintMs,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'update p50',
        tuiuiuRoot.updateLatencyMs.p50,
        ink.updateLatencyMs.p50,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'average output',
        tuiuiuRoot.avgUpdateBytes,
        ink.avgUpdateBytes,
        formatBytes,
      ),
      '',
      'Tuiuiu minimal relative to Ink:',
      '',
      describeDifference(
        'module load',
        tuiuiuMinimal.moduleLoadMs,
        ink.moduleLoadMs,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'process to first paint',
        tuiuiuMinimal.processToFirstPaintMs,
        ink.processToFirstPaintMs,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'update p50',
        tuiuiuMinimal.updateLatencyMs.p50,
        ink.updateLatencyMs.p50,
        (value) => `${formatMs(value)} ms`,
      ),
      describeDifference(
        'average output',
        tuiuiuMinimal.avgUpdateBytes,
        ink.avgUpdateBytes,
        formatBytes,
      ),
      '',
    );

    lines.push(
      'Run-to-run variation (median absolute deviation):',
      '',
      '| Runtime | Module load MAD | First paint MAD | Update p50 MAD |',
      '|---|---:|---:|---:|',
    );
    for (const framework of frameworks) {
      const result = scenarioResults[framework];
      lines.push(
        `| ${frameworkLabels[framework]} | ${formatMs(result.variationMadMs.moduleLoad)} ms | ${formatMs(result.variationMadMs.processToFirstPaint)} ms | ${formatMs(result.variationMadMs.updateP50)} ms |`,
      );
    }
    lines.push('');
  }

  lines.push(
    '## Interpretation rules',
    '',
    '- Results are medians of isolated processes, not in-process loops.',
    '- Lower is better for every reported metric.',
    '- Compare results on the same machine, Node version, terminal dimensions, and benchmark revision.',
    '- Do not turn a single local run into a marketing claim; confirm with repeated CI runs on Linux, Windows, and macOS.',
    '',
  );
  return lines.join('\n');
}

async function readJson(relativePath) {
  return JSON.parse(await readFile(path.join(here, relativePath), 'utf8'));
}

const rootPackage = await readJson('../../package.json');
const inkPackage = await readJson('node_modules/ink/package.json');
const reactPackage = await readJson('node_modules/react/package.json');
const rawSamples = [];

for (const scenario of scenarios) {
  const config = selectedProfile[scenario];
  for (let sample = 0; sample < selectedProfile.samples; sample += 1) {
    for (const framework of rotate(frameworks, sample)) {
      process.stdout.write(
        `[${scenario}] sample ${sample + 1}/${selectedProfile.samples}: ${framework}\n`,
      );
      rawSamples.push(await runFixture(framework, scenario, config));
    }
  }
}

const aggregates = scenarios.flatMap((scenario) =>
  frameworks.map((framework) =>
    aggregate(
      rawSamples.filter(
        (sample) =>
          sample.framework === framework && sample.scenario === scenario,
      ),
    ),
  ),
);
const metadata = {
  generatedAt: new Date().toISOString(),
  profile,
  samples: selectedProfile.samples,
  node: process.version,
  platform: `${process.platform} ${process.arch} ${os.release()}`,
  cpu: os.cpus()[0]?.model.trim() ?? 'unknown',
  versions: {
    tuiuiu: rootPackage.version,
    ink: inkPackage.version,
    react: reactPackage.version,
  },
};
const report = buildReport(metadata, aggregates);
const json = {
  metadata,
  config: selectedProfile,
  aggregates,
  rawSamples,
};

await mkdir(resultsDirectory, { recursive: true });
await Promise.all([
  writeFile(
    path.join(resultsDirectory, 'latest.json'),
    `${JSON.stringify(json, null, 2)}\n`,
  ),
  writeFile(path.join(resultsDirectory, 'latest.md'), `${report}\n`),
]);

if (process.env.GITHUB_STEP_SUMMARY) {
  await writeFile(process.env.GITHUB_STEP_SUMMARY, `${report}\n`, { flag: 'a' });
}

process.stdout.write(`\n${report}\n`);
