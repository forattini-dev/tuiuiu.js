/**
 * MTR (My Traceroute) Clone
 *
 * A network diagnostic tool that combines traceroute and ping.
 * Shows the route to a destination with real-time latency statistics.
 *
 * Usage: pnpm example examples/mtr.ts [host]
 * Example: pnpm example examples/mtr.ts google.com
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
  setTheme,
  useTheme,
  getNextTheme,
  themeColor,
} from '../src/index.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';

// Types
interface HopStats {
  hop: number;
  host: string;
  ip: string;
  loss: number;
  sent: number;
  recv: number;
  last: number;
  avg: number;
  best: number;
  worst: number;
  stdev: number;
  history: number[];
}

// Get target from command line
const target = process.argv[2] || '8.8.8.8';

// Signals
const [hops, setHops] = createSignal<HopStats[]>([]);
const [status, setStatus] = createSignal('Discovering route...');
const [isRunning, setIsRunning] = createSignal(true);
const [selectedHop, setSelectedHop] = createSignal(0);

// Helper: calculate standard deviation
function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

// Helper: get color based on latency (uses theme colors)
function getLatencyColor(ms: number): string {
  if (ms < 0) return themeColor('mutedForeground');
  if (ms < 50) return themeColor('success');
  if (ms < 100) return themeColor('warning');
  return themeColor('error');
}

// Helper: get color based on packet loss (uses theme colors)
function getLossColor(loss: number): string {
  if (loss === 0) return themeColor('success');
  if (loss < 10) return themeColor('warning');
  return themeColor('error');
}

// Helper: format number with fixed width
function pad(value: number | string, width: number, decimals = 1): string {
  const str = typeof value === 'number'
    ? (value < 0 ? '-' : value.toFixed(decimals))
    : value;
  return str.padStart(width);
}

// Discover route using traceroute
async function discoverRoute(): Promise<HopStats[]> {
  return new Promise((resolve) => {
    const discovered: HopStats[] = [];

    // Use traceroute (Linux) or tracert (Windows)
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'tracert' : 'traceroute';
    const args = isWindows
      ? ['-d', '-h', '30', target]
      : ['-n', '-m', '30', '-q', '1', '-w', '2', target];

    const proc = spawn(cmd, args);
    let buffer = '';

    proc.stdout.on('data', (data) => {
      buffer += data.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        // Parse traceroute output
        // Linux format: " 1  192.168.1.1  1.234 ms"
        // Also handles: " 1  * * *"
        const match = line.match(/^\s*(\d+)\s+(?:(\d+\.\d+\.\d+\.\d+)|(\*))\s*/);
        if (match) {
          const hopNum = parseInt(match[1], 10);
          const ip = match[2] || '*';

          // Check if we already have this hop
          if (!discovered.find(h => h.hop === hopNum)) {
            discovered.push({
              hop: hopNum,
              host: ip === '*' ? '???' : ip,
              ip: ip,
              loss: ip === '*' ? 100 : 0,
              sent: 0,
              recv: 0,
              last: -1,
              avg: -1,
              best: -1,
              worst: -1,
              stdev: 0,
              history: [],
            });

            setHops([...discovered]);
            setStatus(`Discovering route... ${discovered.length} hops`);
          }
        }
      }
    });

    proc.on('close', () => {
      if (discovered.length === 0) {
        // Fallback: create a simple path
        discovered.push({
          hop: 1,
          host: target,
          ip: target,
          loss: 0,
          sent: 0,
          recv: 0,
          last: -1,
          avg: -1,
          best: -1,
          worst: -1,
          stdev: 0,
          history: [],
        });
      }
      resolve(discovered);
    });

    proc.on('error', () => {
      // Traceroute not available, create minimal path
      discovered.push({
        hop: 1,
        host: target,
        ip: target,
        loss: 0,
        sent: 0,
        recv: 0,
        last: -1,
        avg: -1,
        best: -1,
        worst: -1,
        stdev: 0,
        history: [],
      });
      resolve(discovered);
    });
  });
}

