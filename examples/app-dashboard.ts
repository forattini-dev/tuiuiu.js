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
  useInteraction,
  useApp,
  setTheme,
  useTheme,
  resolveColor,
  Panel,
} from '../src/index.js';
import { Footer, Header, Main, Screen, getNextTheme } from '../src/ui/index.js';
import { Divider } from '../src/primitives/divider.js';
import { useTerminalSize } from '../src/hooks/index.js';
import { createSpinner, renderSpinner, getSpinnerConfig, type SpinnerStyle, type SpinnerState } from '../src/atoms/spinner.js';
import { ScrollPanel } from '../src/organisms/scroll-panel.js';
import type { BoxStyle, VNode } from '../src/utils/types.js';
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

function formatWhole(n: number): string {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
  ',': [' ', ' ', ','],
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
    Text({ color: color as any, wrap: 'truncate' }, lines[0]),
    Text({ color: color as any, wrap: 'truncate' }, lines[1]),
    // Suffix appears on the last line, right after the LCD digits
    Box(
      { flexDirection: 'row' },
      Text({ color: color as any, wrap: 'truncate' }, lines[2]),
      suffix ? Text({ color: color as any, bold: true, wrap: 'truncate' }, ` ${suffix}`) : null
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
  const [activeUsers, setActiveUsers] = createSignal(1620);
  const [activeUsersHistory, setActiveUsersHistory] = createSignal<number[]>([]);

  const [cpu, setCpu] = createSignal(45);
  const [cpuHistory, setCpuHistory] = createSignal<number[]>([]);

  const [mem, setMem] = createSignal(62);
  const [memHistory, setMemHistory] = createSignal<number[]>([]);

  const [latency, setLatency] = createSignal(42);
  const [latencyHistory, setLatencyHistory] = createSignal<number[]>([]);
  const [p95Latency, setP95Latency] = createSignal(86);
  const [p95LatencyHistory, setP95LatencyHistory] = createSignal<number[]>([]);

  const [errors, setErrors] = createSignal(0.2);
  const [errorsHistory, setErrorsHistory] = createSignal<number[]>([]);
  const [cacheHit, setCacheHit] = createSignal(98.2);
  const [cacheHitHistory, setCacheHitHistory] = createSignal<number[]>([]);

  const [connections, setConnections] = createSignal(342);
  const [queueDepth, setQueueDepth] = createSignal(42);
  const [queueDepthHistory, setQueueDepthHistory] = createSignal<number[]>([]);
  const [bandwidth, setBandwidth] = createSignal({ in: 45.2, out: 23.1 });
  const [packetLoss, setPacketLoss] = createSignal(0.12);
  const [rtt, setRtt] = createSignal(38);

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

    // Active users - every 400ms
    timers.push(setInterval(() => {
      const wave = Math.sin(Date.now() / 5000) * 350;
      const noise = (Math.random() - 0.5) * 180;
      const nextUsers = Math.max(600, Math.min(3200, 1600 + wave + noise));
      setActiveUsers(Math.round(nextUsers));
      setActiveUsersHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), nextUsers]);
    }, 400));

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
      const newLatency = Math.round(base + spike);
      const newP95 = Math.max(45, Math.min(260, newLatency + 25 + Math.random() * 60));
      setLatency(newLatency);
      setLatencyHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newLatency]);
      setP95Latency(Math.round(newP95));
      setP95LatencyHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newP95]);
    }, 150));

    // Errors - every 1s
    timers.push(setInterval(() => {
      const newErr = Math.random() > 0.9 ? Math.random() * 2 : Math.random() * 0.5;
      setErrors(Math.round(newErr * 100) / 100);
      setErrorsHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), newErr]);
      const hitBase = 97.6 + Math.sin(Date.now() / 4500) * 0.6;
      const hitJitter = (Math.random() - 0.5) * 0.8;
      const nextHit = Math.max(93.5, Math.min(99.9, hitBase + hitJitter - newErr * 0.4));
      setCacheHit(Math.round(nextHit * 10) / 10);
      setCacheHitHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), nextHit]);
    }, 1000));

    // Connections - every 300ms
    timers.push(setInterval(() => {
      setConnections(c => Math.max(200, Math.min(500, c + Math.floor((Math.random() - 0.5) * 30))));
      const nextQueue = Math.max(10, Math.min(240, queueDepth() + Math.floor((Math.random() - 0.5) * 24)));
      setQueueDepth(nextQueue);
      setQueueDepthHistory(h => [...h.slice(-MAX_SPARKLINE_HISTORY), nextQueue]);
    }, 300));

    // Bandwidth - every 200ms
    timers.push(setInterval(() => {
      setBandwidth({
        in: Math.round((40 + Math.random() * 30) * 10) / 10,
        out: Math.round((20 + Math.random() * 20) * 10) / 10,
      });
      const nextRtt = Math.max(12, Math.min(140, 32 + Math.sin(Date.now() / 3200) * 10 + (Math.random() - 0.5) * 8));
      const nextLoss = Math.max(0, Math.min(3, 0.08 + Math.random() * 0.35 + (Math.random() > 0.97 ? Math.random() * 2 : 0)));
      setRtt(Math.round(nextRtt));
      setPacketLoss(Math.round(nextLoss * 100) / 100);
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
    activeUsers, activeUsersHistory,
    cpu, cpuHistory,
    mem, memHistory,
    latency, latencyHistory,
    p95Latency, p95LatencyHistory,
    errors, errorsHistory,
    cacheHit, cacheHitHistory,
    connections, queueDepth, queueDepthHistory,
    bandwidth, packetLoss, rtt,
    uptime, activityLog, services,
  };
}

// ============================================================================
// UI Components
// ============================================================================

function Card(props: {
  title: string;
  width?: BoxStyle['width'];
  height?: BoxStyle['height'];
  minWidth?: number;
  color?: string;
  background?: string;
  flexGrow?: number;
  children: (VNode | null)[];
}): VNode {
  const content = props.children.filter(Boolean) as VNode[];

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      borderStyle: 'round',
      borderColor: (props.color || resolveColor('muted')) as any,
      backgroundColor: props.background as any,
      width: props.width,
      height: props.height,
      minWidth: props.minWidth,
      flexGrow: props.flexGrow,
      paddingX: 1,
    },
    Text({ color: 'mutedForeground', dim: true }, props.title),
    ...content
  );
}

