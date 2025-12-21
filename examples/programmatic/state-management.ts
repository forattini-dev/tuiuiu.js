/**
 * Programmatic State Management Example
 *
 * Demonstrates managing component state externally:
 * - External signal-based state
 * - Multiple components sharing state
 * - State updates without user interaction
 * - Real-time data updates pattern
 *
 * Run with: npx tsx examples/programmatic/state-management.ts
 */

import {
  render,
  Box,
  Text,
  useInput,
  useApp,
  createSignal,
  createEffect,
  batch,
  setTheme,
  darkTheme,
  Divider,
} from '../../src/index.js';

setTheme(darkTheme);

/**
 * External store pattern - state lives outside components
 */
interface SystemMetrics {
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  requests: number;
  errors: number;
  uptime: number;
}

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

// Create external store
function createStore() {
  const [metrics, setMetrics] = createSignal<SystemMetrics>({
    cpu: 45,
    memory: 62,
    network: 230,
    disk: 78,
    requests: 1420,
    errors: 3,
    uptime: 0,
  });

  const [notifications, setNotifications] = createSignal<Notification[]>([]);
  const [isPaused, setIsPaused] = createSignal(false);

  let notificationId = 0;

  return {
    // State getters
    metrics,
    notifications,
    isPaused,

    // Programmatic state updates
    updateMetrics(updates: Partial<SystemMetrics>) {
      setMetrics((m) => ({ ...m, ...updates }));
    },

    setMetricValue<K extends keyof SystemMetrics>(key: K, value: SystemMetrics[K]) {
      setMetrics((m) => ({ ...m, [key]: value }));
    },

    incrementMetric<K extends keyof SystemMetrics>(key: K, delta: number) {
      setMetrics((m) => ({ ...m, [key]: (m[key] as number) + delta }));
    },

    // Notification management
    addNotification(type: Notification['type'], message: string) {
      const notification: Notification = {
        id: ++notificationId,
        type,
        message,
        timestamp: new Date(),
      };
      setNotifications((n) => [...n.slice(-4), notification]); // Keep last 5
    },

    clearNotifications() {
      setNotifications([]);
    },

    // Simulation controls
    pause() {
      setIsPaused(true);
    },

    resume() {
      setIsPaused(false);
    },

    toggle() {
      setIsPaused((p) => !p);
    },

    // Batch updates (optimized)
    batchUpdate(updates: Partial<SystemMetrics>, notification?: { type: Notification['type']; message: string }) {
      batch(() => {
        setMetrics((m) => ({ ...m, ...updates }));
        if (notification) {
          this.addNotification(notification.type, notification.message);
        }
      });
    },
  };
}

// Create store OUTSIDE component - accessible from anywhere
const store = createStore();

// Simulate external data source (e.g., WebSocket, API polling)
function startMetricsSimulation() {
  const interval = setInterval(() => {
    if (store.isPaused()) return;

    // Simulate metric fluctuations
    const cpuChange = (Math.random() - 0.5) * 10;
    const memoryChange = (Math.random() - 0.5) * 5;
    const networkChange = (Math.random() - 0.3) * 50;

    store.updateMetrics({
      cpu: Math.max(0, Math.min(100, store.metrics().cpu + cpuChange)),
      memory: Math.max(0, Math.min(100, store.metrics().memory + memoryChange)),
      network: Math.max(0, store.metrics().network + networkChange),
      requests: store.metrics().requests + Math.floor(Math.random() * 10),
      uptime: store.metrics().uptime + 1,
    });

    // Random events
    if (Math.random() < 0.1) {
      const types: Array<Notification['type']> = ['info', 'warning', 'error', 'success'];
      const messages = [
        'New deployment started',
        'CPU spike detected',
        'Connection error',
        'Cache cleared successfully',
        'Health check passed',
        'Memory threshold warning',
      ];
      store.addNotification(
        types[Math.floor(Math.random() * types.length)],
        messages[Math.floor(Math.random() * messages.length)]
      );
    }
  }, 500);

  return () => clearInterval(interval);
}

// Helper components
function MetricBar(props: { label: string; value: number; max: number; color: string; unit?: string }) {
  const { label, value, max, color, unit = '%' } = props;
  const percentage = Math.min(100, (value / max) * 100);
  const barWidth = 20;
  const filled = Math.floor((percentage / 100) * barWidth);

  return Box(
    { marginBottom: 1 },
    Box(
      { width: 10 },
      Text({ color: 'gray' }, `${label}:`)
    ),
    Text({ color: color as any }, '['),
    Text({ color: color as any }, '█'.repeat(filled)),
    Text({ color: 'gray' }, '░'.repeat(barWidth - filled)),
    Text({ color: color as any }, '] '),
    Text({ color: 'white', bold: percentage > 80 }, `${value.toFixed(0)}${unit}`)
  );
}

