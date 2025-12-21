/**
 * Visual Components Example
 *
 * Showcases visual components:
 * - BigText
 * - Digits
 * - Clock
 * - Countdown
 * - Stopwatch
 * - Tooltip
 * - Badge
 *
 * Run with: npx tsx examples/09-visual-components.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useEffect,
  useInput,
  useApp,
  BigText,
  Digits,
  Clock,
  Countdown,
  Stopwatch,
  Badge,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

function VisualDemo() {
  const app = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stopwatchRunning, setStopwatchRunning] = useState(false);
  const [stopwatchTime, setStopwatchTime] = useState(0);

  // Update clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  });

  // Stopwatch logic
  useEffect(() => {
    if (stopwatchRunning()) {
      const interval = setInterval(() => {
        setStopwatchTime((t) => t + 100);
      }, 100);
      return () => clearInterval(interval);
    }
  });

  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
    if (input === ' ') {
      setStopwatchRunning((r) => !r);
    }
    if (input === 'r') {
      setStopwatchTime(0);
      setStopwatchRunning(false);
    }
  });

  // Format stopwatch time
  const formatStopwatch = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  };

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'magenta',
    },
    // Header with BigText
    Box(
      { justifyContent: 'center', marginBottom: 1 },
      BigText({
        text: 'TUIUIU',
        font: 'block',
        colors: ['cyan', 'blue', 'magenta'],
      })
    ),

    Divider({ title: 'Clocks & Timers' }),

    // Clocks row
    Box(
      { flexDirection: 'row', justifyContent: 'space-around', marginTop: 1, marginBottom: 1 },

      // Current time with Clock
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray', marginBottom: 1 }, 'Current Time'),
        Clock({
          time: currentTime(),
          format: '24h',
          showSeconds: true,
          style: 'lcd',
          color: 'cyan',
        })
      ),

      // Countdown
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray', marginBottom: 1 }, 'Countdown'),
        Countdown({
          targetDate: new Date(Date.now() + 3600000), // 1 hour from now
          format: 'hh:mm:ss',
          style: 'lcd',
          color: 'yellow',
        })
      ),

      // Stopwatch
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray', marginBottom: 1 }, 'Stopwatch'),
        Digits({
          value: formatStopwatch(stopwatchTime()),
          style: 'lcd',
          color: stopwatchRunning() ? 'green' : 'white',
        })
      )
    ),

    Divider({ title: 'Digits Display' }),

    // Digits examples
    Box(
      { flexDirection: 'row', justifyContent: 'space-around', marginTop: 1, marginBottom: 1 },
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray' }, 'LCD Style'),
        Digits({ value: '1234', style: 'lcd', color: 'green' })
      ),
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray' }, 'Block Style'),
        Digits({ value: '5678', style: 'block', color: 'blue' })
      ),
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Text({ color: 'gray' }, 'Dot Matrix'),
        Digits({ value: '90', style: 'dot', color: 'red' })
      )
    ),

    Divider({ title: 'Badges' }),

    // Badges row
    Box(
      { flexDirection: 'row', justifyContent: 'center', gap: 2, marginTop: 1, marginBottom: 1 },
      Badge({ text: 'NEW', variant: 'success' }),
      Badge({ text: 'HOT', variant: 'error' }),
      Badge({ text: 'BETA', variant: 'warning' }),
      Badge({ text: 'v1.0', variant: 'info' }),
      Badge({ text: 'PRO', variant: 'primary' })
    ),

    // Stopwatch controls
    Box(
      { marginTop: 1, justifyContent: 'center' },
      Text(
        { color: 'gray' },
        `[SPACE] ${stopwatchRunning() ? 'Pause' : 'Start'}  [R] Reset  [Q] Exit`
      )
    )
  );
}

// Run the demo
const { waitUntilExit } = render(VisualDemo);
await waitUntilExit();
