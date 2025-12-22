#!/usr/bin/env node
/**
 * Real-time Dashboard Example
 *
 * A beautiful, symmetric dashboard with live metrics simulation.
 *
 * Features:
 * - Big number displays with LCD-style digits
 * - Live activity feed with simulated requests
 * - Real-time charts and gauges
 * - Symmetric grid layout
 * - Multiple animated spinners
 *
 * Run with: pnpm tsx examples/app-dashboard.ts
 */

import { Box, Text, Spacer } from '../src/primitives/index.js';
import { render } from '../src/app/render-loop.js';
import { createSignal, createEffect } from '../src/primitives/signal.js';
import { useInput, useApp } from '../src/hooks/index.js';
import { createSpinner, renderSpinner } from '../src/atoms/spinner.js';
import type { VNode } from '../src/utils/types.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader, trackFrame, resetFps, getFps } from './_shared/tuiuiu-header.js';

// ============================================================================
// Constants
// ============================================================================

const CARD_WIDTH = 26;
const WIDE_CARD_WIDTH = 40;
const FULL_WIDTH = 82;

const COLORS = {
  primary: 'cyan',
  success: 'green',
  warning: 'yellow',
  error: 'red',
  info: 'blue',
  accent: 'magenta',
  muted: 'gray',
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(values: number[], width: number = 20): string {
  if (values.length === 0) return SPARK[0].repeat(width);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  return values
    .slice(-width)
    .map((v) => SPARK[Math.floor(((v - min) / range) * 7)])
    .join('');
}

function progressBar(value: number, max: number, width: number, filled = '█', empty = '░'): string {
  const pct = Math.min(1, Math.max(0, value / max));
  const filledCount = Math.round(pct * width);
  return filled.repeat(filledCount) + empty.repeat(width - filledCount);
}

function formatNum(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toString();
}

function formatBytes(b: number): string {
  if (b >= 1e9) return (b / 1e9).toFixed(1) + ' GB';
  if (b >= 1e6) return (b / 1e6).toFixed(1) + ' MB';
  if (b >= 1e3) return (b / 1e3).toFixed(1) + ' KB';
  return b + ' B';
}

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function randomIP(): string {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

function randomEndpoint(): string {
  const endpoints = [
    'GET /api/users',
    'POST /api/auth',
    'GET /api/products',
    'PUT /api/orders/:id',
    'DELETE /api/cache',
    'GET /api/metrics',
    'POST /api/webhook',
    'GET /api/health',
    'PATCH /api/settings',
    'GET /api/search?q=*',
  ];
  return endpoints[Math.floor(Math.random() * endpoints.length)];
}

function randomStatus(): { code: number; color: string } {
  const r = Math.random();
  if (r > 0.95) return { code: 500, color: 'red' };
  if (r > 0.90) return { code: 404, color: 'yellow' };
  if (r > 0.85) return { code: 201, color: 'green' };
  return { code: 200, color: 'green' };
}

function randomLatency(): number {
  const base = 20 + Math.random() * 80;
  return Math.random() > 0.9 ? base + Math.random() * 200 : base;
}

// ============================================================================
// LCD-Style Big Numbers
// ============================================================================

const LCD_DIGITS: Record<string, string[]> = {
  '0': ['┏━┓', '┃ ┃', '┗━┛'],
  '1': ['  ╻', '  ┃', '  ╹'],
  '2': ['╺━┓', '┏━┛', '┗━╸'],
  '3': ['╺━┓', '╺━┫', '╺━┛'],
  '4': ['╻ ╻', '┗━┫', '  ╹'],
  '5': ['┏━╸', '┗━┓', '╺━┛'],
  '6': ['┏━╸', '┣━┓', '┗━┛'],
  '7': ['╺━┓', '  ┃', '  ╹'],
  '8': ['┏━┓', '┣━┫', '┗━┛'],
  '9': ['┏━┓', '┗━┫', '╺━┛'],
  '.': ['   ', '   ', ' ● '],
  ',': ['   ', '   ', ' ╷ '],
  '%': ['○ ╱', ' ╱ ', '╱ ○'],
  ' ': ['   ', '   ', '   '],
  'K': ['╻ ╱', '┣╸ ', '╹ ╲'],
  'M': ['┏┳┓', '┃┃┃', '╹ ╹'],
  '/': ['  ╱', ' ╱ ', '╱  '],
  's': ['╺┓ ', '━╸ ', '━┛ '],
};

function renderLCD(text: string, color: string): VNode {
  const chars = text.split('');
  const lines: string[] = ['', '', ''];

  for (const char of chars) {
    const digit = LCD_DIGITS[char] || LCD_DIGITS[' '];
    lines[0] += digit[0];
    lines[1] += digit[1];
    lines[2] += digit[2];
  }

  return Box(
    { flexDirection: 'column' },
    Text({ color: color as any }, lines[0]),
    Text({ color: color as any }, lines[1]),
    Text({ color: color as any }, lines[2])
  );
}

// ============================================================================
// Activity Log Entry Type
// ============================================================================

interface LogEntry {
  time: string;
  method: string;
  path: string;
  status: number;
  statusColor: string;
  latency: number;
  ip: string;
}

// ============================================================================
// Metrics Store
// ============================================================================

function createMetricsStore() {
  // Core metrics
  const [rps, setRps] = createSignal(1247);
  const [rpsHistory, setRpsHistory] = createSignal<number[]>([]);
  const [totalReqs, setTotalReqs] = createSignal(0);

  const [cpu, setCpu] = createSignal(45);
  const [cpuHistory, setCpuHistory] = createSignal<number[]>([]);

  const [mem, setMem] = createSignal(62);
  const [memHistory, setMemHistory] = createSignal<number[]>([]);

  const [latency, setLatency] = createSignal(42);
  const [latencyHistory, setLatencyHistory] = createSignal<number[]>([]);

  const [errors, setErrors] = createSignal(0.2);
  const [errorsHistory, setErrorsHistory] = createSignal<number[]>([]);

  const [connections, setConnections] = createSignal(342);
  const [bandwidth, setBandwidth] = createSignal({ in: 45.2, out: 23.1 });

  const [uptime, setUptime] = createSignal(0);
  const [activityLog, setActivityLog] = createSignal<LogEntry[]>([]);

  // Simulated services
  const [services, setServices] = createSignal([
    { name: 'api-gateway', status: 'running', cpu: 23, mem: 512 },
    { name: 'auth-service', status: 'running', cpu: 12, mem: 256 },
    { name: 'db-primary', status: 'running', cpu: 45, mem: 2048 },
    { name: 'cache-redis', status: 'running', cpu: 8, mem: 128 },
    { name: 'queue-worker', status: 'running', cpu: 34, mem: 384 },
  ]);

  let timers: NodeJS.Timeout[] = [];

  const start = () => {
    // RPS - every 100ms for smooth animation
    timers.push(setInterval(() => {
      const wave = Math.sin(Date.now() / 2000) * 200;
      const noise = (Math.random() - 0.5) * 100;
      const newRps = Math.max(800, Math.min(2000, 1200 + wave + noise));
      setRps(Math.round(newRps));
      setRpsHistory(h => [...h.slice(-30), newRps]);
      setTotalReqs(t => t + Math.round(newRps / 10));
    }, 100));

    // CPU - every 200ms
    timers.push(setInterval(() => {
      const wave = Math.sin(Date.now() / 3000) * 15;
      const spike = Math.random() > 0.95 ? 20 : 0;
      const newCpu = Math.max(15, Math.min(95, 45 + wave + spike + (Math.random() - 0.5) * 10));
      setCpu(Math.round(newCpu));
      setCpuHistory(h => [...h.slice(-20), newCpu]);
    }, 200));

    // Memory - every 500ms
    timers.push(setInterval(() => {
      setMem(m => {
        const delta = (Math.random() - 0.48) * 2;
        return Math.max(40, Math.min(85, m + delta));
      });
      setMemHistory(h => [...h.slice(-20), mem()]);
    }, 500));

    // Latency - every 150ms
    timers.push(setInterval(() => {
      const base = 35 + Math.random() * 20;
      const spike = Math.random() > 0.92 ? Math.random() * 100 : 0;
      setLatency(Math.round(base + spike));
      setLatencyHistory(h => [...h.slice(-20), latency()]);
    }, 150));

    // Errors - every 1s
    timers.push(setInterval(() => {
      const newErr = Math.random() > 0.9 ? Math.random() * 2 : Math.random() * 0.5;
      setErrors(Math.round(newErr * 100) / 100);
      setErrorsHistory(h => [...h.slice(-20), newErr]);
    }, 1000));

    // Connections - every 300ms
    timers.push(setInterval(() => {
      setConnections(c => Math.max(200, Math.min(500, c + Math.floor((Math.random() - 0.5) * 30))));
    }, 300));

    // Bandwidth - every 200ms
    timers.push(setInterval(() => {
      setBandwidth({
        in: Math.round((40 + Math.random() * 30) * 10) / 10,
        out: Math.round((20 + Math.random() * 20) * 10) / 10,
      });
    }, 200));

    // Activity log - random intervals (50-300ms)
    const addLogEntry = () => {
      const now = new Date();
      const status = randomStatus();
      const entry: LogEntry = {
        time: now.toLocaleTimeString('en-US', { hour12: false }),
        method: randomEndpoint().split(' ')[0],
        path: randomEndpoint().split(' ')[1],
        status: status.code,
        statusColor: status.color,
        latency: Math.round(randomLatency()),
        ip: randomIP(),
      };
      setActivityLog(log => [entry, ...log.slice(0, 9)]);

      // Schedule next entry
      setTimeout(addLogEntry, 50 + Math.random() * 250);
    };
    addLogEntry();

    // Services status - every 2s
    timers.push(setInterval(() => {
      setServices(svcs => svcs.map(s => ({
        ...s,
        cpu: Math.max(5, Math.min(80, s.cpu + Math.floor((Math.random() - 0.5) * 10))),
      })));
    }, 2000));

    // Uptime - every 1s
    timers.push(setInterval(() => setUptime(u => u + 1), 1000));
  };

  const stop = () => {
    timers.forEach(clearInterval);
    timers = [];
  };

  return {
    start, stop,
    rps, rpsHistory, totalReqs,
    cpu, cpuHistory,
    mem, memHistory,
    latency, latencyHistory,
    errors, errorsHistory,
    connections, bandwidth,
    uptime, activityLog, services,
  };
}

// ============================================================================
// UI Components
// ============================================================================

function Card(props: {
  title: string;
  width?: number;
  color?: string;
  children: (VNode | null)[];
}): VNode {
  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: (props.color || COLORS.muted) as any,
      width: props.width || CARD_WIDTH,
      paddingX: 1,
    },
    Box(
      { marginBottom: 1 },
      Text({ color: 'gray', dim: true }, props.title)
    ),
    ...props.children
  );
}

