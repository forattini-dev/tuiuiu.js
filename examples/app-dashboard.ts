#!/usr/bin/env node
/**
 * Tuiuiu Dashboard - Real-time System Metrics
 *
 * A beautiful dashboard with live metrics, activity feed, and simulated data.
 *
 * Features:
 * - LCD-style big number displays
 * - Live activity feed with simulated requests
 * - Real-time charts and gauges
 * - Theme switching with Tab
 * - Multiple animated spinners
 *
 * Run with: pnpm tsx examples/app-dashboard.ts
 */

import {
  render,
  Box,
  Text,
  Spacer,
  createSignal,
  createEffect,
  useInput,
  useApp,
  setTheme,
  useTheme,
  getNextTheme,
  resolveColor,
} from '../src/index.js';
import { useTerminalSize } from '../src/hooks/index.js';
import { createSpinner, renderSpinner, type SpinnerStyle, type SpinnerState } from '../src/atoms/spinner.js';
import { ScrollArea } from '../src/organisms/scroll-area.js';
import type { VNode } from '../src/utils/types.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader, trackFrame, resetFps, getFps } from './_shared/tuiuiu-header.js';

// ============================================================================
// Constants
// ============================================================================

const MAX_LOG_ENTRIES = 100;
const MAX_SPARKLINE_HISTORY = 200; // Store enough data for wide terminals

// ============================================================================
// Utility Functions
// ============================================================================

const SPARK = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function sparkline(values: number[], width: number = 20): string {
  if (values.length === 0) return SPARK[0].repeat(width);

  // Take the last 'width' values
  const data = values.slice(-width);
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // Convert values to spark characters
  const sparks = data
    .map((v) => SPARK[Math.floor(((v - min) / range) * 7)])
    .join('');

  // Pad with minimum spark on the left if not enough data
  const padding = SPARK[0].repeat(Math.max(0, width - data.length));
  return padding + sparks;
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

function formatTime(secs: number): string {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
  if (r > 0.95) return { code: 500, color: resolveColor('error') };
  if (r > 0.90) return { code: 404, color: resolveColor('warning') };
  if (r > 0.85) return { code: 201, color: resolveColor('success') };
  return { code: 200, color: resolveColor('success') };
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
  '.': ['  ', '  ', '• '],
  ',': ['   ', '   ', ' ╷ '],
  '%': ['○ ╱', ' ╱ ', '╱ ○'],
  ' ': ['   ', '   ', '   '],
  'K': ['╻ ╱', '┣╸ ', '╹ ╲'],
  'M': ['┏┳┓', '┃┃┃', '╹ ╹'],
  '/': ['  ╱', ' ╱ ', '╱  '],
  's': ['╺┓ ', '━╸ ', '━┛ '],
};

function renderLCD(text: string, color: string, suffix?: string): VNode {
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
    // Suffix appears on the last line, right after the LCD digits
    Box(
      { flexDirection: 'row' },
      Text({ color: color as any }, lines[2]),
      suffix ? Text({ color: color as any, bold: true }, ` ${suffix}`) : null
    )
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
}

// ============================================================================
// Metrics Store
// ============================================================================

function createMetricsStore() {
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

  const [services, setServices] = createSignal([
    { name: 'api-gateway', status: 'running', cpu: 23, mem: 512 },
    { name: 'auth-service', status: 'running', cpu: 12, mem: 256 },
    { name: 'db-primary', status: 'running', cpu: 45, mem: 2048 },
    { name: 'cache-redis', status: 'running', cpu: 8, mem: 128 },
    { name: 'queue-worker', status: 'running', cpu: 34, mem: 384 },
  ]);

  let timers: NodeJS.Timeout[] = [];
  let logTimeout: NodeJS.Timeout | null = null;

  const start = () => {
    // RPS - every 100ms for smooth animation
    timers.push(setInterval(() => {
      const wave = Math.sin(Date.now() / 2000) * 200;
      const noise = (Math.random() - 0.5) * 100;
      const newRps = Math.max(800, Math.min(2000, 1200 + wave + noise));
      setRps(Math.round(newRps));
      setRpsHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newRps]);
      setTotalReqs(t => t + Math.round(newRps / 10));
    }, 100));

    // CPU - every 200ms
    timers.push(setInterval(() => {
      const wave = Math.sin(Date.now() / 3000) * 15;
      const spike = Math.random() > 0.95 ? 20 : 0;
      const newCpu = Math.max(15, Math.min(95, 45 + wave + spike + (Math.random() - 0.5) * 10));
      setCpu(Math.round(newCpu));
      setCpuHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newCpu]);
    }, 200));

    // Memory - every 500ms
    timers.push(setInterval(() => {
      setMem(m => {
        const delta = (Math.random() - 0.48) * 2;
        return Math.max(40, Math.min(85, m + delta));
      });
      setMemHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), mem()]);
    }, 500));

    // Latency - every 150ms
    timers.push(setInterval(() => {
      const base = 35 + Math.random() * 20;
      const spike = Math.random() > 0.92 ? Math.random() * 100 : 0;
      setLatency(Math.round(base + spike));
      setLatencyHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), latency()]);
    }, 150));

    // Errors - every 1s
    timers.push(setInterval(() => {
      const newErr = Math.random() > 0.9 ? Math.random() * 2 : Math.random() * 0.5;
      setErrors(Math.round(newErr * 100) / 100);
      setErrorsHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newErr]);
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
      const endpoint = randomEndpoint();
      const entry: LogEntry = {
        time: now.toLocaleTimeString('en-US', { hour12: false }),
        method: endpoint.split(' ')[0],
        path: endpoint.split(' ')[1],
        status: status.code,
        statusColor: status.color,
        latency: Math.round(randomLatency()),
      };
      setActivityLog(log => [entry, ...log.slice(0, MAX_LOG_ENTRIES - 1)]);
      logTimeout = setTimeout(addLogEntry, 50 + Math.random() * 250);
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
    if (logTimeout) clearTimeout(logTimeout);
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
  height?: number;
  color?: string;
  flexGrow?: number;
  children: (VNode | null)[];
}): VNode {
  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: (props.color || resolveColor('muted')) as any,
      width: props.width,
      height: props.height,
      flexGrow: props.flexGrow ?? (props.width ? undefined : 1),
      paddingX: 1,
      paddingBottom: 1,
    },
    Box(
      { marginBottom: 1 },
      Text({ color: resolveColor('mutedForeground'), dim: true }, props.title)
    ),
    ...props.children
  );
}