/** Section inside a GroupedPanel - no borders, just content with title */
function Section(props: {
  title: string;
  color?: string;
  children: (VNode | null)[];
}): VNode {
  const content = props.children.filter(Boolean) as VNode[];

  return Box(
    { flexDirection: 'column', paddingX: 1, paddingY: 1 },
    Text({ color: 'mutedForeground', dim: true }, props.title),
    ...content
  );
}

/** GroupedPanel - Multiple sections with a single outer border
 *
 * Renders a single bordered container with multiple sections.
 * Uses simple separator lines between sections (not full dividers).
 */
function GroupedPanel(props: {
  sections: { title: string; content: (VNode | null)[]; }[];
  color?: string;
  background?: string;
  width?: BoxStyle['width'];
  flexGrow?: number;
}): VNode {
  const borderColor = (props.color || resolveColor('success')) as any;

  // Filter out sections with no content
  const validSections = props.sections.filter(s => s.content.some(c => c !== null));

  // Build section nodes with simple separator lines
  const sectionNodes: VNode[] = [];

  validSections.forEach((section, i) => {
    const content = section.content.filter(Boolean) as VNode[];

    // Add simple separator line between sections (just a text line, no box)
    if (i > 0) {
      sectionNodes.push(
        Text({ color: borderColor, dim: true }, '─'.repeat(50))
      );
    }

    // Section title
    sectionNodes.push(
      Text({ color: 'mutedForeground', dim: true }, section.title)
    );

    // Section content - add each item directly (no wrapper Box)
    content.forEach(item => {
      sectionNodes.push(item);
    });
  });

  return Box(
    {
      flexDirection: 'column',
      alignItems: 'stretch',
      borderStyle: 'round',
      borderColor: borderColor,
      backgroundColor: props.background as any,
      width: props.width,
      flexGrow: props.flexGrow,
      paddingX: 1,
    },
    ...sectionNodes
  );
}

