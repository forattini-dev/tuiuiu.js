#!/usr/bin/env node
/**
 * Advanced Charts Example
 *
 * Demonstra todos os novos tipos de gráficos:
 * - ScatterPlot: Análise de correlação 2D
 * - RadarChart: Comparação multi-dimensional
 * - GanttChart: Timeline de projetos
 * - TimeHeatmap: Atividade ao longo do tempo
 *
 * Run with: pnpm tsx examples/21-advanced-charts.ts
 */

import { render, Box, Text, Spacer } from '../src/index.js';
import {
  ScatterPlot,
  RadarChart,
  GanttChart,
  TimeHeatmap,
  Legend,
  LineChart,
} from '../src/molecules/data-viz/index.js';

const { waitUntilExit } = render(
  Box(
    { flexDirection: 'column', padding: 1 },
    // Title
    Text({ color: 'cyan', bold: true }, '🎨 Advanced Chart Visualizations'),
    Spacer(),

    // 1. LineChart with Multi-Series Colors
    Box(
      { flexDirection: 'column', marginBottom: 2, paddingBottom: 1, borderStyle: 'round', borderColor: 'cyan' },
      Text({ color: 'cyan', bold: true }, '1️⃣  LineChart - Multi-Series Colors'),
      Spacer(),
      LineChart({
        series: [
          { name: 'Opus 4.5', data: [10, 25, 30, 45, 60, 55, 70], color: 'cyan' },
          { name: 'Sonnet 4.5', data: [15, 20, 35, 40, 55, 65, 75], color: 'green' },
          { name: 'Haiku 4.5', data: [5, 15, 25, 35, 45, 50, 60], color: 'yellow' },
        ],
        width: 50,
        height: 10,
        title: 'Model Performance Over Time',
        showLegend: true,
      })
    ),

    // 2. ScatterPlot
    Box(
      { flexDirection: 'column', marginBottom: 2, paddingBottom: 1 },
      Text({ color: 'green', bold: true }, '2️⃣  ScatterPlot - Correlation Analysis'),
      Spacer(),
      ScatterPlot({
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 6 },
          { x: 4, y: 8 },
          { x: 5, y: 10 },
          { x: 6, y: 12 },
        ],
        width: 40,
        height: 10,
        title: 'X vs Y Correlation',
        markerStyle: 'circle',
      })
    ),

    // 3. RadarChart
    Box(
      { flexDirection: 'column', marginBottom: 2, paddingBottom: 1 },
      Text({ color: 'yellow', bold: true }, '3️⃣  RadarChart - Multi-Dimensional Comparison'),
      Spacer(),
      RadarChart({
        axes: [
          { name: 'Speed', max: 100 },
          { name: 'Power', max: 100 },
          { name: 'Range', max: 100 },
          { name: 'Efficiency', max: 100 },
          { name: 'Durability', max: 100 },
        ],
        series: [
          { name: 'Model A', values: [80, 75, 70, 85, 80], color: 'cyan' },
          { name: 'Model B', values: [70, 85, 80, 75, 90], color: 'green' },
        ],
        showLegend: true,
      })
    ),

    // 4. GanttChart
    Box(
      { flexDirection: 'column', marginBottom: 2, paddingBottom: 1 },
      Text({ color: 'magenta', bold: true }, '4️⃣  GanttChart - Project Timeline'),
      Spacer(),
      GanttChart({
        tasks: [
          {
            id: '1',
            name: 'Design',
            startDate: '2024-01-01',
            endDate: '2024-01-15',
            progress: 100,
            status: 'complete',
          },
          {
            id: '2',
            name: 'Development',
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            progress: 65,
            status: 'in-progress',
          },
          {
            id: '3',
            name: 'Testing',
            startDate: '2024-02-01',
            endDate: '2024-02-20',
            progress: 30,
            status: 'in-progress',
            dependsOn: '2',
          },
          {
            id: '4',
            name: 'Deployment',
            startDate: '2024-02-20',
            endDate: '2024-02-25',
            progress: 0,
            status: 'pending',
            dependsOn: '3',
          },
        ],
        width: 70,
        title: 'Project Timeline Q1 2024',
        showLegend: true,
      })
    ),

    // 5. TimeHeatmap
    Box(
      { flexDirection: 'column', marginBottom: 2, paddingBottom: 1 },
      Text({ color: 'blue', bold: true }, '5️⃣  TimeHeatmap - Activity Calendar'),
      Spacer(),
      TimeHeatmap({
        data: [
          { date: '2024-12-01', value: 5 },
          { date: '2024-12-02', value: 10 },
          { date: '2024-12-03', value: 8 },
          { date: '2024-12-04', value: 15 },
          { date: '2024-12-05', value: 12 },
          { date: '2024-12-06', value: 20 },
          { date: '2024-12-07', value: 18 },
          { date: '2024-12-08', value: 5 },
          { date: '2024-12-09', value: 10 },
          { date: '2024-12-10', value: 25 },
          { date: '2024-12-11', value: 30 },
          { date: '2024-12-12', value: 22 },
        ],
        granularity: 'day',
        colorScale: 'greens',
        title: 'Daily Activity Heatmap',
        showLegend: true,
      })
    ),

    // 6. Legend Component
    Box(
      { flexDirection: 'column', marginBottom: 1 },
      Text({ color: 'red', bold: true }, '6️⃣  Legend - Reusable Component'),
      Spacer(),
      Legend({
        items: [
          { label: 'Critical', color: 'red' },
          { label: 'High', color: 'yellow' },
          { label: 'Medium', color: 'blue' },
          { label: 'Low', color: 'green' },
        ],
        position: 'bottom',
        showSymbols: true,
      })
    ),

    Spacer(),
    Text({ color: 'gray', dim: true }, 'Press Ctrl+C to exit')
  )
);

await waitUntilExit();
