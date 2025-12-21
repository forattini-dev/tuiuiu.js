/**
 * Example 11: Static Logs
 *
 * Demonstrates using the Static component for persistent log output
 * above interactive content.
 *
 * Run: npx tsx examples/11-static-logs.ts
 *
 * Controls:
 * - Enter: Run next task
 * - r: Reset all
 * - q: Quit
 */

import {
  render,
  createSignal,
  Box,
  Text,
  Static,
  useInput,
  useApp,
  Spinner,
  ProgressBar,
} from '../src/index.js';

// =============================================================================
// Types
// =============================================================================

interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  level: 'info' | 'success' | 'warning' | 'error';
}

interface Task {
  id: number;
  name: string;
  duration: number;
}

// =============================================================================
// State
// =============================================================================

const [logs, setLogs] = createSignal<LogEntry[]>([]);
const [currentTask, setCurrentTask] = createSignal<Task | null>(null);
const [progress, setProgress] = createSignal(0);
const [taskQueue, setTaskQueue] = createSignal<Task[]>([
  { id: 1, name: 'Installing dependencies', duration: 1500 },
  { id: 2, name: 'Compiling TypeScript', duration: 2000 },
  { id: 3, name: 'Running tests', duration: 1800 },
  { id: 4, name: 'Building bundle', duration: 2500 },
  { id: 5, name: 'Optimizing assets', duration: 1200 },
  { id: 6, name: 'Generating docs', duration: 800 },
  { id: 7, name: 'Deploying to server', duration: 3000 },
]);

let logId = 0;

// =============================================================================
// Helpers
// =============================================================================

function getTimestamp(): string {
  const now = new Date();
  return now.toTimeString().split(' ')[0];
}

function addLog(message: string, level: LogEntry['level'] = 'info'): void {
  setLogs((prev) => [
    ...prev,
    {
      id: ++logId,
      timestamp: getTimestamp(),
      message,
      level,
    },
  ]);
}

async function runTask(task: Task): Promise<void> {
  setCurrentTask(task);
  setProgress(0);

  addLog(`Starting: ${task.name}`, 'info');

  // Simulate progress
  const steps = 20;
  const stepDuration = task.duration / steps;

  for (let i = 1; i <= steps; i++) {
    await new Promise((resolve) => setTimeout(resolve, stepDuration));
    setProgress((i / steps) * 100);
  }

  // Random outcome (90% success)
  const success = Math.random() > 0.1;

  if (success) {
    addLog(`Completed: ${task.name} (${task.duration}ms)`, 'success');
  } else {
    addLog(`Failed: ${task.name} - Retrying...`, 'warning');
    // Retry once
    await new Promise((resolve) => setTimeout(resolve, 500));
    addLog(`Completed: ${task.name} (retry successful)`, 'success');
  }

  setCurrentTask(null);
  setProgress(0);
}

async function runNextTask(): Promise<void> {
  const queue = taskQueue();
  if (queue.length === 0 || currentTask() !== null) return;

  const [next, ...rest] = queue;
  setTaskQueue(rest);

  await runTask(next);

  if (rest.length === 0) {
    addLog('All tasks completed!', 'success');
  }
}

function resetAll(): void {
  setLogs([]);
  setCurrentTask(null);
  setProgress(0);
  setTaskQueue([
    { id: 1, name: 'Installing dependencies', duration: 1500 },
    { id: 2, name: 'Compiling TypeScript', duration: 2000 },
    { id: 3, name: 'Running tests', duration: 1800 },
    { id: 4, name: 'Building bundle', duration: 2500 },
    { id: 5, name: 'Optimizing assets', duration: 1200 },
    { id: 6, name: 'Generating docs', duration: 800 },
    { id: 7, name: 'Deploying to server', duration: 3000 },
  ]);
  logId = 0;
  addLog('System reset', 'info');
}

// =============================================================================
// Components
// =============================================================================

function LogLine(log: LogEntry, index: number) {
  const colorMap = {
    info: 'cyan',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  };

  const iconMap = {
    info: 'ℹ',
    success: '✓',
    warning: '⚠',
    error: '✗',
  };

  return Box(
    { key: log.id },
    Text({ color: 'gray', dim: true }, `[${log.timestamp}] `),
    Text({ color: colorMap[log.level] }, `${iconMap[log.level]} `),
    Text({ color: log.level === 'error' ? 'red' : undefined }, log.message)
  );
}

function StaticLogs() {
  return Static({
    items: logs(),
    children: LogLine,
  });
}

function CurrentTaskDisplay() {
  const task = currentTask();

  if (!task) {
    return Box(
      { borderStyle: 'single', borderColor: 'gray', padding: 1 },
      Text({ color: 'gray' }, 'No task running. Press Enter to start next task.')
    );
  }

  return Box(
    { borderStyle: 'round', borderColor: 'cyan', padding: 1, flexDirection: 'column' },
    Box(
      { flexDirection: 'row', marginBottom: 1 },
      Spinner({ style: 'dots', color: 'cyan' }),
      Text({ color: 'cyan', bold: true }, ` ${task.name}`)
    ),
    ProgressBar({
      value: progress(),
      width: 40,
      showPercentage: true,
      style: 'smooth',
      color: 'cyan',
    }),
    Text({ color: 'gray', dim: true }, `  Duration: ~${task.duration}ms`)
  );
}

function TaskQueue() {
  const queue = taskQueue();

  return Box(
    { flexDirection: 'column', marginTop: 1 },
    Text({ color: 'white', bold: true }, `📋 Task Queue (${queue.length} remaining)`),
    queue.length === 0
      ? Text({ color: 'green' }, '  All tasks completed!')
      : Box(
          { flexDirection: 'column', marginLeft: 2 },
          ...queue.slice(0, 5).map((task, i) =>
            Text(
              { key: task.id, color: 'gray' },
              `${i + 1}. ${task.name}`
            )
          ),
          queue.length > 5
            ? Text({ color: 'gray', dim: true }, `   ... and ${queue.length - 5} more`)
            : null
        )
  );
}

function Controls() {
  const { exit } = useApp();
  const task = currentTask();
  const queue = taskQueue();

  useInput((input, key) => {
    if (input === 'q') exit();
    if (input === 'r') resetAll();
    if (key.return && !task && queue.length > 0) {
      runNextTask();
    }
  });

  return Box(
    { marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1 },
    Text({ color: 'gray' }, 'Controls: '),
    Text({ color: task ? 'gray' : 'green', dim: !!task }, 'Enter'),
    Text({ color: 'gray' }, '=Run • '),
    Text({ color: 'yellow' }, 'r'),
    Text({ color: 'gray' }, '=Reset • '),
    Text({ color: 'red' }, 'q'),
    Text({ color: 'gray' }, '=Quit')
  );
}

function Header() {
  return Box(
    { marginBottom: 1 },
    Text({ color: 'cyan', bold: true }, '📊 Build System - Static Logs Demo'),
    Text({ color: 'gray' }, ' (Logs persist above)')
  );
}

// =============================================================================
// App
// =============================================================================

function App() {
  return Box(
    { flexDirection: 'column', padding: 1 },
    // Static logs - these persist at the top
    StaticLogs(),

    // Separator when there are logs
    logs().length > 0
      ? Box({},
          Text({ color: 'gray', dim: true }, '─'.repeat(50))
        )
      : null,

    // Interactive content below
    Header(),
    CurrentTaskDisplay(),
    TaskQueue(),
    Controls()
  );
}

// =============================================================================
// Run
// =============================================================================

// Add initial log
addLog('Build system initialized', 'info');

const { waitUntilExit } = render(App);
await waitUntilExit();
