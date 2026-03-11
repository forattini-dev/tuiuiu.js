/**
 * Design System compatibility barrel.
 *
 * This entrypoint exposes the curated UI-building layers without the lower-level
 * signal and rendering internals from the root package.
 */

export {
  Box,
  Text,
  Spacer,
  Newline,
  Fragment,
  When,
  Each,
  Transform,
  Static,
  Divider,
  Title,
  Subtitle,
  Caption,
  Label,
  SplitBox,
  Canvas,
  createCanvas,
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
  header,
  Container,
  Screen,
  screen,
  Main,
  main,
  Footer,
  footer,
  Sidebar,
  sidebar,
  Panel,
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