function BigMetric(props: {
  title: string;
  value: string;
  suffix?: string;
  color: string;
  spark?: string;
  sparkWidth?: number;
}): VNode {
  return Card({
    title: props.title,
    color: props.color,
    children: [
      renderLCD(props.value, props.color, props.suffix),
      props.spark ? Text({ color: props.color as any, dim: true }, props.spark) : null,
    ],
  });
}

function GaugeBar(props: {
  title: string;
  value: number;
  max: number;
  color: string;
  barWidth: number;
}): VNode {
  const pct = (props.value / props.max) * 100;
  const bar = progressBar(props.value, props.max, props.barWidth);

  return Box(
    { flexDirection: 'column' },
    Box(
      { flexDirection: 'row' },
      Text({ color: resolveColor('mutedForeground'), dim: true }, props.title),
      Spacer({}),
      Text({ color: props.color as any, bold: true }, `${pct.toFixed(0)}%`)
    ),
    Box(
      { marginTop: 1 },
      Text({ color: props.color as any }, bar)
    )
  );
}

function ActivityFeed(props: { entries: LogEntry[]; height: number }): VNode {
  // Convert entries to VNodes for ScrollArea
  const logContent = props.entries.map((e) =>
    Box(
      { flexDirection: 'row' },
      Text({ color: resolveColor('mutedForeground'), dim: true }, `${e.time} `),
      Text({ color: e.statusColor as any, bold: true }, `${e.status} `),
      Text({ color: resolveColor('primary') }, `${e.method.padEnd(6)} `),
      Text({ color: resolveColor('foreground') }, e.path.padEnd(16)),
      Text({ color: e.latency > 100 ? resolveColor('warning') : resolveColor('success') as any }, ` ${e.latency}ms`)
    )
  );

  return Card({
    title: `◉ LIVE REQUESTS (${props.entries.length}/${MAX_LOG_ENTRIES}) [↑↓/jk scroll]`,
    height: props.height + 4, // +4 for border and title
    color: resolveColor('primary'),
    children: [
      ScrollArea({
        height: props.height,
        content: logContent,
        showScrollbar: true,
        scrollbarColor: resolveColor('primary'),
        isActive: true, // Component handles its own keyboard input
      }),
    ],
  });
}

