/** Visual elements, controls, composites and themes. */

export {
  Box,
  Text,
  CursorAnchor,
  Spacer,
  Newline,
  Fragment,
  When,
  Each,
  Transform,
  Static,
  Slot,
  Divider,
  Title,
  Subtitle,
  Caption,
  Label,
  SplitBox,
  Canvas,
  createCanvas,
  bresenhamLine,
  midpointCircle,
  rectanglePoints,
  Computed,
  ComputedText,
  Memo,
  PreText,
  createReactiveStore,
  AppendList,
  Scroll,
  createScroll,
  useScroll,
} from '../primitives/index.js';

export type {
  ScrollProps,
  ScrollState,
  UseScrollOptions,
  UseScrollReturn,
  SplitBoxProps,
  SplitBoxSection,
  CanvasMode,
  CanvasColor,
  CanvasOptions,
  CanvasState,
  Point,
} from '../primitives/index.js';

export type { PreTextProps } from '../primitives/computed-node.js';
export type { AppendListProps } from '../primitives/append-list.js';

export * from '../atoms/index.js';
export * from '../molecules/index.js';
export * from '../organisms/index.js';

export {
  VStack,
  HStack,
  Center,
  FullScreen,
  Page,
  AppShell,
  StatusBar,
  Header,
  Container,
  Screen,
  Main,
  Footer,
  Sidebar,
  Panel,
  screen,
  main,
  footer,
  sidebar,
  header,
} from '../templates/index.js';

export type {
  VStackProps,
  HStackProps,
  CenterProps,
  FullScreenProps,
  PageProps,
  AppShellProps,
  StatusBarProps,
  HeaderProps,
  LayoutHeaderProps,
  ContainerProps,
  ScreenProps,
  MainProps,
  FooterProps,
  SidebarProps,
  PanelProps,
} from '../templates/index.js';

export {
  defineTheme,
  mergeThemes,
  validateTheme,
  isValidTheme,
  darkTheme,
  lightTheme,
  monokaiTheme,
  draculaTheme,
  nordTheme,
  solarizedDarkTheme,
  gruvboxTheme,
  tokyoNightTheme,
  catppuccinTheme,
  highContrastDarkTheme,
  monochromeTheme,
  pinkTheme,
  orangeTheme,
  themes,
  themeNames,
} from '../themes/index.js';

export {
  setTheme,
  useTheme,
  getTheme,
  useThemeMode,
  useIsDark,
  useComponentTokens,
  pushTheme,
  popTheme,
  getThemeByName,
  getNextTheme,
  getPreviousTheme,
  createTheme,
  resolveColor,
} from '../core/theme.js';

export type {
  ThemeDefinition,
  Theme,
  ThemePalette,
  ThemeBackground,
  ThemeForeground,
  ThemeAccent,
  ThemeStates,
  ThemeBorders,
  ThemeOpacity,
  ComponentTokens,
  ThemeMeta,
  ThemeMode,
  ColorScale as ThemeColorScale,
  ThemeName,
} from '../themes/index.js';
export * from '../styling/index.js';
export * from '../presets/index.js';
