/**
 * Tuiuiu htop - Real-time System Monitor
 *
 * A faithful htop recreation with REAL system data, powered by Tuiuiu.
 *
 * Features:
 * - Per-CPU usage bars (real /proc/stat data)
 * - Memory and Swap bars (real /proc/meminfo data)
 * - Process list with PID, USER, CPU%, MEM%, TIME+, Command
 * - Interactive sorting, filtering, and process management
 * - Real-time updates every second
 *
 * Run: npx tsx examples/08-htop.ts
 */

import {
  render,
  Box,
  Text,
  createSignal,
  useEffect,
  batch,
  useInput,
  useApp,
  setTheme,
  useTheme,
  getNextTheme,
  resolveColor,
} from '../src/index.js';
import {
  getCpuUsage,
  getMemoryInfo,
  getProcessList,
  getSystemInfo,
  formatBytes,
  formatUptime,
  type ProcessInfo,
  type CpuUsage,
  type MemoryInfo,
  type SystemInfo,
} from '../src/utils/system-data.js';
import type { VNode } from '../src/utils/types.js';
import { KeyIndicator, withKeyIndicator, clearOldKeyPresses } from './_shared/key-indicator.js';
import { TuiuiuHeader, startFpsTracking, stopFpsTracking } from './_shared/tuiuiu-header.js';

// =============================================================================
// Types
// =============================================================================

type SortField = 'pid' | 'user' | 'cpu' | 'mem' | 'time' | 'command';
type SortOrder = 'asc' | 'desc';

// =============================================================================
// Formatting Utilities
// =============================================================================

function formatKb(kb: number): string {
  if (kb === 0) return '0';
  if (kb < 1024) return `${kb}K`;
  if (kb < 1024 * 1024) return `${(kb / 1024).toFixed(0)}M`;
  return `${(kb / 1024 / 1024).toFixed(1)}G`;
}

function formatMemoryMb(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (mb < 1024) return `${mb.toFixed(0)}M`;
  return `${(mb / 1024).toFixed(2)}G`;
}

// =============================================================================
// Components
// =============================================================================

interface CPUBarProps {
  id: number;
  percent: number;
  width: number;
}

function CPUBar({ id, percent, width }: CPUBarProps): VNode {
  const barWidth = width - 10; // Space for "  0[" and "xxx.x%]"
  const usedWidth = Math.floor((percent / 100) * barWidth);
  const emptyWidth = barWidth - usedWidth;

  // Color based on usage - using theme colors
  const barColor = percent > 80 ? resolveColor('error') : percent > 50 ? resolveColor('warning') : resolveColor('success');

  return Box(
    { flexDirection: 'row' },
    Text({ color: resolveColor('foreground') }, `${id.toString().padStart(2)}[`),
    Text({ color: barColor }, '|'.repeat(Math.max(0, usedWidth))),
    Text({ color: resolveColor('mutedForeground'), dim: true }, ' '.repeat(Math.max(0, emptyWidth))),
    Text({ color: resolveColor('foreground') }, `${percent.toFixed(1).padStart(5)}%]`)
  );
}

interface MemoryBarProps {
  label: string;
  used: number;
  total: number;
  buffers?: number;
  cached?: number;
  width: number;
}

function MemoryBar({ label, used, total, buffers = 0, cached = 0, width }: MemoryBarProps): VNode {
  const barWidth = width - 22; // Space for label and values
  const usedPercent = total > 0 ? (used / total) * 100 : 0;
  const buffersPercent = total > 0 ? (buffers / total) * 100 : 0;
  const cachedPercent = total > 0 ? (cached / total) * 100 : 0;

  const usedWidth = Math.floor((usedPercent / 100) * barWidth);
  const buffersWidth = Math.floor((buffersPercent / 100) * barWidth);
  const cachedWidth = Math.floor((cachedPercent / 100) * barWidth);
  const emptyWidth = Math.max(0, barWidth - usedWidth - buffersWidth - cachedWidth);

  return Box(
    { flexDirection: 'row' },
    Text({ color: resolveColor('foreground') }, `${label}[`),
    Text({ color: resolveColor('success') }, '|'.repeat(Math.max(0, usedWidth))),
    Text({ color: resolveColor('primary') }, '|'.repeat(Math.max(0, buffersWidth))),
    Text({ color: resolveColor('warning') }, '|'.repeat(Math.max(0, cachedWidth))),
    Text({ color: resolveColor('mutedForeground'), dim: true }, ' '.repeat(emptyWidth)),
    Text({ color: resolveColor('foreground') }, `${formatMemoryMb(used)}/${formatMemoryMb(total)}]`)
  );
}

