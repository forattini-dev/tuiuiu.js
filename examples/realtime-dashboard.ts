#!/usr/bin/env node
/**
 * Real-time Dashboard Example
 *
 * Demonstrates:
 * - Multiple animated spinners running simultaneously
 * - Real-time chart updates (sparklines, bar charts)
 * - Live metrics with random data simulation
 * - Different update rates for different widgets
 *
 * Run with: pnpm tsx examples/realtime-dashboard.ts
 */

import { Box, Text, Spacer, Divider } from '../src/primitives/index.js';
import { render } from '../src/app/render-loop.js';
import { createSignal, createEffect } from '../src/primitives/signal.js';
import { useState, useInput, useApp } from '../src/hooks/index.js';
import { createSpinner, renderSpinner } from '../src/components/spinner.js';
import type { VNode } from '../src/utils/types.js';

// ============================================================================
// Chart Helpers
// ============================================================================

const SPARK_CHARS = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(values: number[], width: number = 20): string {
  if (values.length === 0) return SPARK_CHARS[0].repeat(width);

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Take last `width` values
  const data = values.slice(-width);

  return data
    .map((v) => {
      const normalized = (v - min) / range;
      const index = Math.floor(normalized * (SPARK_CHARS.length - 1));
      return SPARK_CHARS[Math.max(0, Math.min(SPARK_CHARS.length - 1, index))];
    })
    .join('');
}

