/**
 * Data Visualization Documentation
 */

import type { ComponentDoc } from '../types.js';

export const dataViz: ComponentDoc[] = [
  {
    name: 'Sparkline',
    category: 'molecules',
    description: 'Inline mini chart for data trends.',
    props: [
      { name: 'data', type: "number[]", required: true, description: 'Data points' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'height', type: "number", required: false, default: '1', description: 'Chart height in rows' },
      { name: 'color', type: "ColorValue", required: false, description: 'Line color' },
    ],
    examples: [
      `Sparkline({ data: [1, 5, 3, 9, 2, 7], width: 20 })`,
    ],
  },
  {
    name: 'BarChart',
    category: 'molecules',
    description: 'Horizontal or vertical bar chart.',
    props: [
      { name: 'data', type: "BarData[]", required: true, description: 'Array of { label, value, color? }' },
      { name: 'orientation', type: "'horizontal' | 'vertical'", required: false, default: "'horizontal'", description: 'Bar orientation' },
      { name: 'width', type: "number", required: false, description: 'Chart width' },
      { name: 'showValues', type: "boolean", required: false, default: 'true', description: 'Show value labels' },
    ],
    examples: [
      `BarChart({\n  data: [\n    { label: 'A', value: 30 },\n    { label: 'B', value: 50 },\n    { label: 'C', value: 20 }\n  ]\n})`,
    ],
  },
  {
    name: 'Gauge',
    category: 'molecules',
    description: 'Gauge/meter display for single values.',
    props: [
      { name: 'value', type: "number", required: true, description: 'Current value' },
      { name: 'max', type: "number", required: false, default: '100', description: 'Maximum value' },
      { name: 'width', type: "number", required: false, description: 'Gauge width' },
      { name: 'showValue', type: "boolean", required: false, default: 'true', description: 'Show numeric value' },
      { name: 'zones', type: "GaugeZone[]", required: false, description: 'Color zones { min, max, color }' },
    ],
    examples: [
      `Gauge({ value: 75, max: 100, width: 30 })`,
    ],
  },
  {
    name: 'Heatmap',
    category: 'molecules',
    description: 'Grid-based heatmap visualization.',
    props: [
      { name: 'data', type: "HeatmapCell[][]", required: true, description: '2D array of { value, label? }' },
      { name: 'colorScale', type: "ColorScale", required: false, default: "'blues'", description: 'Color scale name' },
      { name: 'showValues', type: "boolean", required: false, default: 'false', description: 'Show cell values' },
    ],
    examples: [
      `Heatmap({\n  data: [[{ value: 1 }, { value: 5 }], [{ value: 3 }, { value: 8 }]],\n  colorScale: 'greens'\n})`,
    ],
  },
];