function BigMetric(props: {
  title: string;
  value: string;
  suffix?: string;
  color: string;
  subtitle?: string;
  spark?: string;
  width?: number;
}): VNode {
  return Card({
    title: props.title,
    width: props.width || CARD_WIDTH,
    color: props.color,
    children: [
      renderLCD(props.value, props.color),
      props.suffix ? Text({ color: props.color as any, bold: true }, ` ${props.suffix}`) : null,
      props.subtitle ? Box({ marginTop: 1 }, Text({ color: 'gray', dim: true }, props.subtitle)) : null,
      props.spark ? Box({ marginTop: 1 }, Text({ color: props.color as any, dim: true }, props.spark)) : null,
    ],
  });
}

function GaugeBar(props: {
  title: string;
  value: number;
  max: number;
  color: string;
  width?: number;
  showPct?: boolean;
}): VNode {
  const pct = (props.value / props.max) * 100;
  const barWidth = (props.width || CARD_WIDTH) - 12;
  const bar = progressBar(props.value, props.max, barWidth);

  return Box(
    { flexDirection: 'column', width: props.width || CARD_WIDTH },
    Box(
      { flexDirection: 'row' },
      Text({ color: 'gray', dim: true }, props.title),
      Spacer({}),
      Text({ color: props.color as any, bold: true }, `${pct.toFixed(0)}%`)
    ),
    Box(
      { marginTop: 1 },
      Text({ color: props.color as any }, bar)
    )
  );
}