function progressBar(value: number, max: number, width: number): string {
  const filled = Math.floor((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(Math.floor(n));
}

// ============================================================================
// Real-time Data Generators
// ============================================================================

function createMetricsStore() {
  // CPU history (last 30 samples)
  const [cpuHistory, setCpuHistory] = createSignal<number[]>([]);
  const [cpuCurrent, setCpuCurrent] = createSignal(0);

  // Memory
  const [memUsed, setMemUsed] = createSignal(4.2 * 1024 * 1024 * 1024);
  const [memTotal] = createSignal(16 * 1024 * 1024 * 1024);

  // Network
  const [netIn, setNetIn] = createSignal(0);
  const [netOut, setNetOut] = createSignal(0);
  const [netInHistory, setNetInHistory] = createSignal<number[]>([]);
  const [netOutHistory, setNetOutHistory] = createSignal<number[]>([]);

  // Requests
  const [requestsPerSec, setRequestsPerSec] = createSignal(0);
  const [requestsHistory, setRequestsHistory] = createSignal<number[]>([]);
  const [totalRequests, setTotalRequests] = createSignal(0);

  // Errors
  const [errorRate, setErrorRate] = createSignal(0);
  const [errorsHistory, setErrorsHistory] = createSignal<number[]>([]);

  // Response time
  const [avgResponseTime, setAvgResponseTime] = createSignal(45);
  const [responseHistory, setResponseHistory] = createSignal<number[]>([]);

  // Active connections
  const [activeConnections, setActiveConnections] = createSignal(234);

  // Uptime
  const [uptimeSeconds, setUptimeSeconds] = createSignal(0);

  // Timers
  let timers: NodeJS.Timeout[] = [];

  const start = () => {
    // CPU update - every 500ms
    timers.push(
      setInterval(() => {
        const newCpu = Math.random() * 40 + 30 + Math.sin(Date.now() / 5000) * 20;
        setCpuCurrent(Math.min(100, Math.max(0, newCpu)));
        setCpuHistory((h) => [...h.slice(-29), newCpu]);
      }, 500)
    );

    // Memory update - every 2s
    timers.push(
      setInterval(() => {
        setMemUsed((m) => {
          const delta = (Math.random() - 0.5) * 100 * 1024 * 1024;
          return Math.max(2 * 1024 * 1024 * 1024, Math.min(14 * 1024 * 1024 * 1024, m + delta));
        });
      }, 2000)
    );

    // Network update - every 300ms
    timers.push(
      setInterval(() => {
        const newIn = Math.random() * 50 * 1024 * 1024 + 10 * 1024 * 1024;
        const newOut = Math.random() * 30 * 1024 * 1024 + 5 * 1024 * 1024;
        setNetIn(newIn);
        setNetOut(newOut);
        setNetInHistory((h) => [...h.slice(-19), newIn / 1024 / 1024]);
        setNetOutHistory((h) => [...h.slice(-19), newOut / 1024 / 1024]);
      }, 300)
    );

    // Requests update - every 200ms
    timers.push(
      setInterval(() => {
        const newRps = Math.random() * 500 + 800 + Math.sin(Date.now() / 3000) * 200;
        setRequestsPerSec(newRps);
        setRequestsHistory((h) => [...h.slice(-29), newRps]);
        setTotalRequests((t) => t + Math.floor(newRps / 5));
      }, 200)
    );

    // Errors update - every 1s
    timers.push(
      setInterval(() => {
        const newError = Math.random() * 3 + Math.random() > 0.9 ? 5 : 0;
        setErrorRate(newError);
        setErrorsHistory((h) => [...h.slice(-19), newError]);
      }, 1000)
    );

    // Response time update - every 400ms
    timers.push(
      setInterval(() => {
        const newTime = Math.random() * 30 + 35 + (Math.random() > 0.95 ? 100 : 0);
        setAvgResponseTime(newTime);
        setResponseHistory((h) => [...h.slice(-19), newTime]);
      }, 400)
    );

    // Connections update - every 500ms
    timers.push(
      setInterval(() => {
        setActiveConnections((c) => Math.max(100, Math.min(500, c + Math.floor((Math.random() - 0.5) * 20))));
      }, 500)
    );

    // Uptime update - every 1s
    timers.push(
      setInterval(() => {
        setUptimeSeconds((u) => u + 1);
      }, 1000)
    );
  };

  const stop = () => {
    timers.forEach(clearInterval);
    timers = [];
  };

  return {
    start,
    stop,
    cpuHistory,
    cpuCurrent,
    memUsed,
    memTotal,
    netIn,
    netOut,
    netInHistory,
    netOutHistory,
    requestsPerSec,
    requestsHistory,
    totalRequests,
    errorRate,
    errorsHistory,
    avgResponseTime,
    responseHistory,
    activeConnections,
    uptimeSeconds,
  };
}

// ============================================================================
// Components
// ============================================================================

function Header(props: { uptime: number }): VNode {
  const hours = Math.floor(props.uptime / 3600);
  const minutes = Math.floor((props.uptime % 3600) / 60);
  const seconds = props.uptime % 60;
  const uptimeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return Box(
    { borderStyle: 'double', borderColor: 'cyan', paddingX: 1, marginBottom: 1 },
    Text({ color: 'cyan', bold: true }, '🖥️  Real-time Dashboard'),
    Spacer({}),
    Text({ color: 'gray' }, `Uptime: ${uptimeStr}`),
    Text({ color: 'gray' }, ' | '),
    Text({ color: 'green' }, '● Live'),
    Text({ color: 'gray' }, ' | '),
    Text({ color: 'gray', dim: true }, 'Press Q to quit')
  );
}

function MetricCard(props: {
  title: string;
  value: string;
  unit?: string;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  sparkline?: string;
  width?: number;
}): VNode {
  const trendIcon =
    props.trend === 'up' ? '↑' : props.trend === 'down' ? '↓' : props.trend === 'stable' ? '→' : '';
  const trendColor = props.trend === 'up' ? 'green' : props.trend === 'down' ? 'red' : 'gray';

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: props.color as any,
      padding: 1,
      width: props.width || 25,
    },
    Box(
      { flexDirection: 'row' },
      Text({ color: 'gray', dim: true }, props.title),
      Spacer({}),
      trendIcon && Text({ color: trendColor as any }, trendIcon)
    ),
    Box(
      { marginTop: 1 },
      Text({ color: props.color as any, bold: true }, props.value),
      props.unit && Text({ color: 'gray' }, ` ${props.unit}`)
    ),
    props.sparkline &&
      Box({ marginTop: 1 }, Text({ color: props.color as any, dim: true }, props.sparkline))
  );
}