function ServicesList(props: { services: { name: string; status: string; cpu: number; mem: number }[] }): VNode {
  return Card({
    title: '◎ SERVICES',
    color: resolveColor('success'),
    children: props.services.map((s, i) =>
      Box(
        { flexDirection: 'row', key: i },
        Text({ color: resolveColor('success') }, '● '),
        Text({ color: resolveColor('foreground') }, s.name.padEnd(14)),
        Text({ color: s.cpu > 50 ? resolveColor('warning') : resolveColor('mutedForeground') as any }, `CPU:${s.cpu.toString().padStart(2)}% `),
        Text({ color: resolveColor('mutedForeground') }, `MEM:${s.mem}MB`)
      )
    ),
  });
}

function NetworkStats(props: { inMb: number; outMb: number; connections: number }): VNode {
  return Card({
    title: '◈ NETWORK',
    color: resolveColor('accent'),
    children: [
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('success') }, '↓ '),
        Text({ color: resolveColor('foreground'), bold: true }, `${props.inMb.toFixed(1)} MB/s`)
      ),
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('primary') }, '↑ '),
        Text({ color: resolveColor('foreground'), bold: true }, `${props.outMb.toFixed(1)} MB/s`)
      ),
      Box({ marginTop: 1 }),
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('mutedForeground') }, 'Connections: '),
        Text({ color: resolveColor('warning'), bold: true }, props.connections.toString())
      ),
    ],
  });
}

// Background jobs simulation
interface BackgroundJob {
  id: number;
  name: string;
  progress: number;
  status: 'running' | 'completed' | 'pending';
  startedAt: number;
  spinnerStyle: SpinnerStyle;
  spinner: SpinnerState;
}

const JOB_NAMES = [
  'Syncing data',
  'Processing queue',
  'Indexing files',
  'Compressing logs',
  'Rebuilding cache',
  'Uploading backup',
  'Analyzing metrics',
  'Optimizing tables',
  'Cleaning temp',
  'Validating checksums',
];

const SPINNER_STYLES: SpinnerStyle[] = ['dots', 'arc', 'bouncingBar', 'circle', 'arrow', 'bounce', 'line', 'moon', 'earth', 'clock'];

let jobIdCounter = 0;
const [backgroundJobs, setBackgroundJobs] = createSignal<BackgroundJob[]>([]);
let jobsInterval: NodeJS.Timeout | null = null;

function createJob(): BackgroundJob {
  const style = SPINNER_STYLES[Math.floor(Math.random() * SPINNER_STYLES.length)];
  return {
    id: jobIdCounter++,
    name: JOB_NAMES[Math.floor(Math.random() * JOB_NAMES.length)],
    progress: Math.floor(Math.random() * 30),
    status: 'running',
    startedAt: Date.now(),
    spinnerStyle: style,
    spinner: createSpinner({ style, text: '', rotateText: false }),
  };
}

function startBackgroundJobs() {
  // Initialize with 3 running jobs
  const initial: BackgroundJob[] = [createJob(), createJob(), createJob()];
  setBackgroundJobs(initial);

  // Update jobs every 200ms
  jobsInterval = setInterval(() => {
    setBackgroundJobs(jobs => {
      const updated = jobs.map(job => {
        if (job.status === 'completed') return job;

        // Increase progress
        const newProgress = Math.min(100, job.progress + Math.random() * 4);

        if (newProgress >= 100) {
          return { ...job, progress: 100, status: 'completed' as const };
        }
        return { ...job, progress: newProgress };
      });

      // Replace completed jobs with new ones after a delay
      const result = updated.map(job => {
        if (job.status === 'completed' && Date.now() - job.startedAt > 2500) {
          return createJob();
        }
        return job;
      });

      return result;
    });
  }, 200);
}