function ActivityFeed(props: { entries: LogEntry[] }): VNode {
  return Card({
    title: '◉ LIVE REQUESTS',
    width: WIDE_CARD_WIDTH,
    color: COLORS.info,
    children: props.entries.slice(0, 8).map((e, i) =>
      Box(
        { flexDirection: 'row', key: i },
        Text({ color: 'gray', dim: true }, `${e.time} `),
        Text({ color: e.statusColor as any, bold: true }, `${e.status} `),
        Text({ color: 'cyan' }, `${e.method.padEnd(6)} `),
        Text({ color: 'white' }, e.path.slice(0, 12).padEnd(13)),
        Text({ color: e.latency > 100 ? 'yellow' : 'green' as any }, ` ${e.latency}ms`)
      )
    ),
  });
}

function ServicesList(props: { services: { name: string; status: string; cpu: number; mem: number }[] }): VNode {
  return Card({
    title: '◎ SERVICES',
    width: WIDE_CARD_WIDTH,
    color: COLORS.success,
    children: props.services.map((s, i) =>
      Box(
        { flexDirection: 'row', key: i },
        Text({ color: 'green' }, '● '),
        Text({ color: 'white' }, s.name.padEnd(14)),
        Text({ color: s.cpu > 50 ? 'yellow' : 'gray' as any }, `CPU:${s.cpu.toString().padStart(2)}% `),
        Text({ color: 'gray' }, `MEM:${s.mem}MB`)
      )
    ),
  });
}

