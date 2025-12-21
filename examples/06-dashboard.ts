/**
 * Dashboard Example
 *
 * Showcases data visualization components:
 * - Sparkline
 * - BarChart
 * - LineChart
 * - Gauge
 * - Heatmap
 *
 * Run with: npx tsx examples/06-dashboard.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useEffect,
  useInput,
  useApp,
  Sparkline,
  BarChart,
  LineChart,
  Gauge,
  Heatmap,
  Divider,
  setTheme,
  darkTheme,
} from '../src/index.js';

// Apply dark theme
setTheme(darkTheme);

// Generate random data for demo
function generateSparklineData(length: number): number[] {
  const data: number[] = [];
  let value = 50;
  for (let i = 0; i < length; i++) {
    value += Math.random() * 20 - 10;
    value = Math.max(0, Math.min(100, value));
    data.push(value);
  }
  return data;
}

function Dashboard() {
  const app = useApp();

  // Reactive data
  const [cpuHistory, setCpuHistory] = useState<number[]>(generateSparklineData(20));
  const [memHistory, setMemHistory] = useState<number[]>(generateSparklineData(20));
  const [cpuUsage, setCpuUsage] = useState(45);
  const [memUsage, setMemUsage] = useState(62);
  const [diskUsage, setDiskUsage] = useState(78);

  // Update data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Update CPU
      const newCpu = Math.max(0, Math.min(100, cpuUsage() + Math.random() * 10 - 5));
      setCpuUsage(newCpu);
      setCpuHistory((prev) => [...prev.slice(1), newCpu]);

      // Update Memory
      const newMem = Math.max(0, Math.min(100, memUsage() + Math.random() * 6 - 3));
      setMemUsage(newMem);
      setMemHistory((prev) => [...prev.slice(1), newMem]);
    }, 1000);

    return () => clearInterval(interval);
  });

  // Handle input
  useInput((input, key) => {
    if (key.escape || input === 'q') {
      app.exit();
    }
  });

  // Bar chart data
  const barData = [
    { label: 'Mon', value: 120 },
    { label: 'Tue', value: 180 },
    { label: 'Wed', value: 150 },
    { label: 'Thu', value: 220 },
    { label: 'Fri', value: 190 },
    { label: 'Sat', value: 80 },
    { label: 'Sun', value: 60 },
  ];

  // Line chart data
  const lineData = [
    {
      name: 'Requests',
      data: [
        { x: 0, y: 100 },
        { x: 1, y: 150 },
        { x: 2, y: 120 },
        { x: 3, y: 200 },
        { x: 4, y: 180 },
        { x: 5, y: 250 },
        { x: 6, y: 220 },
      ],
      color: 'cyan' as const,
    },
    {
      name: 'Errors',
      data: [
        { x: 0, y: 5 },
        { x: 1, y: 8 },
        { x: 2, y: 3 },
        { x: 3, y: 12 },
        { x: 4, y: 6 },
        { x: 5, y: 4 },
        { x: 6, y: 7 },
      ],
      color: 'red' as const,
    },
  ];

  // Heatmap data (activity by hour and day)
  const heatmapData = [
    [1, 2, 3, 5, 8, 12, 15, 18, 20, 18, 15, 10],
    [2, 3, 4, 6, 10, 14, 18, 22, 24, 20, 16, 12],
    [1, 2, 3, 5, 9, 13, 16, 20, 22, 19, 14, 10],
    [2, 3, 5, 7, 11, 15, 19, 23, 25, 21, 17, 13],
    [3, 4, 6, 8, 12, 16, 20, 24, 26, 22, 18, 14],
    [1, 1, 2, 3, 4, 5, 6, 7, 8, 6, 4, 2],
    [0, 1, 1, 2, 3, 4, 5, 6, 6, 5, 3, 2],
  ];

  return Box(
    {
      flexDirection: 'column',
      padding: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
    },
    // Header
    Box(
      { justifyContent: 'center', marginBottom: 1 },
      Text({ color: 'cyan', bold: true }, ' System Dashboard ')
    ),

    // Top row: Gauges
    Box(
      { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 1 },
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Gauge({
          value: Math.round(cpuUsage()),
          max: 100,
          label: 'CPU',
          style: 'arc',
          width: 15,
          showPercentage: true,
          zones: true,
        })
      ),
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Gauge({
          value: Math.round(memUsage()),
          max: 100,
          label: 'Memory',
          style: 'arc',
          width: 15,
          showPercentage: true,
          zones: true,
        })
      ),
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        Gauge({
          value: diskUsage(),
          max: 100,
          label: 'Disk',
          style: 'arc',
          width: 15,
          showPercentage: true,
          zones: true,
        })
      )
    ),

    Divider({ title: 'Real-time Metrics' }),

    // Middle row: Sparklines
    Box(
      { flexDirection: 'row', marginTop: 1, marginBottom: 1 },
      Box(
        { flexDirection: 'column', flexGrow: 1 },
        Text({ color: 'gray' }, 'CPU History: '),
        Sparkline({
          data: cpuHistory(),
          width: 30,
          color: 'green',
          showMinMax: true,
        })
      ),
      Box(
        { flexDirection: 'column', flexGrow: 1 },
        Text({ color: 'gray' }, 'Memory History: '),
        Sparkline({
          data: memHistory(),
          width: 30,
          color: 'yellow',
          showMinMax: true,
        })
      )
    ),

    Divider({ title: 'Weekly Stats' }),

    // Bottom row: Charts
    Box(
      { flexDirection: 'row', marginTop: 1 },
      Box(
        { flexDirection: 'column', width: '50%' },
        Text({ color: 'gray', marginBottom: 1 }, 'Requests per Day'),
        BarChart({
          data: barData,
          width: 35,
          height: 8,
          showValues: true,
          color: 'blue',
        })
      ),
      Box(
        { flexDirection: 'column', width: '50%' },
        Text({ color: 'gray', marginBottom: 1 }, 'Traffic Trends'),
        LineChart({
          series: lineData,
          width: 35,
          height: 8,
          showLegend: true,
        })
      )
    ),

    Divider({ title: 'Activity Heatmap' }),

    // Heatmap
    Box(
      { marginTop: 1 },
      Heatmap({
        data: heatmapData,
        rowHeaders: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        columnHeaders: ['6am', '8am', '10am', '12pm', '2pm', '4pm', '6pm', '8pm', '10pm', '12am', '2am', '4am'],
        colorScale: 'heat',
        showValues: false,
      })
    ),

    // Footer
    Box(
      { marginTop: 1, justifyContent: 'center' },
      Text({ color: 'gray', dim: true }, 'Press Q or ESC to exit')
    )
  );
}

// Run the dashboard
const { waitUntilExit } = render(Dashboard);
await waitUntilExit();
