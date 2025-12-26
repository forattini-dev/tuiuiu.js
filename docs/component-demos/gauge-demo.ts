/**
 * Gauge Demo - For documentation GIF
 * Shows multiple gauge styles with animated values
 *
 * Note: Uses custom gauge renderer to work around alignItems bug
 */

import { render, Box, Text, createSignal, useEffect, useApp, type VNode } from '../../src/index.js';

// Simple gauge renderer (workaround for alignItems: 'center' bug)
function SimpleGauge({ value, width = 25, color = 'cyan', label }: { value: number; width?: number; color?: string; label?: string }): VNode {
  const normalized = Math.max(0, Math.min(100, value)) / 100;
  const filled = Math.floor(normalized * width);
  const empty = width - filled;

  // Choose color based on value (zones)
  let barColor = color;
  if (color === 'zones') {
    if (value < 50) barColor = 'green';
    else if (value < 80) barColor = 'yellow';
    else barColor = 'red';
  }

  return Box({ flexDirection: 'row' },
    label ? Text({ color: 'gray', width: 10 }, label) : null,
    Text({ color: barColor }, '█'.repeat(filled)),
    Text({ color: 'gray', dim: true }, '░'.repeat(empty)),
    Text({ color: 'white' }, ` ${Math.round(value)}%`)
  );
}

// Simple meter gauge
function SimpleMeter({ value, segments = 12 }: { value: number; segments?: number }): VNode {
  const normalized = Math.max(0, Math.min(100, value)) / 100;
  const filled = Math.round(normalized * segments);

  const chars: VNode[] = [];
  for (let i = 0; i < segments; i++) {
    const segmentValue = (i / segments) * 100;
    let color = 'green';
    if (segmentValue >= 50) color = 'yellow';
    if (segmentValue >= 80) color = 'red';

    if (i < filled) {
      chars.push(Text({ color }, '●'));
    } else {
      chars.push(Text({ color: 'gray', dim: true }, '○'));
    }
  }

  return Box({ flexDirection: 'row' },
    ...chars,
    Text({ color: 'white' }, ` ${Math.round(value)}%`)
  );
}

function GaugeDemo(): VNode {
  const [cpu, setCpu] = createSignal(45);
  const [memory, setMemory] = createSignal(62);
  const [disk, setDisk] = createSignal(78);
  const [net, setNet] = createSignal(35);
  const { exit } = useApp();

  useEffect(() => {
    const interval = setInterval(() => {
      setCpu(v => Math.max(20, Math.min(95, v + (Math.random() * 20 - 10))));
      setMemory(v => Math.max(30, Math.min(90, v + (Math.random() * 10 - 5))));
      setDisk(v => Math.max(60, Math.min(95, v + (Math.random() * 4 - 2))));
      setNet(v => Math.max(10, Math.min(80, v + (Math.random() * 30 - 15))));
    }, 300);

    setTimeout(() => exit(), 10000);
    return () => clearInterval(interval);
  });

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },
    Text({ color: 'cyan', bold: true }, '📊 System Gauges'),
    Box({ height: 1 }),
    SimpleGauge({ value: cpu(), label: 'CPU', color: 'zones' }),
    SimpleGauge({ value: memory(), label: 'Memory', color: 'blue' }),
    SimpleGauge({ value: disk(), label: 'Disk', color: 'zones' }),
    Box({ height: 1 }),
    Box({ flexDirection: 'row' },
      Text({ color: 'gray', width: 10 }, 'Network'),
      SimpleMeter({ value: net(), segments: 15 })
    )
  );
}

render(() => GaugeDemo());
