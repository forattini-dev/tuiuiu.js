/**
 * DataTable Demo - For documentation GIF
 * Shows interactive table with keyboard navigation
 */

import { render, Box, Text, useInput, useApp, type VNode } from '../../src/index.js';
import { DataTable, createDataTable } from '../../src/organisms/data-table.js';

const sampleData = [
  { id: 1, name: 'Alice Johnson', role: 'Engineer', status: 'Active', score: 95 },
  { id: 2, name: 'Bob Smith', role: 'Designer', status: 'Active', score: 87 },
  { id: 3, name: 'Carol White', role: 'Manager', status: 'Away', score: 92 },
  { id: 4, name: 'David Brown', role: 'Engineer', status: 'Active', score: 78 },
  { id: 5, name: 'Eva Green', role: 'Analyst', status: 'Offline', score: 89 },
];

function DataTableDemo(): VNode {
  const { exit } = useApp();

  const table = createDataTable({
    columns: [
      { key: 'name', label: 'Name', width: 16, sortable: true },
      { key: 'role', label: 'Role', width: 10, sortable: true },
      { key: 'status', label: 'Status', width: 8 },
      { key: 'score', label: 'Score', width: 6, align: 'right' as const, sortable: true },
    ],
    data: sampleData,
    selectionMode: 'single',
    borderStyle: 'round',
    colorHeader: 'cyan',
    colorSelected: 'blue',
  });

  useInput((_, key) => {
    if (key.escape) exit();
  });

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '📋 DataTable'),
    Box({ height: 1 }),
    DataTable(table.options),
    Box({ height: 1 }),
    Text({ color: 'gray', dim: true }, '↑↓ navigate • Enter select • Esc exit')
  );
}

render(() => DataTableDemo());
