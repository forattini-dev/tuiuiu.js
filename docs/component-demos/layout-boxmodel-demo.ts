/**
 * Layout Box Model Demo - For documentation GIF
 * Shows practical examples of padding, margin, border configurations
 */

import {
  render,
  Box,
  Text,
  useApp,
  useEffect,
  createSignal,
  type VNode,
} from '../../src/index.js';

function LayoutDemo(): VNode {
  const { exit } = useApp();
  const [step, setStep] = createSignal(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 6);
    }, 2500);

    setTimeout(() => exit(), 16000);
    return () => clearInterval(interval);
  });

  const s = step();

  // Dynamic box that changes based on step
  const getDynamicProps = () => {
    switch (s) {
      case 0: return { padding: 0, margin: 0, borderStyle: undefined, label: 'No styling' };
      case 1: return { padding: 1, margin: 0, borderStyle: undefined, label: 'padding: 1' };
      case 2: return { padding: 2, margin: 0, borderStyle: undefined, label: 'padding: 2' };
      case 3: return { padding: 1, margin: 0, borderStyle: 'round' as const, label: 'borderStyle: "round"' };
      case 4: return { padding: 1, margin: 1, borderStyle: 'round' as const, label: 'margin: 1' };
      case 5: return { padding: 2, margin: 2, borderStyle: 'double' as const, label: 'All combined' };
      default: return { padding: 0, margin: 0, borderStyle: undefined, label: '' };
    }
  };

  const props = getDynamicProps();

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '📦 Layout: Padding, Margin & Border'),
    Box({ height: 1 }),

    // Side by side comparison
    Box(
      { flexDirection: 'row', gap: 3 },

      // Padding examples
      Box(
        { flexDirection: 'column' },
        Text({ color: 'yellow', bold: true }, 'Padding'),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { backgroundColor: '#1a3a5c', padding: 0 },
            Text({ color: 'white' }, 'p:0')
          ),
          Box(
            { backgroundColor: '#1a3a5c', padding: 1 },
            Text({ color: 'white' }, 'p:1')
          ),
          Box(
            { backgroundColor: '#1a3a5c', padding: 2 },
            Text({ color: 'white' }, 'p:2')
          ),
        ),
      ),

      // Border examples
      Box(
        { flexDirection: 'column' },
        Text({ color: 'magenta', bold: true }, 'Border Styles'),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { borderStyle: 'single', borderColor: 'gray', padding: 0 },
            Text({}, 'single')
          ),
          Box(
            { borderStyle: 'round', borderColor: 'cyan', padding: 0 },
            Text({}, 'round')
          ),
          Box(
            { borderStyle: 'double', borderColor: 'yellow', padding: 0 },
            Text({}, 'double')
          ),
        ),
      ),
    ),

    Box({ height: 1 }),

    // Margin examples
    Box(
      { flexDirection: 'column' },
      Text({ color: 'green', bold: true }, 'Margin (space between boxes)'),
      Box({ height: 1 }),
      Box(
        { flexDirection: 'row', backgroundColor: '#2a2a2a' },
        Box(
          { backgroundColor: '#3a5a3a', margin: 0, padding: 1 },
          Text({ color: 'white' }, 'm:0')
        ),
        Box(
          { backgroundColor: '#3a5a3a', margin: 1, padding: 1 },
          Text({ color: 'white' }, 'm:1')
        ),
        Box(
          { backgroundColor: '#3a5a3a', margin: 2, padding: 1 },
          Text({ color: 'white' }, 'm:2')
        ),
      ),
    ),

    Box({ height: 1 }),

    // Dynamic example
    Box(
      { flexDirection: 'row', gap: 3 },
      Box(
        { flexDirection: 'column' },
        Text({ color: 'white', bold: true }, 'Dynamic Example:'),
        Box({ height: 1 }),
        Box(
          { backgroundColor: '#2a4a6a' },
          Box(
            {
              backgroundColor: '#4a6a8a',
              padding: props.padding,
              margin: props.margin,
              borderStyle: props.borderStyle,
              borderColor: 'cyan',
            },
            Text({ color: 'white', bold: true }, 'Content')
          ),
        ),
      ),
      Box(
        { flexDirection: 'column', justifyContent: 'center' },
        Text({ color: 'cyan', bold: true }, `→ ${props.label}`),
      ),
    ),

    Box({ height: 1 }),

    // Step indicator
    Box(
      { flexDirection: 'row', gap: 1 },
      ...Array.from({ length: 6 }, (_, i) =>
        Text({ color: i === s ? 'cyan' : 'gray', bold: i === s }, i === s ? '●' : '○')
      )
    ),
  );
}

render(() => LayoutDemo());
