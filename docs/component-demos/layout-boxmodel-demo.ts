/**
 * Layout Box Model Demo - For documentation GIF
 * Shows margin, border, padding, and content visually
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

function BoxModelDemo(): VNode {
  const { exit } = useApp();
  const [step, setStep] = createSignal(0);

  useEffect(() => {
    // Animate through different states
    const interval = setInterval(() => {
      setStep(s => (s + 1) % 5);
    }, 2000);

    setTimeout(() => exit(), 12000);
    return () => clearInterval(interval);
  });

  const currentStep = step();

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, '📦 Box Model: Margin → Border → Padding → Content'),
    Box({ height: 1 }),

    // Main demonstration area
    Box(
      { flexDirection: 'row', gap: 4 },

      // Visual box model
      Box(
        { flexDirection: 'column', alignItems: 'center' },
        // Outer margin area (simulated with background)
        Box(
          {
            backgroundColor: currentStep >= 0 ? '#1a3a5c' : undefined,
            padding: 1,
          },
          Text({ color: 'cyan', dim: true }, currentStep >= 0 ? '  margin  ' : '          '),
          Box(
            {
              borderStyle: currentStep >= 1 ? 'round' : undefined,
              borderColor: currentStep >= 1 ? 'yellow' : undefined,
              padding: currentStep >= 2 ? 2 : 0,
              backgroundColor: currentStep >= 2 ? '#2a2a4a' : undefined,
            },
            currentStep >= 2
              ? Box(
                  { flexDirection: 'column' },
                  Text({ color: 'magenta', dim: true }, '  padding  '),
                  Box(
                    {
                      backgroundColor: currentStep >= 3 ? '#3a5a3a' : undefined,
                      padding: 1,
                    },
                    Text({ color: 'green', bold: currentStep >= 3 }, currentStep >= 3 ? ' CONTENT ' : '         ')
                  ),
                  Text({ color: 'magenta', dim: true }, '  padding  ')
                )
              : Text({}, currentStep >= 1 ? '         ' : '         ')
          ),
          Text({ color: 'cyan', dim: true }, currentStep >= 0 ? '  margin  ' : '          ')
        )
      ),

      // Legend
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'white', bold: true }, 'Legend:'),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: '#1a3a5c', width: 3 }, Text({}, '   ')),
          Text({ color: currentStep >= 0 ? 'cyan' : 'gray' }, 'Margin (outside)')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ borderStyle: 'round', borderColor: 'yellow', width: 3 }, Text({}, ' ')),
          Text({ color: currentStep >= 1 ? 'yellow' : 'gray' }, 'Border (1 char)')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: '#2a2a4a', width: 3 }, Text({}, '   ')),
          Text({ color: currentStep >= 2 ? 'magenta' : 'gray' }, 'Padding (inside)')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: '#3a5a3a', width: 3 }, Text({}, '   ')),
          Text({ color: currentStep >= 3 ? 'green' : 'gray' }, 'Content')
        ),
      )
    ),

    Box({ height: 1 }),

    // Current step indicator
    Box(
      { flexDirection: 'row', gap: 2 },
      Text({ color: currentStep === 0 ? 'cyan' : 'gray', bold: currentStep === 0 }, '1.Margin'),
      Text({ color: 'gray' }, '→'),
      Text({ color: currentStep === 1 ? 'yellow' : 'gray', bold: currentStep === 1 }, '2.Border'),
      Text({ color: 'gray' }, '→'),
      Text({ color: currentStep === 2 ? 'magenta' : 'gray', bold: currentStep === 2 }, '3.Padding'),
      Text({ color: 'gray' }, '→'),
      Text({ color: currentStep === 3 ? 'green' : 'gray', bold: currentStep === 3 }, '4.Content'),
      Text({ color: 'gray' }, '→'),
      Text({ color: currentStep === 4 ? 'white' : 'gray', bold: currentStep === 4 }, '5.Complete!')
    ),

    Box({ height: 1 }),

    // Code example for current step
    Box(
      { borderStyle: 'round', borderColor: 'gray', padding: 1 },
      Text(
        { color: 'white' },
        currentStep === 0
          ? 'Box({ margin: 2 }, ...)'
          : currentStep === 1
            ? 'Box({ margin: 2, borderStyle: "round" }, ...)'
            : currentStep === 2
              ? 'Box({ margin: 2, borderStyle: "round", padding: 2 }, ...)'
              : currentStep === 3
                ? 'Box({ margin: 2, borderStyle: "round", padding: 2 }, Text({}, "Content"))'
                : '✓ Complete Box Model!'
      )
    )
  );
}

render(() => BoxModelDemo());
