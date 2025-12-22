/**
 * Tuiuiu Ping - Network Latency Monitor
 *
 * A beautiful ping utility with real-time latency visualization.
 *
 * Features:
 * - Real-time ping statistics with gauges
 * - Live latency graph with braille characters
 * - Packet loss tracking
 * - Theme switching with Tab
 *
 * Usage: pnpm example examples/ping.ts [host]
 * Example: pnpm example examples/ping.ts google.com
 */

import { spawn } from 'child_process';
import {
  render,
  Box,
  Text,
  createSignal,
  createEffect,
  useInput,
  useApp,
  LineChart,
  Gauge,
  Sparkline,
  setTheme,
  useTheme,
  getNextTheme,
  themeColor,
} from '../src/index.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader as SharedHeader, trackFrame, resetFps } from './_shared/tuiuiu-header.js';

// Types
interface PingStats {
  sent: number;
  received: number;
  lost: number;
  lossPercent: number;
  last: number;
  min: number;
  max: number;
  avg: number;
  jitter: number;
  history: number[];
  times: number[];
}

// Get target from command line
const target = process.argv[2] || '8.8.8.8';

// Signals
const [stats, setStats] = createSignal<PingStats>({
  sent: 0,
  received: 0,
  lost: 0,
  lossPercent: 0,
  last: -1,
  min: -1,
  max: -1,
  avg: -1,
  jitter: 0,
  history: [],
  times: [],
});
const [status, setStatus] = createSignal('Starting...');
const [isRunning, setIsRunning] = createSignal(true);
const [hostInfo, setHostInfo] = createSignal('');

// Helper: calculate jitter (average difference between consecutive pings)
function calculateJitter(history: number[]): number {
  if (history.length < 2) return 0;
  let totalDiff = 0;
  for (let i = 1; i < history.length; i++) {
    totalDiff += Math.abs(history[i]! - history[i - 1]!);
  }
  return totalDiff / (history.length - 1);
}

// Helper: get color based on latency (uses theme colors)
function getLatencyColor(ms: number): string {
  if (ms < 0) return themeColor('mutedForeground');
  if (ms < 50) return themeColor('success');
  if (ms < 100) return themeColor('warning');
  return themeColor('error');
}

// Helper: format duration
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

// Ping the host continuously
async function pingLoop() {
  const isWindows = process.platform === 'win32';
  const startTime = Date.now();

  while (isRunning()) {
    const pingStart = Date.now();

    try {
      const latency = await pingOnce(target, isWindows);
      const elapsed = Math.floor((Date.now() - startTime) / 1000);

      setStats(current => {
        const newHistory = [...current.history, latency].slice(-120);
        const newTimes = [...current.times, Date.now()].slice(-120);
        const validPings = newHistory.filter(v => v >= 0);

        const newStats: PingStats = {
          sent: current.sent + 1,
          received: latency >= 0 ? current.received + 1 : current.received,
          lost: latency < 0 ? current.lost + 1 : current.lost,
          lossPercent: 0,
          last: latency,
          min: validPings.length > 0 ? Math.min(...validPings) : -1,
          max: validPings.length > 0 ? Math.max(...validPings) : -1,
          avg: validPings.length > 0
            ? validPings.reduce((a, b) => a + b, 0) / validPings.length
            : -1,
          jitter: calculateJitter(validPings),
          history: newHistory,
          times: newTimes,
        };
        newStats.lossPercent = newStats.sent > 0
          ? (newStats.lost / newStats.sent) * 100
          : 0;

        return newStats;
      });

      setStatus(`${formatDuration(elapsed)}`);
      clearOldKeyPresses();
      trackFrame();
    } catch {
      setStats(current => ({
        ...current,
        sent: current.sent + 1,
        lost: current.lost + 1,
        lossPercent: ((current.lost + 1) / (current.sent + 1)) * 100,
        last: -1,
        history: [...current.history, -1].slice(-120),
        times: [...current.times, Date.now()].slice(-120),
      }));
    }

    // Wait for next ping (1 second interval)
    const elapsed = Date.now() - pingStart;
    const delay = Math.max(0, 1000 - elapsed);
    await new Promise(r => setTimeout(r, delay));
  }
}

