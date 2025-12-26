/**
 * Button Demo - For documentation GIF
 * Shows ButtonGroup with out-of-the-box keyboard navigation
 *
 * Features demonstrated:
 * - Arrow keys navigate between buttons
 * - Enter/Space triggers onClick
 * - Automatic focus management
 * - No manual useInput needed!
 */

import { render, Box, Text, ButtonGroup, createSignal, useInput, useApp, type VNode } from '../../src/index.js';

function ButtonDemo(): VNode {
  const [clicks, setClicks] = createSignal(0);
  const [lastAction, setLastAction] = createSignal('');
  const { exit } = useApp();

  // Only escape to exit - all other input is handled by ButtonGroup!
  useInput((_, key) => {
    if (key.escape) exit();
  });

  const handleClick = (action: string) => {
    setClicks(c => c + 1);
    setLastAction(action);
  };

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '🔘 ButtonGroup with Keyboard Navigation'),
    Box({ height: 1 }),

    // ButtonGroup handles arrow keys + Enter automatically!
    ButtonGroup({
      buttons: [
        {
          label: '💾 Save',
          variant: 'solid',
          color: 'success',
          onClick: () => handleClick('Save')
        },
        {
          label: '↩️ Cancel',
          variant: 'outline',
          onClick: () => handleClick('Cancel')
        },
        {
          label: '🗑️ Delete',
          variant: 'ghost',
          color: 'error',
          onClick: () => handleClick('Delete')
        }
      ],
      direction: 'horizontal',
      gap: 1,
    }),

    Box({ height: 1 }),
    Text({ color: 'gray' }, `Clicks: ${clicks()}  Last: ${lastAction() || '-'}`),
    Text({ color: 'gray', dim: true }, '← → navigate • Enter/Space click • Esc exit')
  );
}

render(() => ButtonDemo());