function NotificationList(props: { notifications: Notification[] }) {
  const colors = { info: 'cyan', warning: 'yellow', error: 'red', success: 'green' };
  const icons = { info: 'ℹ', warning: '⚠', error: '✗', success: '✓' };

  if (props.notifications.length === 0) {
    return Text({ color: 'gray', dim: true }, 'No notifications');
  }

  return Box(
    { flexDirection: 'column' },
    ...props.notifications.slice(-5).map((n) =>
      Box(
        { key: `notif-${n.id}` },
        Text({ color: colors[n.type] as any }, `${icons[n.type]} `),
        Text({ color: 'gray' }, `[${n.timestamp.toLocaleTimeString()}] `),
        Text({ color: 'white' }, n.message)
      )
    )
  );
}

function ExternalStateDemo() {
  const app = useApp();

  // Start simulation on mount
  createEffect(() => {
    const cleanup = startMetricsSimulation();
    return cleanup;
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }

    // Programmatic controls (these update state externally)
    if (input === 'p') store.toggle();
    if (input === 'c') store.clearNotifications();
    if (input === 'r') {
      store.batchUpdate(
        { cpu: 45, memory: 62, network: 230, errors: 0, requests: 0 },
        { type: 'info', message: 'Metrics reset' }
      );
    }

    // Simulate events
    if (input === 'e') {
      store.batchUpdate(
        { errors: store.metrics().errors + 1 },
        { type: 'error', message: 'Manual error triggered' }
      );
    }
    if (input === 's') {
      store.addNotification('success', 'Manual success event');
    }

    // Direct value manipulation
    if (input === '+') store.incrementMetric('cpu', 10);
    if (input === '-') store.incrementMetric('cpu', -10);
  });

  const metrics = store.metrics();
  const notifications = store.notifications();
  const isPaused = store.isPaused();

  const formatUptime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return Box(
    { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'cyan' },
    // Header
    Box(
      { marginBottom: 1, justifyContent: 'space-between' },
      Text({ color: 'cyan', bold: true }, ' External State Management Demo '),
      Box(
        {},
        Text({ color: isPaused ? 'yellow' : 'green' }, isPaused ? '⏸ PAUSED' : '▶ RUNNING'),
        Text({ color: 'gray' }, ` | Uptime: ${formatUptime(metrics.uptime)}`)
      )
    ),

    Divider({}),

    // Metrics panel
    Box(
      { marginTop: 1, flexDirection: 'column' },
      Text({ color: 'white', bold: true, marginBottom: 1 }, 'System Metrics'),
      MetricBar({ label: 'CPU', value: metrics.cpu, max: 100, color: metrics.cpu > 80 ? 'red' : 'cyan' }),
      MetricBar({ label: 'Memory', value: metrics.memory, max: 100, color: metrics.memory > 90 ? 'red' : 'green' }),
      MetricBar({ label: 'Disk', value: metrics.disk, max: 100, color: metrics.disk > 85 ? 'yellow' : 'blue' }),
      Box(
        {},
        Text({ color: 'gray' }, 'Network:  '),
        Text({ color: 'magenta' }, `${metrics.network.toFixed(0)} KB/s`),
        Text({ color: 'gray' }, '  |  Requests: '),
        Text({ color: 'cyan' }, `${metrics.requests}`),
        Text({ color: 'gray' }, '  |  Errors: '),
        Text({ color: metrics.errors > 0 ? 'red' : 'green' }, `${metrics.errors}`)
      )
    ),

    Divider({}),

    // Notifications panel
    Box(
      { marginTop: 1, flexDirection: 'column' },
      Text({ color: 'white', bold: true, marginBottom: 1 }, `Notifications (${notifications.length})`),
      NotificationList({ notifications })
    ),

    // Controls
    Box(
      { marginTop: 1, borderStyle: 'single', borderColor: 'gray', padding: 1 },
      Box(
        { flexDirection: 'column' },
        Text({ color: 'gray', dim: true }, '[P] Pause/Resume  [C] Clear notifications  [R] Reset metrics'),
        Text({ color: 'gray', dim: true }, '[E] Trigger error  [S] Trigger success  [+/-] Adjust CPU  [Q] Exit')
      )
    ),

    // API hint
    Box(
      { marginTop: 1 },
      Box(
        { flexDirection: 'column' },
        Text({ color: 'yellow', bold: true }, 'Programmatic API:'),
        Text({ color: 'gray' }, 'store.updateMetrics({ cpu: 80 })'),
        Text({ color: 'gray' }, 'store.addNotification("error", "Connection lost")'),
        Text({ color: 'gray' }, 'store.batchUpdate(metrics, notification)')
      )
    )
  );
}

// Run the demo
const { waitUntilExit } = render(ExternalStateDemo);
await waitUntilExit();