interface ProcessRowProps {
  process: ProcessInfo;
  isSelected: boolean;
  width: number;
}

function ProcessRow({ process, isSelected, width }: ProcessRowProps): VNode {
  const { pid, user, priority, nice, virt, res, shr, state, cpuPercent, memPercent, time, command } = process;

  // Column widths
  const pidW = 7;
  const userW = 9;
  const priW = 4;
  const niW = 4;
  const virtW = 7;
  const resW = 7;
  const shrW = 7;
  const stateW = 2;
  const cpuW = 6;
  const memW = 6;
  const timeW = 10;
  const cmdW = Math.max(10, width - pidW - userW - priW - niW - virtW - resW - shrW - stateW - cpuW - memW - timeW - 1);

  // Use theme colors
  const stateColor = state === 'R' ? resolveColor('success') : state === 'D' ? resolveColor('error') : state === 'Z' ? resolveColor('accent') : resolveColor('foreground');
  const cpuColor = cpuPercent > 50 ? resolveColor('error') : cpuPercent > 20 ? resolveColor('warning') : resolveColor('foreground');
  const memColor = memPercent > 10 ? resolveColor('warning') : resolveColor('foreground');

  const bgColor = isSelected ? resolveColor('primary') : undefined;
  const fgColor = isSelected ? resolveColor('primaryForeground') : undefined;

  const truncatedCmd = command.length > cmdW ? command.slice(0, cmdW - 1) + '…' : command.padEnd(cmdW);

  return Box(
    { flexDirection: 'row', backgroundColor: bgColor },
    Text({ color: fgColor ?? resolveColor('success') }, pid.toString().padStart(pidW)),
    Text({ color: fgColor ?? resolveColor('foreground') }, user.slice(0, userW - 1).padEnd(userW)),
    Text({ color: fgColor ?? resolveColor('foreground') }, priority.toString().padStart(priW)),
    Text({ color: fgColor ?? resolveColor('foreground') }, nice.toString().padStart(niW)),
    Text({ color: fgColor ?? resolveColor('primary') }, formatKb(virt).padStart(virtW)),
    Text({ color: fgColor ?? resolveColor('primary') }, formatKb(res).padStart(resW)),
    Text({ color: fgColor ?? resolveColor('primary') }, formatKb(shr).padStart(shrW)),
    Text({ color: fgColor ?? stateColor }, state.padStart(stateW)),
    Text({ color: fgColor ?? cpuColor }, cpuPercent.toFixed(1).padStart(cpuW)),
    Text({ color: fgColor ?? memColor }, memPercent.toFixed(1).padStart(memW)),
    Text({ color: fgColor ?? resolveColor('foreground') }, time.padStart(timeW)),
    Text({ color: fgColor ?? resolveColor('foreground') }, ' ' + truncatedCmd)
  );
}