function CpuGauge(props: { value: number; history: number[] }): VNode {
  const color = props.value > 80 ? 'red' : props.value > 60 ? 'yellow' : 'green';
  const width = 20;
  const bar = progressBar(props.value, 100, width);

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      padding: 1,
      width: 35,
    },
    Text({ color: 'gray', dim: true }, 'CPU Usage'),
    Box(
      { marginTop: 1, flexDirection: 'row', gap: 1 },
      Text({ color }, `[${bar}]`),
      Text({ color, bold: true }, `${props.value.toFixed(1)}%`)
    ),
    Box({ marginTop: 1 }, Text({ color, dim: true }, sparkline(props.history, 30)))
  );
}

function MemoryGauge(props: { used: number; total: number }): VNode {
  const percent = (props.used / props.total) * 100;
  const color = percent > 85 ? 'red' : percent > 70 ? 'yellow' : 'cyan';
  const width = 20;
  const bar = progressBar(props.used, props.total, width);

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      padding: 1,
      width: 35,
    },
    Text({ color: 'gray', dim: true }, 'Memory'),
    Box(
      { marginTop: 1, flexDirection: 'row', gap: 1 },
      Text({ color }, `[${bar}]`),
      Text({ color, bold: true }, `${percent.toFixed(1)}%`)
    ),
    Box(
      { marginTop: 1 },
      Text({ color: 'gray' }, `${formatBytes(props.used)} / ${formatBytes(props.total)}`)
    )
  );
}

function NetworkWidget(props: {
  netIn: number;
  netOut: number;
  inHistory: number[];
  outHistory: number[];
}): VNode {
  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'magenta',
      padding: 1,
      width: 35,
    },
    Text({ color: 'gray', dim: true }, 'Network I/O'),
    Box(
      { marginTop: 1, flexDirection: 'row', gap: 2 },
      Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'green' }, '↓'),
          Text({ color: 'white' }, formatBytes(props.netIn) + '/s')
        ),
        Text({ color: 'green', dim: true }, sparkline(props.inHistory, 15))
      ),
      Box(
        { flexDirection: 'column' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, '↑'),
          Text({ color: 'white' }, formatBytes(props.netOut) + '/s')
        ),
        Text({ color: 'cyan', dim: true }, sparkline(props.outHistory, 15))
      )
    )
  );
}

function RequestsChart(props: { rps: number; history: number[]; total: number }): VNode {
  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'blue',
      padding: 1,
      width: 50,
    },
    Box(
      { flexDirection: 'row' },
      Text({ color: 'gray', dim: true }, 'Requests/sec'),
      Spacer({}),
      Text({ color: 'gray', dim: true }, `Total: ${formatNumber(props.total)}`)
    ),
    Box(
      { marginTop: 1 },
      Text({ color: 'blue', bold: true }, `${formatNumber(props.rps)} req/s`)
    ),
    Box({ marginTop: 1 }, Text({ color: 'blue' }, sparkline(props.history, 45)))
  );
}

function ErrorWidget(props: { rate: number; history: number[] }): VNode {
  const color = props.rate > 5 ? 'red' : props.rate > 2 ? 'yellow' : 'green';

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      padding: 1,
      width: 25,
    },
    Text({ color: 'gray', dim: true }, 'Error Rate'),
    Box({ marginTop: 1 }, Text({ color, bold: true }, `${props.rate.toFixed(2)}%`)),
    Box({ marginTop: 1 }, Text({ color, dim: true }, sparkline(props.history, 20)))
  );
}

function ResponseTimeWidget(props: { avg: number; history: number[] }): VNode {
  const color = props.avg > 100 ? 'red' : props.avg > 70 ? 'yellow' : 'green';

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      padding: 1,
      width: 25,
    },
    Text({ color: 'gray', dim: true }, 'Avg Response'),
    Box({ marginTop: 1 }, Text({ color, bold: true }, `${props.avg.toFixed(0)} ms`)),
    Box({ marginTop: 1 }, Text({ color, dim: true }, sparkline(props.history, 20)))
  );
}

