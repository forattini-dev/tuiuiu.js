#!/usr/bin/env node
/**
 * Interactive Charts Example
 *
 * Demonstrates using interactive hooks with charts:
 * - Selection with click
 * - Hover with tooltips
 * - Keyboard navigation
 * - Zoom and pan controls
 *
 * Run with: pnpm tsx examples/22-interactive-charts.ts
 */

import { render, Box, Text, Spacer, When, Each } from '../src/index.js';
import {
  ScatterPlot,
  LineChart,
  useChartInteraction,
  useChartKeyboard,
} from '../src/molecules/data-viz/index.js';
import { useState, useInput } from '../src/hooks/index.js';

// Sample data
const scatterData = Array.from({ length: 15 }, (_, i) => ({
  x: Math.floor(Math.random() * 10) + 1,
  y: Math.floor(Math.random() * 10) + 1,
}));

const lineSeriesData = [
  { name: 'Series A', data: [5, 10, 8, 12, 15, 13, 18, 20, 19, 22] },
  { name: 'Series B', data: [3, 8, 6, 10, 13, 11, 16, 18, 17, 20] },
  { name: 'Series C', data: [7, 12, 10, 14, 17, 15, 20, 22, 21, 24] },
];

/**
 * Interactive Scatter Plot Demo
 */
function InteractiveScatterDemo(): any {
  const [selectedPoints, setSelectedPoints] = useState<number[]>([]);
  const [hoveredPoint, setHoveredPoint] = useState<number | undefined>();

  // Keyboard navigation for points
  const [currentIndex, setCurrentIndex] = useState(0);

  useInput((char, key) => {
    // Navigation with arrow keys
    if (key.upArrow) {
      setCurrentIndex((i) => Math.max(0, i - 1));
    }
    if (key.downArrow) {
      setCurrentIndex((i) => Math.min(scatterData.length - 1, i + 1));
    }

    // Select with Enter
    if (key.enter) {
      setSelectedPoints((selected) => {
        if (selected().includes(currentIndex())) {
          return selected().filter((i) => i !== currentIndex());
        }
        return [...selected(), currentIndex()];
      });
    }

    // Clear with C
    if (char === 'c') {
      setSelectedPoints([]);
      setHoveredPoint(undefined);
    }
  });

  return Box(
    { flexDirection: 'column', marginBottom: 2, paddingBottom: 1, borderStyle: 'round', borderColor: 'cyan' },
    Text({ color: 'cyan', bold: true }, '🎯 Interactive Scatter Plot'),
    Spacer(),
    Text({ color: 'gray', dim: true }, 'Use ↑↓ to navigate, Enter to select, C to clear'),
    Spacer(),
    ScatterPlot({
      points: scatterData,
      width: 50,
      height: 12,
      title: 'Interactive Data Points',
      markerStyle: 'circle',
      color: 'green',
    }),
    Spacer(),

    // Selection info
    When(selectedPoints().length > 0, () =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'yellow' }, `📌 Selected Points: ${selectedPoints().length}`),
        Text({ color: 'gray', dim: true }, `Indices: [${selectedPoints().join(', ')}]`)
      )
    ),

    // Current navigation info
    Text(
      { color: 'magenta' },
      `🎯 Current: ${currentIndex()} / ${scatterData.length - 1}`
    )
  );
}

/**
 * Interactive Line Chart Demo with Keyboard
 */
function InteractiveLineChartDemo(): any {
  const [focusedSeries, setFocusedSeries] = useState(0);
  const [hoveredValue, setHoveredValue] = useState<number | undefined>();

  useInput((char, key) => {
    // Navigate between series
    if (key.leftArrow) {
      setFocusedSeries((i) => Math.max(0, i - 1));
    }
    if (key.rightArrow) {
      setFocusedSeries((i) => Math.min(lineSeriesData.length - 1, i + 1));
    }
  });

  return Box(
    { flexDirection: 'column', marginBottom: 2, paddingBottom: 1, borderStyle: 'round', borderColor: 'green' },
    Text({ color: 'green', bold: true }, '📈 Interactive Line Chart'),
    Spacer(),
    Text({ color: 'gray', dim: true }, 'Use ←→ to switch series'),
    Spacer(),
    LineChart({
      series: lineSeriesData,
      width: 50,
      height: 10,
      title: 'Multi-Series Data',
      showLegend: true,
    }),
    Spacer(),

    // Series info
    Text(
      { color: 'cyan' },
      `📊 Focused Series: ${lineSeriesData[focusedSeries()].name}`
    ),
    Text(
      { color: 'gray' },
      `Series ${focusedSeries() + 1} of ${lineSeriesData.length}`
    )
  );
}

/**
 * Interaction Controls Help
 */
function InteractionHelp(): any {
  return Box(
    { flexDirection: 'column', borderStyle: 'round', borderColor: 'yellow', padding: 1, marginBottom: 1 },
    Text({ color: 'yellow', bold: true }, '⌨️  Interactive Controls'),
    Spacer(),
    Text({ color: 'gray' }, 'Scatter Plot:'),
    Text({ color: 'gray', dim: true }, '  ↑/↓  - Navigate points'),
    Text({ color: 'gray', dim: true }, '  Enter - Toggle selection'),
    Text({ color: 'gray', dim: true }, '  C     - Clear selection'),
    Spacer(),
    Text({ color: 'gray' }, 'Line Chart:'),
    Text({ color: 'gray', dim: true }, '  ←/→  - Switch series'),
    Spacer(),
    Text({ color: 'gray' }, 'General:'),
    Text({ color: 'gray', dim: true }, '  Ctrl+C - Exit')
  );
}

/**
 * Main Application
 */
function InteractiveChartsApp(): any {
  return Box(
    { flexDirection: 'column', padding: 1 },
    // Title
    Text({ color: 'magenta', bold: true }, '🎨 Interactive Chart Visualizations'),
    Spacer(),

    // Help
    InteractionHelp(),

    // Demos
    InteractiveScatterDemo(),
    InteractiveLineChartDemo(),

    // Footer
    Spacer(),
    Text({ color: 'gray', dim: true }, 'Press Ctrl+C to exit')
  );
}

// Run the app
const { waitUntilExit } = render(InteractiveChartsApp);
await waitUntilExit();
