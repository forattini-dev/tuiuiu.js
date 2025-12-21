/**
 * Design System - Complete UI component library
 *
 * This module exports all design system components organized by category.
 */

// =============================================================================
// Core - Rendering engine
// =============================================================================

export {
  calculateLayout,
  getVisibleWidth,
  measureText,
  clearTextMeasureCache,
  renderToString,
  OutputBuffer,
} from './core/index.js';

// =============================================================================
// Primitives - Basic building blocks
// =============================================================================

export {
  normalizeChildren,
  Box,
  Text,
  Spacer,
  Newline,
  Fragment,
  Divider,
  Slot,
  When,
  Each,
  Transform,
  Static,
} from './primitives/index.js';

export type {
  DividerProps,
  SlotProps,
  TransformProps,
  StaticProps,
} from './primitives/index.js';

// =============================================================================
// Forms - User input components
// =============================================================================

export {
  createTextInput,
  renderTextInput,
  createSelect,
  renderSelect,
  Select,
  Confirm,
  Checkbox,
} from './forms/index.js';

export type {
  TextInputState,
  TextInputOptions,
  TextInputProps,
  SelectItem,
  SelectOptions,
} from './forms/index.js';

// =============================================================================
// Feedback - User feedback components
// =============================================================================

export {
  createSpinner,
  renderSpinner,
  Spinner,
  createProgressBar,
  renderProgressBar,
  ProgressBar,
  MultiProgressBar,
  Badge,
} from './feedback/index.js';

export type {
  SpinnerStyle,
  SpinnerOptions,
  ProgressBarStyle,
  ProgressBarOptions,
  BadgeProps,
} from './feedback/index.js';

// =============================================================================
// Data Display - Data presentation components
// =============================================================================

export {
  Table,
  SimpleTable,
  KeyValueTable,
  CodeBlock,
  InlineCode,
  Markdown,
  renderMarkdown,
} from './data-display/index.js';

export type {
  TableBorderStyle,
  TextAlign,
  TableColumn,
  TableOptions,
  Language,
  CodeTheme,
  CodeBlockOptions,
  MarkdownOptions,
} from './data-display/index.js';

// =============================================================================
// Overlays - Layered UI components
// =============================================================================

export {
  Modal,
  ConfirmDialog,
  Toast,
  AlertBox,
  createModal,
  createConfirmDialog,
} from './overlays/index.js';

export type {
  ModalProps,
  ModalState,
  ModalSize,
  ModalPosition,
  ConfirmDialogProps,
  ToastProps,
  ToastType,
  AlertBoxProps,
  BorderStyle,
} from './overlays/index.js';

// =============================================================================
// Layout - Layout utility components
// =============================================================================

export {
  // Split Panel
  SplitPanel,
  ThreePanel,
  createSplitPanel,
  // Tabs
  Tabs,
  createTabs,
  TabPanel,
  VerticalTabs,
  LazyTabs,
  // Collapsible
  Collapsible,
  createCollapsible,
  Accordion,
  createAccordion,
  Details,
  ExpandableText,
  // ScrollArea
  ScrollArea,
  createScrollArea,
  VirtualList,
  createVirtualList,
  ScrollableText,
  LogViewer,
  // Grid
  Grid,
  GridCell,
  SimpleGrid,
  AutoGrid,
  MasonryGrid,
  TemplateGrid,
  ResponsiveGrid,
} from './layout/index.js';

export type {
  // Split Panel
  SplitPanelProps,
  SplitPanelState,
  ThreePanelProps,
  DividerStyle,
  // Tabs
  Tab,
  TabsOptions,
  TabsState,
  TabsProps,
  TabPanelProps,
  VerticalTabsOptions,
  LazyTabsProps,
  // Collapsible
  CollapsibleOptions,
  CollapsibleState,
  CollapsibleProps,
  AccordionSection,
  AccordionOptions,
  AccordionState,
  AccordionProps,
  DetailsProps,
  ExpandableTextProps,
  // ScrollArea
  ScrollAreaOptions,
  ScrollAreaState,
  ScrollAreaProps,
  VirtualListItem,
  VirtualListOptions,
  VirtualListState,
  VirtualListProps,
  ScrollableTextProps,
  LogViewerOptions,
  // Grid
  GridTrackSize,
  GridOptions,
  GridCellOptions,
  GridProps,
  GridCellProps,
  SimpleGridOptions,
  AutoGridOptions,
  MasonryGridOptions,
  GridAreaDefinition,
  TemplateGridOptions,
  ResponsiveBreakpoint,
  ResponsiveGridOptions,
} from './layout/index.js';

// =============================================================================
// Media - ASCII art, images, and pixel graphics
// =============================================================================

export {
  // Picture components
  Picture,
  FramedPicture,
  ColoredPicture,

  // Pixel grid utilities
  createPixelGrid,
  createPixelGridFromColors,
  renderPixelGrid,

  // Sprite/animation utilities
  createSprite,
  getSpriteFrame,
  nextSpriteFrame,

  // Effects
  createGradientBar,
  rainbowText,
  createShadowedText,

  // Pre-made patterns
  AsciiPatterns,
  createBanner,
} from './media/index.js';

export type {
  Pixel,
  PixelGrid,
  ColorPalette,
  PictureProps,
  FramedPictureProps,
  ColoredPictureProps,
  PictureFit,
  PictureAlignX,
  PictureAlignY,
  Sprite,
  GradientStop,
} from './media/index.js';

// =============================================================================
// Visual - Decorative and display components
// =============================================================================

export {
  // BigText
  BigText,
  FigletText,
  BigTitle,
  Logo,
  // Digits
  Digits,
  Clock,
  Counter,
  Countdown,
  Stopwatch,
  DigitRoll,
  Score,
  // Tooltip
  Tooltip,
  WithTooltip,
  HelpTooltip,
  InfoBox,
  Popover,
  Tag,
} from './visual/index.js';

export type {
  // BigText
  BigTextFont,
  BigTextOptions,
  FigletTextOptions,
  BigTitleOptions,
  LogoOptions,
  // Digits
  DigitsStyle,
  DigitsOptions,
  ClockOptions,
  CounterOptions,
  CountdownOptions,
  StopwatchOptions,
  DigitRollOptions,
  ScoreOptions,
  // Tooltip
  TooltipPosition,
  TooltipOptions,
  WithTooltipOptions,
  HelpTooltipOptions,
  InfoBoxType,
  InfoBoxOptions,
  PopoverOptions,
  TagOptions,
} from './visual/index.js';

// =============================================================================
// Navigation - File browser and navigation components
// =============================================================================

export {
  // Components
  DirectoryTree,
  FileList,
  PathBreadcrumbs,
  FileBrowser,
  FileDetails,
  FilePreview,
  FileIcon,
  DirectoryIndicator,
  // Icon sets
  unicodeIcons,
  asciiIcons,
  nerdIcons,
  // Utilities
  getFileIcon,
  getExtension,
  formatFileSize,
  formatDate,
  sortFileItems,
  filterFileItems,
  parsePath,
  buildPath,
  getParentPath,
} from './navigation/index.js';

export type {
  FileItemType,
  FileItem,
  FileSortField,
  SortDirection,
  FileFilter,
  FileSorter,
  DirectoryTreeOptions,
  FileListOptions,
  FileListColumn,
  PathBreadcrumbsOptions,
  FileBrowserOptions,
  FileDetailsOptions,
  FilePreviewOptions,
  FileIcons,
} from './navigation/index.js';