function SpinnersDemo(): VNode {
  // Create multiple spinners with different styles
  const spinner1 = createSpinner({ style: 'dots', text: 'Fetching data...', rotateText: false });
  const spinner2 = createSpinner({ style: 'arc', text: 'Processing...', rotateText: false });
  const spinner3 = createSpinner({ style: 'clock', text: 'Syncing...', rotateText: false });
  const spinner4 = createSpinner({ style: 'earth', text: 'Worldwide...', rotateText: false });

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: 'yellow',
      padding: 1,
      width: 35,
    },
    Text({ color: 'gray', dim: true }, 'Active Processes'),
    Box({ marginTop: 1 }),
    renderSpinner(spinner1, { color: 'cyan', showTime: true, hint: '' }),
    renderSpinner(spinner2, { color: 'green', showTime: true, hint: '' }),
    renderSpinner(spinner3, { color: 'yellow', showTime: true, hint: '' }),
    renderSpinner(spinner4, { color: 'magenta', showTime: true, hint: '' })
  );
}

function StatusBar(props: { connections: number; fps: number }): VNode {
  return Box(
    { backgroundColor: 'blue', paddingX: 1, marginTop: 1 },
    Text({ color: 'white' }, '●'),
    Text({ color: 'white' }, ` ${props.connections} connections`),
    Spacer({}),
    Text({ color: 'white' }, `Render: ${props.fps} FPS`),
    Text({ color: 'gray' }, ' | '),
    Text({ color: 'white' }, new Date().toLocaleTimeString())
  );
}

// ============================================================================
// Main Dashboard App
// ============================================================================

function DashboardApp(): VNode {
  const app = useApp();
  const metrics = createMetricsStore();
  const [renderCount, setRenderCount] = useState(0);
  const [lastRenderTime, setLastRenderTime] = useState(Date.now());
  const [fps, setFps] = useState(0);

  // Start metrics collection
  metrics.start();

  // Track FPS
  createEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRenderTime();
    if (elapsed > 0) {
      setFps(Math.round(1000 / elapsed));
    }
    setLastRenderTime(now);
    setRenderCount((c) => c + 1);
  });

  // Handle input
  useInput((input, key) => {
    if (input === 'q' || key.escape) {
      metrics.stop();
      app.exit();
    }
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Header({ uptime: metrics.uptimeSeconds() }),

    // Row 1: CPU, Memory, Network
    Box(
      { flexDirection: 'row', gap: 1 },
      CpuGauge({ value: metrics.cpuCurrent(), history: metrics.cpuHistory() }),
      MemoryGauge({ used: metrics.memUsed(), total: metrics.memTotal() }),
      NetworkWidget({
        netIn: metrics.netIn(),
        netOut: metrics.netOut(),
        inHistory: metrics.netInHistory(),
        outHistory: metrics.netOutHistory(),
      })
    ),

    Box({ marginTop: 1 }),

    // Row 2: Requests chart, Spinners
    Box(
      { flexDirection: 'row', gap: 1 },
      RequestsChart({
        rps: metrics.requestsPerSec(),
        history: metrics.requestsHistory(),
        total: metrics.totalRequests(),
      }),
      SpinnersDemo()
    ),

    Box({ marginTop: 1 }),

    // Row 3: Error rate, Response time, Connections
    Box(
      { flexDirection: 'row', gap: 1 },
      ErrorWidget({ rate: metrics.errorRate(), history: metrics.errorsHistory() }),
      ResponseTimeWidget({ avg: metrics.avgResponseTime(), history: metrics.responseHistory() }),
      MetricCard({
        title: 'Active Connections',
        value: formatNumber(metrics.activeConnections()),
        color: 'cyan',
        trend: 'stable',
      })
    ),

    StatusBar({ connections: metrics.activeConnections(), fps: fps() })
  );
}

// ============================================================================
// Run
// ============================================================================

async function main() {
  console.log('Starting Real-time Dashboard...');
  console.log('FPS: 30 (default), updates: 200ms-2000ms depending on metric\n');

  const { waitUntilExit } = render(() => DashboardApp(), {
    maxFps: 30, // Default 30 FPS
  });

  await waitUntilExit();
  console.log('\nDashboard closed.');
}

main().catch(console.error);