function NetworkStats(props: { inMb: number; outMb: number; connections: number }): VNode {
  return Card({
    title: '◈ NETWORK',
    width: CARD_WIDTH,
    color: COLORS.accent,
    children: [
      Box(
        { flexDirection: 'row' },
        Text({ color: 'green' }, '↓ '),
        Text({ color: 'white', bold: true }, `${props.inMb.toFixed(1)} MB/s`)
      ),
      Box(
        { flexDirection: 'row' },
        Text({ color: 'cyan' }, '↑ '),
        Text({ color: 'white', bold: true }, `${props.outMb.toFixed(1)} MB/s`)
      ),
      Box({ marginTop: 1 }),
      Box(
        { flexDirection: 'row' },
        Text({ color: 'gray' }, 'Connections: '),
        Text({ color: 'yellow', bold: true }, props.connections.toString())
      ),
    ],
  });
}

function SpinnersPanel(): VNode {
  const spinners = [
    createSpinner({ style: 'dots', text: 'Syncing data...', rotateText: false }),
    createSpinner({ style: 'arc', text: 'Processing queue...', rotateText: false }),
    createSpinner({ style: 'bouncingBar', text: 'Indexing...', rotateText: false }),
  ];

  return Card({
    title: '◐ BACKGROUND JOBS',
    width: CARD_WIDTH,
    color: COLORS.warning,
    children: spinners.map((s, i) =>
      renderSpinner(s, { color: ['cyan', 'green', 'magenta'][i], showTime: true, hint: '' })
    ),
  });
}

function Header(props: { uptime: number; totalReqs: number }): VNode {
  return Box(
    {
      flexDirection: 'row',
      backgroundColor: 'blue',
      width: FULL_WIDTH,
      paddingX: 1,
    },
    Text({ color: 'white', bold: true }, ' 🚀 SYSTEM DASHBOARD '),
    Spacer({}),
    Text({ color: 'cyan' }, `Total: ${formatNum(props.totalReqs)} reqs `),
    Text({ color: 'gray' }, '│ '),
    Text({ color: 'green' }, `Uptime: ${formatTime(props.uptime)} `),
    Text({ color: 'gray' }, '│ '),
    Text({ color: 'yellow' }, `${getFps()} FPS`)
  );
}