// Ping once and return latency in ms
function pingOnce(host: string, isWindows: boolean): Promise<number> {
  return new Promise((resolve) => {
    const args = isWindows
      ? ['-n', '1', '-w', '1000', host]
      : ['-c', '1', '-W', '1', host];

    const proc = spawn('ping', args);
    let output = '';

    const timeout = setTimeout(() => {
      proc.kill();
      resolve(-1);
    }, 2000);

    proc.stdout.on('data', (data) => {
      output += data.toString();

      // Try to extract host info (IP resolution)
      if (!hostInfo()) {
        const hostMatch = output.match(/PING .+ \(([^)]+)\)/);
        if (hostMatch) {
          setHostInfo(hostMatch[1]!);
        }
      }
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        resolve(-1);
        return;
      }

      // Parse ping output for time
      const match = output.match(/time[=<](\d+\.?\d*)\s*ms/i);
      if (match) {
        resolve(parseFloat(match[1]!));
      } else {
        resolve(-1);
      }
    });

    proc.on('error', () => {
      clearTimeout(timeout);
      resolve(-1);
    });
  });
}

// Header component using shared TuiuiuHeader
function PingHeader() {
  const resolved = hostInfo() && hostInfo() !== target ? ` (${hostInfo()})` : '';
  return SharedHeader({
    title: `ping ${target}${resolved}`,
    status: status(),
  });
}

// Big latency display with gauge
function LatencyDisplay() {
  const s = stats();
  const width = Math.floor((process.stdout.columns || 80) / 3) - 2;

  // Normalize latency for gauge (0-200ms range)
  const normalizedLatency = s.last >= 0 ? Math.min(s.last / 200, 1) : 0;
  const latencyLabel = s.last >= 0 ? `${s.last.toFixed(1)}ms` : '---';

  return Box(
    { flexDirection: 'column', width, padding: 1 },
    Text({ color: themeColor('mutedForeground'), bold: true }, 'LATENCY'),
    Box({ height: 1 }),
    Gauge({
      value: normalizedLatency,
      width: width - 2,
      height: 1,
      showValue: false,
      color: s.last < 50 ? themeColor('success') : s.last < 100 ? themeColor('warning') : themeColor('error'),
      backgroundColor: themeColor('muted'),
    }),
    Box({ height: 1 }),
    Text({ color: getLatencyColor(s.last), bold: true },
      latencyLabel.padStart(Math.floor((width - 2) / 2) + latencyLabel.length / 2)
    ),
  );
}

// Statistics display
function StatsDisplay() {
  const s = stats();
  const width = Math.floor((process.stdout.columns || 80) / 3) - 2;

  return Box(
    { flexDirection: 'column', width, padding: 1 },
    Text({ color: themeColor('mutedForeground'), bold: true }, 'STATISTICS'),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Min'),
      Text({ color: themeColor('success') }, s.min >= 0 ? `${s.min.toFixed(1)}ms` : '---'),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Avg'),
      Text({ color: themeColor('warning') }, s.avg >= 0 ? `${s.avg.toFixed(1)}ms` : '---'),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Max'),
      Text({ color: themeColor('error') }, s.max >= 0 ? `${s.max.toFixed(1)}ms` : '---'),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Jitter'),
      Text({ color: themeColor('accent') }, s.jitter >= 0 ? `${s.jitter.toFixed(1)}ms` : '---'),
    ),
  );
}

// Packets display
function PacketsDisplay() {
  const s = stats();
  const width = Math.floor((process.stdout.columns || 80) / 3) - 2;
  const lossColor = s.lossPercent === 0 ? themeColor('success')
    : s.lossPercent < 5 ? themeColor('warning')
    : themeColor('error');

  return Box(
    { flexDirection: 'column', width, padding: 1 },
    Text({ color: themeColor('mutedForeground'), bold: true }, 'PACKETS'),
    Box({ height: 1 }),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Sent'),
      Text({ color: themeColor('foreground') }, `${s.sent}`),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Received'),
      Text({ color: themeColor('success') }, `${s.received}`),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Lost'),
      Text({ color: themeColor('error') }, `${s.lost}`),
    ),
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: themeColor('mutedForeground') }, 'Loss'),
      Text({ color: lossColor, bold: true }, `${s.lossPercent.toFixed(1)}%`),
    ),
  );
}