function ProcessHeader(width: number): VNode {
  const pidW = 7;
  const userW = 9;
  const priW = 4;
  const niW = 4;
  const virtW = 7;
  const resW = 7;
  const shrW = 7;
  const stateW = 2;
  const cpuW = 6;
  const memW = 6;
  const timeW = 10;

  const headerBg = resolveColor('secondary');
  const headerFg = resolveColor('secondaryForeground');

  return Box(
    { flexDirection: 'row', backgroundColor: headerBg },
    Text({ color: headerFg, bold: true }, 'PID'.padStart(pidW)),
    Text({ color: headerFg, bold: true }, 'USER'.padEnd(userW)),
    Text({ color: headerFg, bold: true }, 'PRI'.padStart(priW)),
    Text({ color: headerFg, bold: true }, 'NI'.padStart(niW)),
    Text({ color: headerFg, bold: true }, 'VIRT'.padStart(virtW)),
    Text({ color: headerFg, bold: true }, 'RES'.padStart(resW)),
    Text({ color: headerFg, bold: true }, 'SHR'.padStart(shrW)),
    Text({ color: headerFg, bold: true }, 'S'.padStart(stateW)),
    Text({ color: headerFg, bold: true }, 'CPU%'.padStart(cpuW)),
    Text({ color: headerFg, bold: true }, 'MEM%'.padStart(memW)),
    Text({ color: headerFg, bold: true }, 'TIME+'.padStart(timeW)),
    Text({ color: headerFg, bold: true }, ' Command'.padEnd(width - pidW - userW - priW - niW - virtW - resW - shrW - stateW - cpuW - memW - timeW))
  );
}

function HtopHeader(): VNode {
  return TuiuiuHeader({
    title: 'htop',
    subtitle: 'Real-time System Monitor',
  });
}

function StatusBar(props: { tasks: SystemInfo['tasks']; width: number }): VNode {
  const { tasks, width } = props;

  return Box(
    { flexDirection: 'row', backgroundColor: resolveColor('muted') },
    Text({ color: resolveColor('foreground') }, ` Tasks: `),
    Text({ color: resolveColor('success'), bold: true }, `${tasks.total}`),
    Text({ color: resolveColor('foreground') }, ` (`),
    Text({ color: resolveColor('success') }, `${tasks.running} running`),
    Text({ color: resolveColor('foreground') }, `, `),
    Text({ color: resolveColor('warning') }, `${tasks.sleeping} sleeping`),
    Text({ color: resolveColor('foreground') }, `, `),
    Text({ color: resolveColor('error') }, `${tasks.stopped} stopped`),
    Text({ color: resolveColor('foreground') }, `, `),
    Text({ color: resolveColor('accent') }, `${tasks.zombie} zombie`),
    Text({ color: resolveColor('foreground') }, `) `),
    Text({ color: resolveColor('foreground') }, ' '.repeat(Math.max(0, width - 80)))
  );
}

// =============================================================================
// Main App
// =============================================================================

