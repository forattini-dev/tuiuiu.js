/**
 * Theme Showcase Demo - For documentation GIF
 * Shows theme colors and switching between themes
 */

import {
  render,
  Box,
  Text,
  useApp,
  useEffect,
  createSignal,
  setTheme,
  useTheme,
  themes,
  themeNames,
  resolveColor,
  type VNode,
} from '../../src/index.js';

function ThemeShowcase(): VNode {
  const { exit } = useApp();
  const [themeIndex, setThemeIndex] = createSignal(0);

  const themeOrder = ['dark', 'dracula', 'nord', 'gruvbox', 'tokyo-night', 'catppuccin', 'monokai'] as const;

  useEffect(() => {
    // Cycle through themes
    const interval = setInterval(() => {
      const nextIndex = (themeIndex() + 1) % themeOrder.length;
      setThemeIndex(nextIndex);
      const themeName = themeOrder[nextIndex];
      setTheme(themes[themeName as keyof typeof themes]);
    }, 2500);

    setTimeout(() => exit(), 20000);
    return () => clearInterval(interval);
  });

  const theme = useTheme();
  const currentThemeName = themeOrder[themeIndex()];

  return Box(
    { flexDirection: 'column', padding: 1, backgroundColor: resolveColor('background') },

    // Header
    Box(
      { flexDirection: 'row', justifyContent: 'space-between' },
      Text({ color: resolveColor('primary'), bold: true }, '🎨 Tuiuiu Themes'),
      Text({ color: resolveColor('mutedForeground') }, `Current: ${currentThemeName}`)
    ),
    Box({ height: 1 }),

    // Color swatches
    Box(
      { flexDirection: 'row', gap: 2 },

      // Semantic colors
      Box(
        { flexDirection: 'column', gap: 0 },
        Text({ color: resolveColor('foreground'), bold: true }, 'Semantic Colors'),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: resolveColor('primary'), width: 10, padding: 0 },
            Text({ color: resolveColor('primaryForeground') }, ' primary ')
          ),
          Box({ backgroundColor: resolveColor('secondary'), width: 12, padding: 0 },
            Text({ color: resolveColor('foreground') }, ' secondary ')
          ),
        ),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: resolveColor('success'), width: 10, padding: 0 },
            Text({ color: resolveColor('successForeground') }, ' success ')
          ),
          Box({ backgroundColor: resolveColor('warning'), width: 10, padding: 0 },
            Text({ color: resolveColor('warningForeground') }, ' warning ')
          ),
        ),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ backgroundColor: resolveColor('error'), width: 10, padding: 0 },
            Text({ color: resolveColor('dangerForeground') }, '  error  ')
          ),
          Box({ backgroundColor: resolveColor('info'), width: 10, padding: 0 },
            Text({ color: resolveColor('infoForeground') }, '   info  ')
          ),
        ),
      ),

      // Backgrounds
      Box(
        { flexDirection: 'column', gap: 0 },
        Text({ color: resolveColor('foreground'), bold: true }, 'Backgrounds'),
        Box({ height: 1 }),
        Box({ backgroundColor: resolveColor('background'), borderStyle: 'single', borderColor: resolveColor('muted'), width: 14, padding: 0 },
          Text({ color: resolveColor('foreground') }, ' background ')
        ),
        Box({ height: 1 }),
        Box({ backgroundColor: resolveColor('surface'), width: 14, padding: 0 },
          Text({ color: resolveColor('foreground') }, '  surface   ')
        ),
        Box({ height: 1 }),
        Box({ backgroundColor: resolveColor('muted'), width: 14, padding: 0 },
          Text({ color: resolveColor('foreground') }, '   muted    ')
        ),
      ),

      // Text hierarchy
      Box(
        { flexDirection: 'column', gap: 0 },
        Text({ color: resolveColor('foreground'), bold: true }, 'Text'),
        Box({ height: 1 }),
        Text({ color: resolveColor('foreground') }, 'foreground'),
        Box({ height: 1 }),
        Text({ color: resolveColor('mutedForeground') }, 'mutedForeground'),
        Box({ height: 1 }),
        Text({ color: resolveColor('accent') }, 'accent'),
      ),
    ),

    Box({ height: 1 }),

    // Example UI with theme colors
    Box(
      { borderStyle: 'round', borderColor: resolveColor('muted'), padding: 1 },
      Box(
        { flexDirection: 'column', gap: 0 },
        Text({ color: resolveColor('foreground'), bold: true }, 'Example UI'),
        Box({ height: 1 }),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { backgroundColor: resolveColor('primary'), padding: 0, borderStyle: 'round', borderColor: resolveColor('primary') },
            Text({ color: resolveColor('primaryForeground'), bold: true }, ' Submit ')
          ),
          Box(
            { backgroundColor: resolveColor('muted'), padding: 0, borderStyle: 'round', borderColor: resolveColor('muted') },
            Text({ color: resolveColor('foreground') }, ' Cancel ')
          ),
          Box(
            { backgroundColor: resolveColor('error'), padding: 0, borderStyle: 'round', borderColor: resolveColor('error') },
            Text({ color: resolveColor('dangerForeground'), bold: true }, ' Delete ')
          ),
        ),
      )
    ),

    Box({ height: 1 }),

    // Theme indicator
    Box(
      { flexDirection: 'row', gap: 1 },
      ...themeOrder.map((name, i) =>
        Text(
          {
            color: i === themeIndex() ? resolveColor('primary') : resolveColor('mutedForeground'),
            bold: i === themeIndex(),
          },
          i === themeIndex() ? `[${name}]` : name
        )
      )
    )
  );
}

render(() => ThemeShowcase());