function BigMetric(props: {
  title: string;
  value: string;
  suffix?: string;
  color: string;
  background?: string;
  spark?: string;
  width?: BoxStyle['width'];
  minWidth?: number;
  flexGrow?: number;
}): VNode {
  return Card({
    title: props.title,
    color: props.color,
    background: props.background,
    width: props.width,
    minWidth: props.minWidth,
    flexGrow: props.flexGrow,
    children: [
      renderLCD(props.value, props.color, props.suffix),
      props.spark ? Text({ color: props.color as any, dim: true, wrap: 'truncate' }, props.spark) : null,
    ],
  });
}

function CompactMetric(props: {
  title: string;
  value: string;
  color: string;
  flexGrow?: number;
}): VNode {
  return Card({
    title: props.title,
    color: props.color,
    flexGrow: props.flexGrow ?? 1,
    minWidth: 18,
    children: [
      Text({ color: props.color as any, bold: true }, props.value),
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
    Text({ color: props.color as any, wrap: 'truncate' }, bar)
  );
}

function ActivityFeed(props: { entries: LogEntry[]; background?: string; flexGrow?: number }): VNode {
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

  // Wrap ScrollPanel in a Box with background
  return Box(
    {
      flexDirection: 'column',
      flexGrow: props.flexGrow ?? 1,
      backgroundColor: props.background as any,
    },
    ScrollPanel({
      title: `◉ LIVE REQUESTS (${props.entries.length}/${MAX_LOG_ENTRIES}) [↑↓/jk scroll]`,
      borderColor: resolveColor('primary'),
      scrollbarColor: resolveColor('primary'),
      content: logContent,
      height: 'fill',
      showScrollbar: true,
      flexGrow: 1,
      isActive: true,
    })
  );
}

function ServicesList(props: {
  services: { name: string; status: string; cpu: number; mem: number }[];
  maxItems?: number;
  showOverflow?: boolean;
}): VNode {
  const maxItems = Math.max(1, props.maxItems ?? props.services.length);
  const visible = props.services.slice(0, maxItems);
  const overflow = props.showOverflow === false ? 0 : props.services.length - visible.length;

  return Card({
    title: '◎ SERVICES',
    color: resolveColor('success'),
    children: [
      ...visible.map((s, i) =>
        Box(
          { flexDirection: 'row', key: i },
          Text({ color: resolveColor('success') }, '● '),
          Text({ color: resolveColor('foreground') }, s.name.padEnd(14)),
          Text({ color: s.cpu > 50 ? resolveColor('warning') : resolveColor('mutedForeground') as any }, `CPU:${s.cpu.toString().padStart(2)}% `),
          Text({ color: resolveColor('mutedForeground') }, `MEM:${s.mem}MB`)
        )
      ),
      overflow > 0
        ? Text({ color: resolveColor('mutedForeground'), dim: true }, `+${overflow} more`)
        : null,
    ],
  });
}

function NetworkStats(props: {
  inMb: number;
  outMb: number;
  connections: number;
  rtt: number;
  packetLoss: number;
  compact?: boolean;
}): VNode {
  if (props.compact) {
    return Card({
      title: '◈ NETWORK',
      color: resolveColor('accent'),
      children: [
        Box(
          { flexDirection: 'row' },
          Text({ color: resolveColor('success') }, '↓ '),
          Text({ color: resolveColor('foreground'), bold: true }, `${props.inMb.toFixed(1)} MB/s`),
          Spacer({}),
          Text({ color: resolveColor('primary') }, '↑ '),
          Text({ color: resolveColor('foreground'), bold: true }, `${props.outMb.toFixed(1)} MB/s`)
        ),
        Box(
          { flexDirection: 'row' },
          Text({ color: resolveColor('mutedForeground') }, 'Conn '),
          Text({ color: resolveColor('warning'), bold: true }, props.connections.toString()),
          Text({ color: resolveColor('mutedForeground') }, '  RTT '),
          Text({ color: resolveColor('foreground'), bold: true }, `${props.rtt}ms`),
          Text({ color: resolveColor('mutedForeground') }, '  Loss '),
          Text(
            { color: props.packetLoss > 1 ? resolveColor('error') : resolveColor('success'), bold: true },
            `${props.packetLoss.toFixed(2)}%`
          )
        ),
      ],
    });
  }

  return Card({
    title: '◈ NETWORK',
    color: resolveColor('accent'),
    children: [
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('success') }, '↓ '),
        Text({ color: resolveColor('foreground'), bold: true }, `${props.inMb.toFixed(1)} MB/s`),
        Spacer({}),
        Text({ color: resolveColor('primary') }, '↑ '),
        Text({ color: resolveColor('foreground'), bold: true }, `${props.outMb.toFixed(1)} MB/s`)
      ),
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('mutedForeground') }, 'Connections '),
        Text({ color: resolveColor('warning'), bold: true }, props.connections.toString()),
        Spacer({}),
        Text({ color: resolveColor('mutedForeground') }, 'RTT '),
        Text({ color: resolveColor('foreground'), bold: true }, `${props.rtt}ms`)
      ),
      Box(
        { flexDirection: 'row' },
        Text({ color: resolveColor('mutedForeground') }, 'Pkt Loss '),
        Text(
          { color: props.packetLoss > 1 ? resolveColor('error') : resolveColor('success'), bold: true },
          `${props.packetLoss.toFixed(2)}%`
        )
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

function SpinnersPanel(props: { queueDepth: number; maxItems?: number }): VNode {
  // Start jobs simulation if not already running
  if (!jobsInterval) {
    startBackgroundJobs();
  }

  const jobs = backgroundJobs();
  const maxItems = Math.max(1, props.maxItems ?? jobs.length);
  const visible = jobs.slice(0, maxItems);

  return Card({
    title: `◐ BACKGROUND JOBS (${jobs.filter(j => j.status === 'running').length} running • Q:${props.queueDepth})`,
    color: resolveColor('warning'),
    children: visible.map((job) => {
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

function DashboardHeader(props: { uptime: number; totalReqs: number }): VNode {
  const theme = useTheme();

  return Header(
    {
      flexDirection: 'row',
      backgroundColor: resolveColor('primary'),
      width: 'fill',
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

function DashboardFooter(): VNode {
  return Footer(
    {
      flexDirection: 'row',
      backgroundColor: resolveColor('muted'),
      height: 1,
      marginTop: 1,
      width: 'fill',
      paddingX: 1,
    },
    Text({ color: resolveColor('foreground') }, '[Q] Quit '),
    Text({ color: resolveColor('mutedForeground') }, '│'),
    Text({ color: resolveColor('foreground') }, ' [Tab] Theme'),
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

  const compactMode = termHeight < 28;
  const showSecondRow = !compactMode && termHeight >= 34;
  const showBigSparks = !compactMode && termHeight >= 32;
  const showSystemSparks = !compactMode && termHeight >= 32;
  const showNetwork = termHeight >= 26;
  const compactNetwork = termHeight < 32;
  const showJobs = termHeight >= 36;
  const jobsToShow = termHeight >= 40 ? 3 : 2;

  const totalServices = m.services().length;
  const servicesVisible = termHeight >= 36
    ? totalServices
    : termHeight >= 30
      ? Math.min(4, totalServices)
      : Math.min(3, totalServices);
  const showServicesOverflow = servicesVisible < totalServices;

  const metricSparkWidth = Math.max(10, Math.floor(termWidth / 3) - 6);
  const metricMinWidth = Math.max(18, Math.floor(termWidth / 4));
  const leftColumnApprox = Math.max(24, Math.floor(termWidth / 2));
  const leftColContentWidth = Math.max(10, leftColumnApprox - 4);
  const gaugeBarWidth = leftColContentWidth; // Same width as sparkline for visual alignment

  // Theme backgrounds for cards
  const theme = useTheme();
  const cardBg = theme.background.surface;
  const panelBg = theme.background.subtle;

  resetFps();

  createEffect(() => {
    trackFrame();
  });

  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (input === 'q' || key.escape) {
      m.stop();
      app.exit();
    }

    if (key.tab) {
      const currentTheme = useTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
    }
  });

  const cpuColor = m.cpu() > 80 ? resolveColor('error') : m.cpu() > 60 ? resolveColor('warning') : resolveColor('success');
  const memColor = m.mem() > 80 ? resolveColor('error') : m.mem() > 60 ? resolveColor('warning') : resolveColor('primary');
  const latColor = m.latency() > 100 ? resolveColor('error') : m.latency() > 60 ? resolveColor('warning') : resolveColor('success');
  const p95Color = m.p95Latency() > 140 ? resolveColor('error') : m.p95Latency() > 100 ? resolveColor('warning') : resolveColor('success');
  const errColor = m.errors() > 1 ? resolveColor('error') : m.errors() > 0.5 ? resolveColor('warning') : resolveColor('success');
  const cacheColor = m.cacheHit() < 95 ? resolveColor('error') : m.cacheHit() < 97 ? resolveColor('warning') : resolveColor('success');
  const usersColor = resolveColor('accent');

  const primaryMetrics = compactMode
    ? Box(
        { flexDirection: 'row', gap: 1, alignItems: 'stretch' },
        CompactMetric({
          title: '◆ REQUESTS/SEC',
          value: `${m.rps().toString()}/s`,
          color: resolveColor('primary'),
        }),
        CompactMetric({
          title: '◆ AVG LATENCY',
          value: `${m.latency().toString()}ms`,
          color: latColor,
        }),
        CompactMetric({
          title: '◆ ERROR RATE',
          value: `${m.errors().toFixed(1)}%`,
          color: errColor,
        })
      )
    : Box(
        { flexDirection: 'row', gap: 1, alignItems: 'stretch' },
        BigMetric({
          title: '◆ REQUESTS/SEC',
          value: m.rps().toString(),
          suffix: '/s',
          color: resolveColor('primary'),
          background: cardBg,
          spark: showBigSparks ? sparkline(m.rpsHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        }),
        BigMetric({
          title: '◆ AVG LATENCY',
          value: m.latency().toString(),
          suffix: 'ms',
          color: latColor,
          background: cardBg,
          spark: showBigSparks ? sparkline(m.latencyHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        }),
        BigMetric({
          title: '◆ ERROR RATE',
          value: m.errors().toFixed(1),
          suffix: '%',
          color: errColor,
          background: cardBg,
          spark: showBigSparks ? sparkline(m.errorsHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        })
      );

  const secondaryMetrics = showSecondRow
    ? Box(
        { flexDirection: 'row', gap: 1, alignItems: 'stretch' },
        BigMetric({
          title: '◆ ACTIVE USERS',
          value: formatWhole(m.activeUsers()),
          suffix: 'usr',
          color: usersColor,
          background: cardBg,
          spark: showBigSparks ? sparkline(m.activeUsersHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        }),
        BigMetric({
          title: '◆ P95 LATENCY',
          value: m.p95Latency().toString(),
          suffix: 'ms',
          color: p95Color,
          background: cardBg,
          spark: showBigSparks ? sparkline(m.p95LatencyHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        }),
        BigMetric({
          title: '◆ CACHE HIT',
          value: m.cacheHit().toFixed(1),
          suffix: '%',
          color: cacheColor,
          background: cardBg,
          spark: showBigSparks ? sparkline(m.cacheHitHistory(), metricSparkWidth) : undefined,
          flexGrow: 1,
          minWidth: metricMinWidth,
        })
      )
    : null;

  return Screen(
    {},
    DashboardHeader({ uptime: m.uptime(), totalReqs: m.totalReqs() }),
    Main(
      { gap: 1 },
      primaryMetrics,
      secondaryMetrics,
      Box(
        { flexDirection: 'row', gap: 1, flexGrow: 1, alignItems: 'stretch' },
        GroupedPanel({
          color: resolveColor('success'),
          background: panelBg,
          flexGrow: 1,
          sections: [
            {
              title: '◇ SYSTEM RESOURCES',
              content: [
                GaugeBar({ title: 'CPU', value: m.cpu(), max: 100, color: cpuColor, barWidth: gaugeBarWidth }),
                showSystemSparks ? Text({ color: cpuColor as any, dim: true, wrap: 'truncate' }, sparkline(m.cpuHistory(), leftColContentWidth)) : null,
                GaugeBar({ title: 'MEM', value: m.mem(), max: 100, color: memColor, barWidth: gaugeBarWidth }),
                showSystemSparks ? Text({ color: memColor as any, dim: true, wrap: 'truncate' }, sparkline(m.memHistory(), leftColContentWidth)) : null,
              ],
            },
            ...(showNetwork ? [{
              title: '◈ NETWORK',
              content: [
                Box(
                  { flexDirection: 'row', gap: 2 },
                  Text({ color: resolveColor('success') as any }, `↓ ${m.bandwidth().in.toFixed(1)} MB/s`),
                  Text({ color: resolveColor('warning') as any }, `↑ ${m.bandwidth().out.toFixed(1)} MB/s`),
                  Text({ color: 'muted' as any }, `${m.connections()} conn`),
                  Text({ color: (m.rtt() > 100 ? resolveColor('error') : m.rtt() > 50 ? resolveColor('warning') : resolveColor('success')) as any }, `${m.rtt()}ms`),
                ),
              ],
            }] : []),
            {
              title: '◎ SERVICES',
              content: [
                ...m.services().slice(0, servicesVisible).map((s) =>
                  Box(
                    { flexDirection: 'row', gap: 1 },
                    Text({ color: s.status === 'running' ? resolveColor('success') as any : resolveColor('error') as any }, s.status === 'running' ? '●' : '○'),
                    Text({}, s.name),
                    Spacer({}),
                    Text({ color: 'muted' as any, dim: true }, `${s.cpu}% CPU · ${s.mem}MB`),
                  )
                ),
              ],
            },
            ...(showJobs ? [{
              title: '◆ BACKGROUND JOBS',
              content: [
                ...Array.from({ length: Math.min(jobsToShow, m.queueDepth()) }, (_, i) => {
                  const style: SpinnerStyle = (['dots', 'line', 'arc', 'bounce'] as const)[i % 4];
                  const config = getSpinnerConfig(style);
                  const frameIndex = Math.floor(Date.now() / config.interval) % config.frames.length;
                  const spinnerChar = config.frames[frameIndex];
                  return Box(
                    { flexDirection: 'row', gap: 1 },
                    Text({ color: resolveColor('primary') as any }, spinnerChar),
                    Text({}, `Job ${i + 1}`),
                    Spacer({}),
                    Text({ color: 'muted' as any, dim: true }, `${Math.floor(Math.random() * 100)}%`),
                  );
                }),
              ],
            }] : []),
          ],
        }),
        ActivityFeed({ entries: m.activityLog(), background: panelBg, flexGrow: 1 })
      )
    ),
    DashboardFooter()
  );
}

// ============================================================================
// Run
// ============================================================================

const { waitUntilExit } = render(Dashboard, { autoTabNavigation: false });
await waitUntilExit();