// Mini sparkline for recent pings
function RecentPings() {
  const s = stats();
  const width = (process.stdout.columns || 80) - 4;
  const recentPings = s.history.slice(-60).filter(v => v >= 0);

  if (recentPings.length < 2) {
    return Box(
      { paddingX: 1, marginTop: 1 },
      Text({ color: themeColor('mutedForeground'), dim: true }, 'Waiting for ping data...'),
    );
  }

  return Box(
    { flexDirection: 'column', paddingX: 1, marginTop: 1 },
    Box(
      { flexDirection: 'row', gap: 2 },
      Text({ color: themeColor('mutedForeground'), bold: true }, 'RECENT'),
      Sparkline({
        data: recentPings,
        width: width - 10,
        height: 1,
        color: themeColor('primary'),
      }),
    ),
  );
}

// Main latency graph
function LatencyGraph() {
  const s = stats();
  const width = (process.stdout.columns || 80) - 4;
  const height = Math.max(6, (process.stdout.rows || 24) - 14);
  const validHistory = s.history.filter(v => v >= 0);

  if (validHistory.length < 2) {
    return Box(
      { marginTop: 1, paddingX: 1, height: height + 3 },
      Box(
        { borderStyle: 'round', borderColor: themeColor('muted'), padding: 1, width },
        Text({ color: themeColor('mutedForeground'), dim: true }, '📈 Latency Graph - Collecting data...'),
      )
    );
  }

  const min = Math.min(...validHistory);
  const max = Math.max(...validHistory);
  const avg = validHistory.reduce((a, b) => a + b, 0) / validHistory.length;

  return Box(
    { flexDirection: 'column', marginTop: 1, paddingX: 1 },
    // Stats header
    Box(
      { flexDirection: 'row', gap: 2, marginBottom: 1 },
      Text({ color: themeColor('mutedForeground'), bold: true }, 'LATENCY HISTORY'),
      Text({ color: themeColor('mutedForeground') }, '│'),
      Text({ color: themeColor('success') }, `▼${min.toFixed(0)}ms`),
      Text({ color: themeColor('warning') }, `◆${avg.toFixed(0)}ms`),
      Text({ color: themeColor('error') }, `▲${max.toFixed(0)}ms`),
      Text({ color: themeColor('mutedForeground') }, '│'),
      Text({ color: themeColor('mutedForeground') }, `${validHistory.length} samples`),
    ),
    // LineChart
    LineChart({
      series: [{
        name: 'Latency',
        data: validHistory.slice(-100),
        color: themeColor('primary'),
      }],
      width: width - 12,
      height,
      yAxis: {
        show: true,
        min: Math.max(0, min - 5),
        max: max + 10,
        ticks: 4,
        formatter: (v: number) => `${v.toFixed(0)}ms`,
      },
      xAxis: {
        show: false,
      },
      showLegend: false,
      showGrid: true,
      gridColor: themeColor('muted'),
    }),
  );
}

// Footer with controls
function Footer() {
  return Box(
    { marginTop: 1, paddingX: 1 },
    Text({ color: themeColor('mutedForeground') },
      'Tab Theme  •  c Clear  •  q Quit'
    )
  );
}

// Main App
function App() {
  const app = useApp();

  useInput(withKeyIndicator((char, key) => {
    if (char === 'q' || key.escape) {
      setIsRunning(false);
      app.exit();
    }

    if (char === 'c') {
      // Clear stats
      setStats({
        sent: 0,
        received: 0,
        lost: 0,
        lossPercent: 0,
        last: -1,
        min: -1,
        max: -1,
        avg: -1,
        jitter: 0,
        history: [],
        times: [],
      });
    }

    if (key.tab) {
      // Cycle to next theme
      const currentTheme = useTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
    }
  }));

  return Box(
    { flexDirection: 'column' },
    PingHeader(),
    // Top row: Latency gauge, Stats, Packets
    Box(
      { flexDirection: 'row', marginTop: 1, paddingX: 1 },
      LatencyDisplay(),
      StatsDisplay(),
      PacketsDisplay(),
    ),
    // Recent pings sparkline
    RecentPings(),
    // Main graph
    LatencyGraph(),
    Footer(),
    KeyIndicator(),
  );
}

// Start the app
async function main() {
  resetFps();
  setStatus('connecting...');

  // Start the UI (disable autoTabNavigation so Tab can cycle themes)
  const { waitUntilExit } = render(App, { autoTabNavigation: false });

  // Start the ping loop
  pingLoop();

  await waitUntilExit();
  setIsRunning(false);
  process.exit(0);
}

main().catch(console.error);