// Ping a single host and return latency in ms
async function pingHost(host: string): Promise<number> {
  return new Promise((resolve) => {
    if (host === '*' || host === '???') {
      resolve(-1);
      return;
    }

    const isWindows = process.platform === 'win32';
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
    });

    proc.on('close', (code) => {
      clearTimeout(timeout);

      if (code !== 0) {
        resolve(-1);
        return;
      }

      // Parse ping output for time
      // Linux: "time=1.23 ms" or "time=1.23ms"
      // Windows: "time=1ms" or "time<1ms"
      const match = output.match(/time[=<](\d+\.?\d*)\s*ms/i);
      if (match) {
        resolve(parseFloat(match[1]));
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

// Update stats for a hop
function updateHopStats(hopIndex: number, latency: number) {
  setHops(currentHops => {
    const updated = [...currentHops];
    const hop = updated[hopIndex];
    if (!hop) return currentHops;

    hop.sent++;

    if (latency >= 0) {
      hop.recv++;
      hop.last = latency;
      hop.history.push(latency);

      // Keep last 100 samples
      if (hop.history.length > 100) {
        hop.history.shift();
      }

      // Calculate stats
      hop.best = Math.min(...hop.history);
      hop.worst = Math.max(...hop.history);
      hop.avg = hop.history.reduce((a, b) => a + b, 0) / hop.history.length;
      hop.stdev = stddev(hop.history);
    }

    hop.loss = hop.sent > 0 ? ((hop.sent - hop.recv) / hop.sent) * 100 : 0;

    return updated;
  });
}

// Main ping loop
async function pingLoop() {
  while (isRunning()) {
    const currentHops = hops();

    // Ping all hops in parallel
    const promises = currentHops.map((hop, index) =>
      pingHost(hop.ip).then(latency => updateHopStats(index, latency))
    );

    await Promise.all(promises);
    setStatus(`Pinging ${currentHops.length} hops to ${target}`);
    clearOldKeyPresses();

    // Small delay between rounds
    await new Promise(r => setTimeout(r, 100));
  }
}

// Header component (same style as htop)
function TuiuiuHeader() {
  const theme = useTheme();
  const width = process.stdout.columns || 80;
  const title = ' 🐦 Tuiuiu mtr ';
  const subtitle = ` Network Diagnostics → ${target} `;
  const themeLabel = ` [${theme.name}] `;
  const statusText = ` ${status()} `;
  const padding = Math.max(0, width - title.length - subtitle.length - themeLabel.length - statusText.length);

  const headerBg = themeColor('primary');
  const headerFg = themeColor('primaryForeground');

  return Box(
    { flexDirection: 'row', backgroundColor: headerBg },
    Text({ color: headerFg, bold: true }, title),
    Text({ color: themeColor('accent') }, subtitle),
    Text({ color: themeColor('warning'), bold: true }, themeLabel),
    Text({ color: headerFg, backgroundColor: headerBg }, ' '.repeat(padding)),
    Text({ color: themeColor('secondary') }, statusText)
  );
}

// Table header
function TableHeader() {
  return Box(
    { flexDirection: 'row', paddingX: 1, marginTop: 1, backgroundColor: themeColor('secondary') },
    Text({ color: themeColor('secondaryForeground'), bold: true },
      `${'#'.padStart(3)} ${'Host'.padEnd(24)} ${'Loss'.padStart(5)} ${'Snt'.padStart(4)} ${'Last'.padStart(6)} ${'Avg'.padStart(6)} ${'Best'.padStart(6)} ${'Wrst'.padStart(6)} ${'StDv'.padStart(5)}`
    )
  );
}

// Single hop row
function HopRow({ hop, index }: { hop: HopStats; index: number }) {
  const isSelected = selectedHop() === index;
  const hostDisplay = hop.host.length > 22
    ? hop.host.substring(0, 19) + '...'
    : hop.host.padEnd(24);

  const bgColor = isSelected ? themeColor('primary') : undefined;
  const selectedFg = isSelected ? themeColor('primaryForeground') : undefined;

  return Box(
    {
      flexDirection: 'row',
      paddingX: 1,
      backgroundColor: bgColor,
    },
    Text({ color: selectedFg ?? themeColor('accent') }, pad(hop.hop, 3, 0) + ' '),
    Text({ color: selectedFg ?? (hop.ip === '*' ? themeColor('mutedForeground') : themeColor('foreground')) }, hostDisplay + ' '),
    Text({ color: selectedFg ?? getLossColor(hop.loss) }, pad(hop.loss, 4, 0) + '% '),
    Text({ color: selectedFg ?? themeColor('foreground') }, pad(hop.sent, 4, 0) + ' '),
    Text({ color: selectedFg ?? getLatencyColor(hop.last) }, (hop.last >= 0 ? pad(hop.last, 6) : '     -') + ' '),
    Text({ color: selectedFg ?? getLatencyColor(hop.avg) }, (hop.avg >= 0 ? pad(hop.avg, 6) : '     -') + ' '),
    Text({ color: selectedFg ?? getLatencyColor(hop.best) }, (hop.best >= 0 ? pad(hop.best, 6) : '     -') + ' '),
    Text({ color: selectedFg ?? getLatencyColor(hop.worst) }, (hop.worst >= 0 ? pad(hop.worst, 6) : '     -') + ' '),
    Text({ color: selectedFg ?? themeColor('mutedForeground') }, pad(hop.stdev, 5))
  );
}

// Latency graph for selected hop (using LineChart for better visualization)
function LatencyGraph() {
  const currentHops = hops();
  const selected = currentHops[selectedHop()];
  const width = Math.min(80, (process.stdout.columns || 80) - 10);

  if (!selected || selected.history.length === 0) {
    return Box(
      { marginTop: 1, paddingX: 1, borderStyle: 'round', borderColor: themeColor('muted') },
      Box(
        { flexDirection: 'column', padding: 1 },
        Text({ color: themeColor('mutedForeground'), dim: true }, '📊 Latency Graph'),
        Text({ color: themeColor('mutedForeground') }, 'Waiting for data...')
      )
    );
  }

  const history = selected.history.slice(-60); // Last 60 samples
  const min = Math.min(...history);
  const max = Math.max(...history);
  const avg = history.reduce((a, b) => a + b, 0) / history.length;

  return Box(
    { flexDirection: 'column', marginTop: 1, paddingX: 1 },
    // Stats header
    Box(
      { flexDirection: 'row', gap: 2, marginBottom: 1 },
      Text({ color: themeColor('primary'), bold: true }, `📊 Hop ${selected.hop}`),
      Text({ color: themeColor('foreground') }, selected.host),
      Text({ color: themeColor('mutedForeground') }, '│'),
      Text({ color: themeColor('success') }, `▼ ${min.toFixed(1)}ms`),
      Text({ color: themeColor('warning') }, `◆ ${avg.toFixed(1)}ms`),
      Text({ color: themeColor('error') }, `▲ ${max.toFixed(1)}ms`),
      Text({ color: themeColor('mutedForeground') }, `│ ${history.length} samples`),
    ),
    // Big LineChart with braille characters
    LineChart({
      series: [{
        name: 'Latency',
        data: history,
        color: themeColor('primary'),
      }],
      width: width - 8, // Account for Y-axis labels
      height: 8,
      yAxis: {
        show: true,
        min: Math.max(0, min - 5),
        max: max + 5,
        ticks: 5,
        formatter: (v: number) => `${v.toFixed(0)}ms`,
      },
      xAxis: {
        show: false,
      },
      showLegend: false,
      showGrid: true,
      gridColor: themeColor('muted'),
    })
  );
}

// Footer with controls
function Footer() {
  return Box(
    { marginTop: 1, paddingX: 1 },
    Text({ color: themeColor('mutedForeground') },
      '↑/↓ Select hop  •  Tab Theme  •  r Reset  •  q Quit'
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

    if (key.upArrow) {
      setSelectedHop(h => Math.max(0, h - 1));
    }

    if (key.downArrow) {
      setSelectedHop(h => Math.min(hops().length - 1, h + 1));
    }

    if (char === 'r') {
      // Reset stats
      setHops(currentHops =>
        currentHops.map(hop => ({
          ...hop,
          sent: 0,
          recv: 0,
          loss: 0,
          last: -1,
          avg: -1,
          best: -1,
          worst: -1,
          stdev: 0,
          history: [],
        }))
      );
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
    TuiuiuHeader(),
    TableHeader(),
    Box(
      { flexDirection: 'column' },
      ...hops().map((hop, index) => HopRow({ hop, index }))
    ),
    LatencyGraph(),
    Footer(),
    KeyIndicator(),
  );
}

// Start the app
async function main() {
  // First, discover the route
  const discoveredHops = await discoverRoute();
  setHops(discoveredHops);
  setStatus(`Route discovered: ${discoveredHops.length} hops`);

  // Start the UI (disable autoTabNavigation so Tab can cycle themes)
  const { waitUntilExit } = render(App, { autoTabNavigation: false });

  // Start the ping loop
  pingLoop();

  await waitUntilExit();
  setIsRunning(false);
  process.exit(0);
}

main().catch(console.error);
