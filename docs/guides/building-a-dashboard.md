# Building a Dashboard

This guide will walk you through building a professional terminal dashboard using **Tuiuiu**. We will cover layout, data visualization, and real-time updates.

## Goal

We will build a **Server Monitor** dashboard that includes:
1.  **App Layout**: Header, Sidebar, and Main Content.
2.  **Navigation**: Switching between "Overview" and "Processes".
3.  **Data Viz**: Real-time CPU/Memory charts and sparklines.
4.  **Tabular Data**: A list of active processes.

## 1. Project Setup

First, ensure you have a project set up (see [Installation](../getting-started/installation.md)).

```typescript
// index.ts
import { render, AppShell, Text } from 'tuiuiu';

function App() {
  return AppShell({
    header: Text({}, 'Server Monitor'),
    children: Text({}, 'Content goes here')
  });
}

render(App());
```

## 2. Layout Structure

We'll use the `AppShell` component for the main structure and `SplitPanel` or `Grid` for the content.

```typescript
import { AppShell, Header, Sidebar, VStack, Text } from 'tuiuiu';

function App() {
  return AppShell({
    // Top Header
    header: Header({
      title: 'SERVER MON 3000',
      subtitle: 'v1.0.2',
      backgroundColor: 'blue'
    }),
    
    // Left Navigation
    sidebar: VStack({ padding: 1, gap: 1 },
      Text({ color: 'cyan', bold: true }, '▶ Overview'),
      Text({ color: 'gray' }, '  Processes'),
      Text({ color: 'gray' }, '  Logs'),
      Text({ color: 'gray' }, '  Settings'),
    ),
    sidebarWidth: 20,
    
    // Main Content
    children: DashboardView()
  });
}
```

## 3. The Dashboard View

The dashboard view will use a **Grid** layout to organize widgets.

```typescript
import { Grid, Box, Text, LineChart, Sparkline, Gauge } from 'tuiuiu';

function DashboardView() {
  return Grid({
    columns: 2, // 2 columns
    gap: 1,
    children: [
      // Top Row: Stats
      StatCard('CPU Usage', '45%', [10, 20, 40, 45, 30, 45]),
      StatCard('Memory', '2.4 GB', [50, 52, 53, 55, 54, 52]),
      
      // Middle Row: Main Chart (Full width)
      Box({ columnSpan: 2, borderStyle: 'round', title: 'Network Traffic' },
        LineChart({
          height: 10,
          series: [
            { name: 'Inbound', data: [10, 20, 15, 30, 40], color: 'green' },
            { name: 'Outbound', data: [5, 10, 8, 15, 20], color: 'blue' }
          ]
        })
      ),
      
      // Bottom Row: Disk Usage
      Box({ columnSpan: 2, borderStyle: 'single', padding: 1 },
        Text({ marginBottom: 1 }, 'Disk Usage (/dev/sda1)'),
        Gauge({ value: 75, width: 60, color: 'yellow' })
      )
    ]
  });
}

// Helper component for stat cards
function StatCard(label: string, value: string, history: number[]) {
  return Box({ borderStyle: 'single', padding: 1 },
    Text({ color: 'gray' }, label),
    Text({ color: 'white', bold: true, fontSize: 'large' }, value),
    Sparkline({ data: history, color: 'cyan', height: 1 })
  );
}
```

## 4. Adding Real-time Data

To make it alive, we use **Signals**.

```typescript
import { createSignal, useEffect } from 'tuiuiu';

function LiveDashboard() {
  const [cpu, setCpu] = createSignal<number[]>([]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      // Simulate new data point
      const point = Math.floor(Math.random() * 100);
      setCpu(prev => [...prev.slice(-20), point]); // Keep last 20
    }, 1000);
    
    return () => clearInterval(timer);
  });

  return Box({ borderStyle: 'round', title: 'Live CPU' },
    LineChart({
      series: [{ name: 'CPU', data: cpu(), color: 'magenta' }]
    })
  );
}
```

## 5. Process Table

For tabular data, we use the `Table` component.

```typescript
import { Table } from 'tuiuiu';

function ProcessList() {
  const processes = [
    { pid: 1234, name: 'node', cpu: 12.5, mem: '150MB' },
    { pid: 8921, name: 'docker', cpu: 5.2, mem: '400MB' },
    { pid: 1102, name: 'postgres', cpu: 1.1, mem: '200MB' },
  ];

  return Table({
    columns: [
      { key: 'pid', header: 'PID', width: 6 },
      { key: 'name', header: 'Name', width: 20 },
      { key: 'cpu', header: 'CPU %', color: 'green' },
      { key: 'mem', header: 'Memory', color: 'yellow' },
    ],
    data: processes,
    borderStyle: 'single'
  });
}
```

## Final Result

By combining these parts, you get a responsive, interactive terminal dashboard that looks like this:

```
┌────────────────────────────────────────────────────────┐
│ SERVER MON 3000 - v1.0.2                               │
├───────────────────┬────────────────────────────────────┤
│ ▶ Overview        │ ┌──────────────┐  ┌──────────────┐ │
│   Processes       │ │ CPU: 45%     │  │ Mem: 2.4GB   │ │
│   Logs            │ │ ▄█▄▆▇█       │  │ ▆▇█▄▄▂       │ │
│   Settings        │ └──────────────┘  └──────────────┘ │
│                   │ ┌─ Network Traffic ──────────────┐ │
│                   │ │   │   ╭──╮                     │ │
│                   │ │ 40┤   │  ╰╮   ╭─               │ │
│                   │ │ 20┤ ╭─╯   ╰───╯                │ │
│                   │ └───┴────────────────────────────┘ │
└───────────────────┴────────────────────────────────────┘
```
