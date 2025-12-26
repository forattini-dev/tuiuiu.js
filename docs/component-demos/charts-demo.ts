/**
 * Charts Demo - For documentation GIF
 * Shows Sparkline and BarChart with live data
 */

import { render, Box, Text, createSignal, useEffect, useApp, type VNode } from '../../src/index.js';
import { Sparkline, BarChart } from '../../src/molecules/data-viz/index.js';

function ChartsDemo(): VNode {
  const [data, setData] = createSignal([20, 40, 35, 60, 45, 80, 65, 90, 75, 50]);
  const [barData, setBarData] = createSignal([
    { label: 'Sales', value: 85, color: 'cyan' as const },
    { label: 'Users', value: 62, color: 'green' as const },
    { label: 'Revenue', value: 94, color: 'yellow' as const },
    { label: 'Growth', value: 45, color: 'magenta' as const },
  ]);
  const { exit } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      // Update sparkline with new random point
      setData(d => {
        const newData = [...d.slice(1), Math.floor(Math.random() * 80) + 20];
        return newData;
      });

      // Update bar chart values
      setBarData(bars => bars.map(bar => ({
        ...bar,
        value: Math.max(20, Math.min(100, bar.value + (Math.random() * 20 - 10)))
      })));
    }, 300);

    setTimeout(() => exit(), 10000);
    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '📈 Live Charts'),
    Box({ height: 1 }),

    // Sparkline
    Box({ flexDirection: 'row', gap: 2 },
      Text({ color: 'gray', width: 10 }, 'CPU Usage'),
      Sparkline({ data: data(), width: 30, color: 'cyan', showLabels: true })
    ),

    Box({ height: 1 }),
    Text({ color: 'white', dim: true }, 'Performance Metrics'),
    Box({ height: 1 }),

    // Bar Chart
    BarChart({
      data: barData(),
      maxBarLength: 25,
      showValues: true,
      labelWidth: 10,
    })
  );
}

render(() => ChartsDemo());
