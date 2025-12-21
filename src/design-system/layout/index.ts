/**
 * Design System Layout - Layout utility components
 *
 * Basic Layouts:
 * - VStack, HStack: Stack layouts with gap
 * - Center: Center content
 * - FullScreen: Fill terminal
 * - Spacer, Divider: Layout helpers
 *
 * Split Layouts:
 * - SplitPanel: Two-panel split
 * - ThreePanel: Three-panel layout
 *
 * App Layouts:
 * - Page: Single page with header/footer
 * - AppShell: Complete app structure
 * - Header, StatusBar: App chrome
 * - Container: Constrained width container
 */

// Stack Layouts
export {
  VStack,
  HStack,
  Center,
  FullScreen,
  Spacer,
  Divider,
  type VStackProps,
  type HStackProps,
  type CenterProps,
  type FullScreenProps,
  type SpacerProps,
  type DividerProps,
} from './stack.js';

// Split Panel
export {
  SplitPanel,
  ThreePanel,
  createSplitPanel,
  type SplitPanelProps,
  type SplitPanelState,
  type ThreePanelProps,
  type DividerStyle,
} from './split-panel.js';

// App Layouts
export {
  Page,
  AppShell,
  StatusBar,
  Header,
  Container,
  type PageProps,
  type AppShellProps,
  type StatusBarProps,
  type HeaderProps,
  type ContainerProps,
} from './app.js';

// Tabs
export {
  Tabs,
  createTabs,
  TabPanel,
  VerticalTabs,
  LazyTabs,
  type Tab,
  type TabsOptions,
  type TabsState,
  type TabsProps,
  type TabPanelProps,
  type VerticalTabsOptions,
  type LazyTabsProps,
} from './tabs.js';

// Collapsible
export {
  Collapsible,
  createCollapsible,
  Accordion,
  createAccordion,
  Details,
  ExpandableText,
  type CollapsibleOptions,
  type CollapsibleState,
  type CollapsibleProps,
  type AccordionSection,
  type AccordionOptions,
  type AccordionState,
  type AccordionProps,
  type DetailsProps,
  type ExpandableTextProps,
} from './collapsible.js';

// Scroll Area
export {
  ScrollArea,
  createScrollArea,
  VirtualList,
  createVirtualList,
  ScrollableText,
  LogViewer,
  type ScrollAreaOptions,
  type ScrollAreaState,
  type ScrollAreaProps,
  type VirtualListItem,
  type VirtualListOptions,
  type VirtualListState,
  type VirtualListProps,
  type ScrollableTextProps,
  type LogViewerOptions,
} from './scroll-area.js';

// Grid
export {
  Grid,
  GridCell,
  SimpleGrid,
  AutoGrid,
  MasonryGrid,
  TemplateGrid,
  ResponsiveGrid,
  type GridTrackSize,
  type GridOptions,
  type GridCellOptions,
  type GridProps,
  type GridCellProps,
  type SimpleGridOptions,
  type AutoGridOptions,
  type MasonryGridOptions,
  type GridAreaDefinition,
  type TemplateGridOptions,
  type ResponsiveBreakpoint,
  type ResponsiveGridOptions,
} from './grid.js';