function SpinnersPanel(): VNode {
  // Start jobs simulation if not already running
  if (!jobsInterval) {
    startBackgroundJobs();
  }

  const jobs = backgroundJobs();

  return Card({
    title: `◐ BACKGROUND JOBS (${jobs.filter(j => j.status === 'running').length} running)`,
    color: resolveColor('warning'),
    children: jobs.map((job) => {
      const elapsed = Math.floor((Date.now() - job.startedAt) / 1000);
      const isComplete = job.status === 'completed';
      const barWidth = 12;
      const filledWidth = Math.floor((job.progress / 100) * barWidth);
      const progressBar = '█'.repeat(filledWidth) + '░'.repeat(barWidth - filledWidth);

      if (isComplete) {
        return Box(
          { flexDirection: 'row' },
          Text({ color: resolveColor('success'), bold: true }, '✓ '),
          Text({ color: resolveColor('success'), dim: true }, job.name.padEnd(18)),
          Text({ color: resolveColor('success') }, progressBar),
          Text({ color: resolveColor('muted'), dim: true }, ` done ${elapsed}s`),
        );
      }

      return Box(
        { flexDirection: 'row' },
        renderSpinner(job.spinner, { color: resolveColor('warning'), showTime: false, hint: '' }),
        Text({ color: resolveColor('foreground') }, job.name.padEnd(17)),
        Text({ color: resolveColor('primary') }, progressBar),
        Text({ color: resolveColor('muted'), dim: true }, ` ${Math.floor(job.progress).toString().padStart(2)}%`),
      );
    }),
  });
}

function Header(props: { uptime: number; totalReqs: number; width: number }): VNode {
  const theme = useTheme();

  return Box(
    {
      flexDirection: 'row',
      backgroundColor: resolveColor('primary'),
      width: props.width,
      paddingX: 1,
    },
    Text({ color: resolveColor('primaryForeground'), bold: true }, ' 🚀 SYSTEM DASHBOARD '),
    Spacer({}),
    Text({ color: resolveColor('primaryForeground') }, `[${theme.name}] `),
    Text({ color: resolveColor('primaryForeground') }, `Total: ${formatNum(props.totalReqs)} reqs `),
    Text({ color: resolveColor('primaryForeground'), dim: true }, '│ '),
    Text({ color: resolveColor('primaryForeground') }, `Uptime: ${formatTime(props.uptime)} `),
    Text({ color: resolveColor('primaryForeground'), dim: true }, '│ '),
    Text({ color: resolveColor('primaryForeground') }, `${getFps()} FPS`)
  );
}

function Footer(props: { width: number }): VNode {
  return Box(
    {
      flexDirection: 'row',
      backgroundColor: resolveColor('muted'),
      width: props.width,
      paddingX: 1,
    },
    Text({ color: resolveColor('foreground') }, ' [Q] Quit '),
    Text({ color: resolveColor('mutedForeground') }, '│'),
    Text({ color: resolveColor('foreground') }, ' [Tab] Theme '),
    Spacer({}),
    Text({ color: resolveColor('mutedForeground') }, new Date().toLocaleString())
  );
}

// ============================================================================
// Main Dashboard
// ============================================================================

// Create and start metrics store at module level (persists across renders)
const metricsStore = createMetricsStore();
metricsStore.start();

