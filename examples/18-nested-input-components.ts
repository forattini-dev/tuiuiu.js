/**
 * Example 18: Nested Input Components
 *
 * Demonstrates how to handle keyboard input with nested interactive components.
 * Shows the pattern for Tabs containing ButtonGroup without input conflicts.
 *
 * Key concepts:
 * - All handlers at same priority receive ALL input
 * - Use `isActive` to control which component handles input
 * - Tab key can toggle "focus areas" between parent and child
 */

import {
  render,
  Box,
  Text,
  Tabs,
  createSignal,
  useInteraction,
  useApp,
  type VNode,
} from '../src/index.js';
import { ButtonGroup } from '../src/ui/index.js';

type FocusArea = 'tabs' | 'buttons';

function NestedInputDemo(): VNode {
  const { exit } = useApp();

  // Current tab
  const [activeTab, setActiveTab] = createSignal(0);

  // Which area has "focus" for keyboard input
  const [focusArea, setFocusArea] = createSignal<FocusArea>('tabs');

  // Track button clicks
  const [lastAction, setLastAction] = createSignal('');

  // Global handler: Tab key toggles focus area
  useInteraction((event) => {
    if (event.type !== 'key') return;
    const input = event.key.text;
    const key = event.key.native;
    if (key.escape) {
      exit();
      return true;
    }

    // Tab key toggles between tabs navigation and buttons navigation
    if (key.tab) {
      setFocusArea((current) => (current === 'tabs' ? 'buttons' : 'tabs'));
      return true;
    }

    return false;
  });

  const handleAction = (action: string) => {
    setLastAction(`${action} @ ${new Date().toLocaleTimeString()}`);
  };

  return Box(
    { flexDirection: 'column', padding: 1, gap: 1 },

    // Header
    Text({ color: 'cyan', bold: true }, '🎯 Nested Input Components'),
    Text(
      { color: 'gray', dim: true },
      'Tab: toggle focus area • Escape: exit'
    ),

    // Focus indicator
    Box(
      { flexDirection: 'row', gap: 1 },
      Text({ color: 'gray' }, 'Focus:'),
      Text(
        {
          color: focusArea() === 'tabs' ? 'yellow' : 'gray',
          bold: focusArea() === 'tabs',
        },
        '[ Tabs ]'
      ),
      Text(
        {
          color: focusArea() === 'buttons' ? 'yellow' : 'gray',
          bold: focusArea() === 'buttons',
        },
        '[ Buttons ]'
      )
    ),

    Box({ height: 1 }),

    // Tabs with isActive controlled by focusArea
    Tabs({
      tabs: [
        { key: 0, label: '📁 Files', content: FilesTab() },
        { key: 1, label: '⚙️ Settings', content: SettingsTab() },
        {
          key: 2,
          label: '🎬 Actions',
          content: ActionsTab({
            isActive: focusArea() === 'buttons',
            onAction: handleAction,
          }),
        },
      ],
      initialTab: activeTab(),
      onChange: setActiveTab,
      isActive: focusArea() === 'tabs', // Only handle ← → when tabs have focus
    }),

    Box({ height: 1 }),

    // Status
    Text({ color: 'gray' }, `Last action: ${lastAction() || 'none'}`),

    // Instructions
    Box({ marginTop: 1 }),
    Text({ color: 'gray', dim: true }, 'Try this:'),
    Text(
      { color: 'gray', dim: true },
      '1. Use ← → to switch tabs (Tabs has focus)'
    ),
    Text(
      { color: 'gray', dim: true },
      '2. Press Tab to switch focus to Buttons'
    ),
    Text(
      { color: 'gray', dim: true },
      '3. Use ← → to navigate buttons, Enter to click'
    ),
    Text(
      { color: 'gray', dim: true },
      '4. Press Tab again to return focus to Tabs'
    )
  );
}

function FilesTab(): VNode {
  return Box(
    { padding: 1 },
    Text({}, '📄 document.txt'),
    Text({}, '📄 readme.md'),
    Text({}, '📁 src/')
  );
}

function SettingsTab(): VNode {
  return Box(
    { padding: 1 },
    Text({}, '⚙️ Theme: Dark'),
    Text({}, '⚙️ Language: English'),
    Text({}, '⚙️ Notifications: On')
  );
}

interface ActionsTabProps {
  isActive: boolean;
  onAction: (action: string) => void;
}

function ActionsTab({ isActive, onAction }: ActionsTabProps): VNode {
  return Box(
    { padding: 1, flexDirection: 'column', gap: 1 },
    Text(
      { color: isActive ? 'yellow' : 'gray' },
      isActive ? '👆 Buttons have focus' : '👇 Press Tab to focus buttons'
    ),
    ButtonGroup({
      buttons: [
        {
          label: '💾 Save',
          variant: 'solid',
          color: 'success',
          onClick: () => onAction('Save'),
        },
        {
          label: '📤 Export',
          variant: 'outline',
          onClick: () => onAction('Export'),
        },
        {
          label: '🗑️ Delete',
          variant: 'ghost',
          color: 'error',
          onClick: () => onAction('Delete'),
        },
      ],
      isActive, // Only handle ← → Enter when buttons have focus
    })
  );
}

render(() => NestedInputDemo());
