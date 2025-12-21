/**
 * Templates - Page-level layout scaffolds
 *
 * Templates provide the highest-level layout patterns in the Atomic Design
 * hierarchy. They combine organisms into complete page layouts and app shells.
 *
 * @example
 * ```typescript
 * import {
 *   // Stack layouts
 *   VStack, HStack, Center, FullScreen, Spacer, Divider,
 *   // App layouts
 *   Page, AppShell, StatusBar, Header, Container,
 * } from './templates/index.js';
 *
 * // Simple centered content
 * Center({ children: Modal({ title: 'Welcome' }) })
 *
 * // Complete application shell
 * AppShell({
 *   header: Header({ title: 'My App' }),
 *   sidebar: Navigation(),
 *   footer: StatusBar({ left: Text({}, 'Ready') }),
 *   children: MainContent()
 * })
 * ```
 */

// =============================================================================
// Stack Layouts
// =============================================================================

export {
  // Components
  VStack,
  HStack,
  Center,
  FullScreen,
  Spacer,
  Divider,
  // Types
  type VStackProps,
  type HStackProps,
  type CenterProps,
  type FullScreenProps,
  type SpacerProps,
  type DividerProps,
} from './stack.js';

// =============================================================================
// Application Layouts
// =============================================================================

export {
  // Components
  Page,
  AppShell,
  StatusBar,
  Header,
  Container,
  // Types
  type PageProps,
  type AppShellProps,
  type StatusBarProps,
  type HeaderProps,
  type ContainerProps,
} from './app.js';
