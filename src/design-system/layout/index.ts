/**
 * Design System Layout - Layout utility components
 *
 * Re-exports from canonical sources (molecules/organisms)
 * plus unique layout utilities (stack, app).
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

// =============================================================================
// Unique to Design System (no duplicates)
// =============================================================================

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

// =============================================================================
// Re-exports from Molecules
// =============================================================================

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
} from '../../molecules/tabs.js';

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
} from '../../molecules/collapsible.js';

// =============================================================================
// Re-exports from Organisms
// =============================================================================

// Split Panel
export {
  SplitPanel,
  ThreePanel,
  createSplitPanel,
  type SplitPanelProps,
  type SplitPanelState,
  type ThreePanelProps,
  type DividerStyle,
} from '../../organisms/split-panel.js';

// ScrollList - Primary scroll component for lists
export {
  ScrollList,
  ChatList,
  useScrollList,
  createScrollList,
  clearScrollListCache,
  invalidateScrollListItem,
  type ScrollListProps,
  type ScrollListState,
  type ChatListProps,
  type UseScrollListOptions,
  type UseScrollListReturn,
} from '../../organisms/scroll-list.js';

// Scroll Area (Legacy - prefer ScrollList)
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
} from '../../organisms/scroll-area.js';

// Grid (unique to design-system - different from organisms/grid)
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