function Dashboard(): VNode {
  const app = useApp();
  const { columns: termWidth, rows: termHeight } = useTerminalSize();
  const m = metricsStore;

  // Calculate responsive widths
  const fullWidth = termWidth;
  const leftColWidth = Math.floor((termWidth - 1) / 2); // Left column (half)
  const rightColWidth = termWidth - leftColWidth - 1; // Right column (other half)

  // Card content width = card width - border(2) - paddingX(2) = card width - 4
  const bigMetricCardWidth = Math.floor((termWidth - 2) / 3); // 3 cards + 2 gaps
  const bigMetricContentWidth = bigMetricCardWidth - 4;
  const leftColContentWidth = leftColWidth - 4;

  // Activity feed: 30 visible lines, stores up to MAX_LOG_ENTRIES (100)
  const activityHeight = 30;

  resetFps();

  createEffect(() => {
    trackFrame();
    clearOldKeyPresses();
  });

  useInput(withKeyIndicator((input, key) => {
    if (input === 'q' || key.escape) {
      m.stop();
      app.exit();
    }

    if (key.tab) {
      const currentTheme = useTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
    }
  }));

  const cpuColor = m.cpu() > 80 ? resolveColor('error') : m.cpu() > 60 ? resolveColor('warning') : resolveColor('success');
  const memColor = m.mem() > 80 ? resolveColor('error') : m.mem() > 60 ? resolveColor('warning') : resolveColor('primary');
  const latColor = m.latency() > 100 ? resolveColor('error') : m.latency() > 60 ? resolveColor('warning') : resolveColor('success');
  const errColor = m.errors() > 1 ? resolveColor('error') : m.errors() > 0.5 ? resolveColor('warning') : resolveColor('success');

  // Calculate bar widths for gauges (content width - label "CPU" - percentage "100%")
  const gaugeBarWidth = Math.max(10, leftColContentWidth - 10);

  return Box(
    { flexDirection: 'column', width: fullWidth },

    // Header
    Header({ uptime: m.uptime(), totalReqs: m.totalReqs(), width: fullWidth }),

    // Row 1: Big Numbers (3 columns)
    Box(
      { flexDirection: 'row', marginTop: 1, width: fullWidth },
      BigMetric({
        title: '◆ REQUESTS/SEC',
        value: m.rps().toString(),
        suffix: '/s',
        color: resolveColor('primary'),
        spark: sparkline(m.rpsHistory(), bigMetricContentWidth),
      }),
      Box({ width: 1 }),
      BigMetric({
        title: '◆ AVG LATENCY',
        value: m.latency().toString(),
        suffix: 'ms',
        color: latColor,
        spark: sparkline(m.latencyHistory(), bigMetricContentWidth),
      }),
      Box({ width: 1 }),
      BigMetric({
        title: '◆ ERROR RATE',
        value: m.errors().toFixed(1),
        suffix: '%',
        color: errColor,
        spark: sparkline(m.errorsHistory(), bigMetricContentWidth),
      }),
    ),

    // Row 2: Two-column layout (Left: stacked cards, Right: Activity Feed full height)
    Box(
      { flexDirection: 'row', marginTop: 1, width: fullWidth },

      // Left Column: System Resources + Network + Services + Background Jobs
      Box(
        { flexDirection: 'column', width: leftColWidth },

        // System Gauges
        Card({
          title: '◇ SYSTEM RESOURCES',
          color: resolveColor('success'),
          width: leftColWidth,
          children: [
            GaugeBar({ title: 'CPU', value: m.cpu(), max: 100, color: cpuColor, barWidth: gaugeBarWidth }),
            Text({ color: cpuColor as any, dim: true }, sparkline(m.cpuHistory(), leftColContentWidth)),
            Box({ marginTop: 1 }),
            GaugeBar({ title: 'MEM', value: m.mem(), max: 100, color: memColor, barWidth: gaugeBarWidth }),
            Text({ color: memColor as any, dim: true }, sparkline(m.memHistory(), leftColContentWidth)),
          ],
        }),

        // Network Stats
        Box({ marginTop: 1 }),
        NetworkStats({
          inMb: m.bandwidth().in,
          outMb: m.bandwidth().out,
          connections: m.connections(),
        }),

        // Services List
        Box({ marginTop: 1 }),
        ServicesList({ services: m.services() }),

        // Background Jobs
        Box({ marginTop: 1 }),
        SpinnersPanel(),
      ),

      Box({ width: 1 }),

      // Right Column: Activity Feed (full height)
      ActivityFeed({ entries: m.activityLog(), height: activityHeight }),
    ),

    // Footer
    Box({ marginTop: 1 }),
    Footer({ width: fullWidth }),
    KeyIndicator(),
  );
}

// ============================================================================
// Run
// ============================================================================

const { waitUntilExit } = render(Dashboard, { autoTabNavigation: false });
await waitUntilExit();
