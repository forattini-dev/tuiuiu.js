/**
 * Example 05: Multi-Component Dashboard
 *
 * Demonstrates:
 * - Page layout with header/footer
 * - VStack/HStack for layout
 * - Multiple interactive components
 * - Component composition
 * - State management across components
 *
 * Run: pnpm tsx examples/05-multi-component.ts
 */

import {
  render,
  Box,
  Text,
  useState,
  useInput,
  useApp,
  createTextInput,
  renderTextInput,
  createSelect,
  renderSelect,
  Page,
  VStack,
  HStack,
  Divider,
  type VNode,
  type SelectItem,
} from '../src/index.js';

// Task interface
interface Task {
  id: number;
  text: string;
  priority: 'low' | 'medium' | 'high';
  done: boolean;
}

// Priority options
const priorityOptions: SelectItem<'low' | 'medium' | 'high'>[] = [
  { value: 'high', label: '🔴 High' },
  { value: 'medium', label: '🟡 Medium' },
  { value: 'low', label: '🟢 Low' },
];

// Priority colors
const priorityColors: Record<string, string> = {
  high: 'red',
  medium: 'yellow',
  low: 'green',
};

// Task Item Component
function TaskItem(task: Task, isSelected: boolean): VNode {
  const checkbox = task.done ? '☑' : '☐';
  const priorityColor = priorityColors[task.priority];

  return HStack({
    gap: 2,
    children: [
      Text({ color: isSelected ? 'cyan' : 'white' }, isSelected ? '▶' : ' '),
      Text({ color: task.done ? 'gray' : 'white', dim: task.done }, checkbox),
      Text({ color: priorityColor }, '●'),
      Text(
        {
          color: task.done ? 'gray' : 'white',
          dim: task.done,
          strikethrough: task.done,
        },
        task.text
      ),
    ],
  });
}

// Stats Component
function Stats(tasks: Task[]): VNode {
  const total = tasks.length;
  const done = tasks.filter((t) => t.done).length;
  const pending = total - done;
  const highPriority = tasks.filter((t) => t.priority === 'high' && !t.done).length;

  return HStack({
    gap: 4,
    children: [
      Text({ color: 'cyan' }, `Total: ${total}`),
      Text({ color: 'green' }, `Done: ${done}`),
      Text({ color: 'yellow' }, `Pending: ${pending}`),
      Text({ color: 'red' }, `High Priority: ${highPriority}`),
    ],
  });
}

function TaskManager(): VNode {
  const { exit } = useApp();

  // Application state
  const [tasks, setTasks] = useState<Task[]>([
    { id: 1, text: 'Learn tuiuiu', priority: 'high', done: true },
    { id: 2, text: 'Build a TUI app', priority: 'high', done: false },
    { id: 3, text: 'Add more examples', priority: 'medium', done: false },
    { id: 4, text: 'Write documentation', priority: 'medium', done: false },
    { id: 5, text: 'Take a break', priority: 'low', done: false },
  ]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mode, setMode] = useState<'list' | 'add'>('list');
  const [nextId, setNextId] = useState(6);

  // Input for adding new task
  const newTaskInput = createTextInput({
    placeholder: 'Enter task description...',
    isActive: mode() === 'add',
    onSubmit: (value) => {
      if (value.trim()) {
        setTasks((t) => [
          ...t,
          {
            id: nextId(),
            text: value.trim(),
            priority: selectedPriority() as 'low' | 'medium' | 'high',
            done: false,
          },
        ]);
        setNextId((id) => id + 1);
        newTaskInput.clear();
        setSelectedPriority('medium');
        setMode('list');
      }
    },
  });

  const [selectedPriority, setSelectedPriority] = useState<string>('medium');
  const prioritySelect = createSelect({
    items: priorityOptions,
    isActive: false, // We'll use Tab to switch focus
    onChange: (value) => setSelectedPriority(value),
  });

  useInput((char, key) => {
    if (mode() === 'add') {
      // In add mode, Escape cancels
      if (key.escape) {
        setMode('list');
        newTaskInput.clear();
        return;
      }
      return; // Let input handle other keys
    }

    // List mode navigation
    if (key.upArrow || char === 'k') {
      setSelectedIndex((i) => Math.max(0, i - 1));
      return;
    }
    if (key.downArrow || char === 'j') {
      setSelectedIndex((i) => Math.min(tasks().length - 1, i + 1));
      return;
    }

    // Toggle done
    if (char === ' ' || key.return) {
      setTasks((t) =>
        t.map((task, i) => (i === selectedIndex() ? { ...task, done: !task.done } : task))
      );
      return;
    }

    // Delete task
    if (char === 'd' || key.delete) {
      if (tasks().length > 0) {
        setTasks((t) => t.filter((_, i) => i !== selectedIndex()));
        setSelectedIndex((i) => Math.min(i, Math.max(0, tasks().length - 2)));
      }
      return;
    }

    // Add new task
    if (char === 'a') {
      setMode('add');
      return;
    }

    // Cycle priority of selected task
    if (char === 'p') {
      const priorities: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
      setTasks((t) =>
        t.map((task, i) => {
          if (i === selectedIndex()) {
            const currentIdx = priorities.indexOf(task.priority);
            const nextIdx = (currentIdx + 1) % 3;
            return { ...task, priority: priorities[nextIdx] };
          }
          return task;
        })
      );
      return;
    }

    // Clear completed
    if (char === 'c') {
      setTasks((t) => t.filter((task) => !task.done));
      setSelectedIndex(0);
      return;
    }

    if (key.escape || (key.ctrl && char === 'c')) {
      exit();
    }
  });

  // Add mode UI
  if (mode() === 'add') {
    return Page({
      title: 'Task Manager',
      titleColor: 'cyan',
      subtitle: 'Adding new task',
      divider: true,
      padding: 1,
      footer: Text({ color: 'gray', dim: true }, 'Enter: add task  ESC: cancel'),
      children: VStack({
        gap: 1,
        children: [
          Text({ color: 'cyan', bold: true }, 'New Task:'),
          renderTextInput(newTaskInput),
          Text({}),
          Text({ color: 'gray' }, 'Priority:'),
          renderSelect(prioritySelect),
        ],
      }),
    });
  }

  // List mode UI
  const taskList = tasks();

  return Page({
    title: 'Task Manager',
    titleColor: 'cyan',
    subtitle: `${taskList.length} tasks`,
    divider: true,
    padding: 1,
    footer: HStack({
      gap: 2,
      children: [
        Text({ color: 'gray', dim: true }, '↑↓: navigate'),
        Text({ color: 'gray', dim: true }, 'Space: toggle'),
        Text({ color: 'gray', dim: true }, 'a: add'),
        Text({ color: 'gray', dim: true }, 'd: delete'),
        Text({ color: 'gray', dim: true }, 'p: priority'),
        Text({ color: 'gray', dim: true }, 'c: clear done'),
        Text({ color: 'gray', dim: true }, 'ESC: quit'),
      ],
    }),
    children: VStack({
      gap: 1,
      children: [
        // Stats bar
        Stats(taskList),
        Divider({ color: 'gray' }),

        // Task list
        taskList.length > 0
          ? VStack({
              gap: 0,
              children: taskList.map((task, index) => TaskItem(task, index === selectedIndex())),
            })
          : Text({ color: 'gray', italic: true }, 'No tasks. Press "a" to add one.'),
      ],
    }),
  });
}

const { waitUntilExit } = render(() => TaskManager());
await waitUntilExit();