function Footer(): VNode {
  return Box(
    {
      flexDirection: 'row',
      backgroundColor: 'gray',
      width: FULL_WIDTH,
      paddingX: 1,
    },
    Text({ color: 'black' }, ' [Q] Quit '),
    Text({ color: 'black', dim: true }, '│'),
    Text({ color: 'black' }, ' [R] Refresh '),
    Spacer({}),
    Text({ color: 'black', dim: true }, new Date().toLocaleString())
  );
}

// ============================================================================
// Main Dashboard
// ============================================================================

function Dashboard(): VNode {
  const app = useApp();
  const metrics = createMetricsStore();

  resetFps();
  metrics.start();

  createEffect(() => {
    trackFrame();
    clearOldKeyPresses();
  });

  useInput(withKeyIndicator((input, key) => {
    if (input === 'q' || key.escape) {
      metrics.stop();
      app.exit();
    }
  }));

  const cpuColor = metrics.cpu() > 80 ? 'red' : metrics.cpu() > 60 ? 'yellow' : 'green';
  const memColor = metrics.mem() > 80 ? 'red' : metrics.mem() > 60 ? 'yellow' : 'cyan';
  const latColor = metrics.latency() > 100 ? 'red' : metrics.latency() > 60 ? 'yellow' : 'green';
  const errColor = metrics.errors() > 1 ? 'red' : metrics.errors() > 0.5 ? 'yellow' : 'green';

  return Box(
    { flexDirection: 'column' },

    // Header
    Header({ uptime: metrics.uptime(), totalReqs: metrics.totalReqs() }),

    // Row 1: Big Numbers
    Box(
      { flexDirection: 'row', marginTop: 1 },
      BigMetric({
        title: '◆ REQUESTS/SEC',
        value: formatNum(metrics.rps()),
        suffix: '/s',
        color: COLORS.primary,
        spark: sparkline(metrics.rpsHistory(), 22),
      }),
      Box({ width: 1 }),
      BigMetric({
        title: '◆ AVG LATENCY',
        value: metrics.latency().toString(),
        suffix: 'ms',
        color: latColor,
        spark: sparkline(metrics.latencyHistory(), 22),
      }),
      Box({ width: 1 }),
      BigMetric({
        title: '◆ ERROR RATE',
        value: metrics.errors().toFixed(1),
        suffix: '%',
        color: errColor,
        spark: sparkline(metrics.errorsHistory(), 22),
      }),
    ),

    // Row 2: Gauges + Activity
    Box(
      { flexDirection: 'row', marginTop: 1 },

      // Left: System Gauges
      Card({
        title: '◇ SYSTEM RESOURCES',
        width: WIDE_CARD_WIDTH,
        color: COLORS.success,
        children: [
          GaugeBar({ title: 'CPU', value: metrics.cpu(), max: 100, color: cpuColor, width: 36 }),
          Box({ marginTop: 1 }),
          Text({ color: cpuColor as any, dim: true }, sparkline(metrics.cpuHistory(), 34)),
          Box({ marginTop: 1 }),
          GaugeBar({ title: 'MEM', value: metrics.mem(), max: 100, color: memColor, width: 36 }),
          Box({ marginTop: 1 }),
          Text({ color: memColor as any, dim: true }, sparkline(metrics.memHistory(), 34)),
        ],
      }),

      Box({ width: 1 }),

      // Right: Activity Feed
      ActivityFeed({ entries: metrics.activityLog() }),
    ),

    // Row 3: Network + Services + Jobs
    Box(
      { flexDirection: 'row', marginTop: 1 },
      NetworkStats({
        inMb: metrics.bandwidth().in,
        outMb: metrics.bandwidth().out,
        connections: metrics.connections(),
      }),
      Box({ width: 1 }),
      ServicesList({ services: metrics.services() }),
      Box({ width: 1 }),
      SpinnersPanel(),
    ),

    // Footer
    Box({ marginTop: 1 }),
    Footer(),
    KeyIndicator(),
  );
}

// ============================================================================
// Run
// ============================================================================

async function main() {
  console.clear();
  const { waitUntilExit } = render(Dashboard, { maxFps: 30 });
  await waitUntilExit();
}

main().catch(console.error);