function HtopApp(): VNode {
  // Terminal size
  const width = process.stdout.columns || 120;
  const height = process.stdout.rows || 40;

  // State - Real system data
  const [cpuUsage, setCpuUsage] = createSignal<CpuUsage>({ total: 0, cores: [] });
  const [memInfo, setMemInfo] = createSignal<MemoryInfo>({
    total: 0, used: 0, free: 0, buffers: 0, cached: 0, available: 0,
    swapTotal: 0, swapUsed: 0, swapFree: 0,
  });
  const [processes, setProcesses] = createSignal<ProcessInfo[]>([]);
  const [systemInfo, setSystemInfo] = createSignal<SystemInfo>({
    hostname: 'unknown',
    uptime: 0,
    loadAvg: [0, 0, 0],
    tasks: { total: 0, running: 0, sleeping: 0, stopped: 0, zombie: 0 },
  });

  // UI State
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  const [sortField, setSortField] = createSignal<SortField>('cpu');
  const [sortOrder, setSortOrder] = createSignal<SortOrder>('desc');
  const [filterText, setFilterText] = createSignal('');
  const [showHelp, setShowHelp] = createSignal(false);

  const { exit } = useApp();

  // Load initial data (reuse process list to avoid double I/O)
  batch(() => {
    setCpuUsage(getCpuUsage()); // 1st read - stores baseline, returns 0%
    setMemInfo(getMemoryInfo());
    const procs = getProcessList();
    setProcesses(procs);
    setSystemInfo(getSystemInfo(procs));
  });

  // Start FPS tracking (runs at 100ms intervals independently)
  useEffect(() => {
    startFpsTracking(100);
    return () => stopFpsTracking();
  });

  // Data update loop (1s interval for heavy I/O operations)
  useEffect(() => {
    const interval = setInterval(() => {
      batch(() => {
        clearOldKeyPresses();
        setCpuUsage(getCpuUsage());
        setMemInfo(getMemoryInfo());
        const procs = getProcessList();
        setProcesses(procs);
        setSystemInfo(getSystemInfo(procs));
      });
    }, 1000);

    return () => clearInterval(interval);
  });

  // Sort and filter processes
  const sortedProcesses = (): ProcessInfo[] => {
    let result = [...processes()];

    // Filter
    const filter = filterText().toLowerCase();
    if (filter) {
      result = result.filter(p =>
        p.command.toLowerCase().includes(filter) ||
        p.user.toLowerCase().includes(filter) ||
        p.pid.toString().includes(filter)
      );
    }

    // Sort
    const field = sortField();
    const order = sortOrder();
    result.sort((a, b) => {
      let cmp = 0;
      switch (field) {
        case 'pid': cmp = a.pid - b.pid; break;
        case 'user': cmp = a.user.localeCompare(b.user); break;
        case 'cpu': cmp = a.cpuPercent - b.cpuPercent; break;
        case 'mem': cmp = a.memPercent - b.memPercent; break;
        case 'time': cmp = a.time.localeCompare(b.time); break;
        case 'command': cmp = a.command.localeCompare(b.command); break;
      }
      return order === 'desc' ? -cmp : cmp;
    });

    return result;
  };

  // Input handling
  useInput(withKeyIndicator((input, key) => {
    if (showHelp()) {
      if (key.escape || input === 'q' || input === 'h') {
        setShowHelp(false);
      }
      return;
    }

    const procs = sortedProcesses();

    if (key.upArrow || input === 'k') {
      setSelectedIndex(i => Math.max(0, i - 1));
    } else if (key.downArrow || input === 'j') {
      setSelectedIndex(i => Math.min(procs.length - 1, i + 1));
    } else if (key.pageUp) {
      setSelectedIndex(i => Math.max(0, i - 10));
    } else if (key.pageDown) {
      setSelectedIndex(i => Math.min(procs.length - 1, i + 10));
    } else if (input === 'g') {
      setSelectedIndex(0);
    } else if (input === 'G') {
      setSelectedIndex(procs.length - 1);
    } else if (input === 'q' || input === 'Q' || key.escape) {
      exit();
    } else if (input === 'h' || input === '?') {
      setShowHelp(true);
    } else if (input === 'P') {
      setSortField('cpu');
      setSortOrder('desc');
    } else if (input === 'M') {
      setSortField('mem');
      setSortOrder('desc');
    } else if (input === 'T') {
      setSortField('time');
      setSortOrder('desc');
    } else if (input === 'N') {
      setSortField('pid');
      setSortOrder('asc');
    } else if (key.tab) {
      // Cycle to next theme
      const currentTheme = useTheme();
      const nextTheme = getNextTheme(currentTheme);
      setTheme(nextTheme);
    }
  }));

  // Help overlay
  if (showHelp()) {
    return Box(
      { flexDirection: 'column', padding: 2 },
      Box(
        { borderStyle: 'round', borderColor: resolveColor('primary'), padding: 1 },
        Box(
          { flexDirection: 'column' },
          Text({ color: resolveColor('primary'), bold: true }, '🐦 Tuiuiu htop - Keyboard Shortcuts'),
          Text({}, ''),
          Text({ color: resolveColor('foreground') }, '  ↑/k, ↓/j     Move selection up/down'),
          Text({ color: resolveColor('foreground') }, '  PgUp/PgDn    Move selection by page'),
          Text({ color: resolveColor('foreground') }, '  g/G          Go to first/last process'),
          Text({}, ''),
          Text({ color: resolveColor('foreground') }, '  P            Sort by CPU%'),
          Text({ color: resolveColor('foreground') }, '  M            Sort by MEM%'),
          Text({ color: resolveColor('foreground') }, '  T            Sort by TIME'),
          Text({ color: resolveColor('foreground') }, '  N            Sort by PID'),
          Text({}, ''),
          Text({ color: resolveColor('foreground') }, '  Tab          Cycle themes'),
          Text({ color: resolveColor('foreground') }, '  q/Esc        Quit'),
          Text({ color: resolveColor('foreground') }, '  h/?          Show this help'),
          Text({}, ''),
          Text({ color: resolveColor('mutedForeground'), dim: true }, 'Press any key to close'),
          Text({}, ''),
          Text({ color: resolveColor('accent') }, 'Powered by Tuiuiu - Zero-dependency Terminal UI'),
        )
      )
    );
  }

  // Calculate layout
  const cpu = cpuUsage();
  const cpuBarWidth = Math.floor((width - 2) / 2);
  const cpuCount = cpu.cores.length || 1;
  const cpuRows = Math.ceil(cpuCount / 2);
  const headerHeight = 1 + 1 + cpuRows + 1 + 2 + 2; // Header + spacer + CPU rows + gap + Mem/Swap + Tasks/Load + StatusBar
  const processListHeight = height - headerHeight - 2; // -2 for KeyIndicator

  const procs = sortedProcesses();
  const visibleProcesses = procs.slice(0, Math.max(1, processListHeight));
  const mem = memInfo();
  const sys = systemInfo();

  return Box(
    { flexDirection: 'column', width, height },

    // Tuiuiu header
    HtopHeader(),
    Box({ height: 1 }), // spacer line below header

    // CPU bars (2 columns) with gap-1 after
    ...Array.from({ length: cpuRows }, (_, row) => {
      const leftIdx = row * 2;
      const rightIdx = row * 2 + 1;
      const leftPercent = cpu.cores[leftIdx] ?? 0;
      const rightPercent = cpu.cores[rightIdx];
      const isLastRow = row === cpuRows - 1;

      return Box(
        { flexDirection: 'row', marginBottom: isLastRow ? 1 : 0 },
        CPUBar({ id: leftIdx, percent: leftPercent, width: cpuBarWidth }),
        Text({}, ' '),
        rightPercent !== undefined
          ? CPUBar({ id: rightIdx, percent: rightPercent, width: cpuBarWidth })
          : Text({}, ''),
      );
    }),

    // Memory and Swap bars
    Box(
      { flexDirection: 'row' },
      MemoryBar({
        label: 'Mem',
        used: mem.used,
        total: mem.total,
        buffers: mem.buffers,
        cached: mem.cached,
        width: cpuBarWidth,
      }),
      Text({}, ' '),
      MemoryBar({
        label: 'Swp',
        used: mem.swapUsed,
        total: mem.swapTotal,
        width: cpuBarWidth,
      }),
    ),

    // Tasks and Load average
    Box(
      { flexDirection: 'row', marginTop: 1 },
      Text({ color: resolveColor('foreground') }, `Load: `),
      Text({ color: resolveColor('primary'), bold: true }, sys.loadAvg.map(l => l.toFixed(2)).join(' ')),
      Text({ color: resolveColor('foreground') }, `   Uptime: `),
      Text({ color: resolveColor('success') }, formatUptime(sys.uptime)),
      Text({ color: resolveColor('foreground') }, `   Total CPU: `),
      Text({ color: cpu.total > 50 ? resolveColor('error') : resolveColor('success'), bold: true }, `${cpu.total}%`),
    ),

    // Status bar with task counts
    StatusBar({ tasks: sys.tasks, width }),

    // Process header
    ProcessHeader(width),

    // Process list
    ...visibleProcesses.map((proc, index) =>
      ProcessRow({
        process: proc,
        isSelected: index === selectedIndex(),
        width,
      })
    ),

    // Empty rows to fill space
    ...Array.from({ length: Math.max(0, processListHeight - visibleProcesses.length) }, () =>
      Text({}, '')
    ),

    // Key indicator at bottom
    KeyIndicator({ width }),
  );
}

// =============================================================================
// Run
// =============================================================================

const { waitUntilExit } = render(HtopApp, { autoTabNavigation: false });
await waitUntilExit();
