/**
 * Organisms - Complex, self-contained UI units
 *
 * Organisms are sophisticated components that combine atoms and molecules
 * into complete, functional UI sections. They manage their own state and
 * represent major interface elements.
 *
 * @example
 * ```typescript
 * import {
 *   Modal, ConfirmDialog, Toast,
 *   CommandPalette, createCommandPalette,
 *   DataTable, createDataTable,
 *   FileBrowser, DirectoryTree,
 *   ScrollArea, VirtualList,
 *   SplitPanel, ThreePanel,
 *   Grid, MasonryGrid,
 *   createOverlayStack, OverlayContainer,
 * } from './organisms/index.js';
 * ```
 */

// =============================================================================
// Modal & Dialogs
// =============================================================================

export {
  // Components
  Modal,
  ConfirmDialog,
  Toast,
  AlertBox,
  // State factory
  createModal,
  createConfirmDialog,
  // Types
  type BorderStyle,
  type ModalSize,
  type ModalPosition,
  type ModalProps,
  type ConfirmDialogProps,
  type ToastType,
  type ToastProps,
  type AlertBoxProps,
  type ModalState,
} from './modal.js';

// =============================================================================
// Command Palette
// =============================================================================

export {
  // Components
  CommandPalette,
  GoToDialog,
  // State factories
  createCommandPalette,
  createGoToDialog,
  // Types
  type CommandItem,
  type CommandPaletteProps,
  type CommandPaletteState,
  type CreateCommandPaletteOptions,
  type GoToDialogProps,
} from './command-palette.js';

// =============================================================================
// Overlay Stack
// =============================================================================

export {
  // State factory
  createOverlayStack,
  // Components
  OverlayContainer,
  // Utility functions
  shouldBlockInput,
  handleOverlayEscape,
  // Overlay factories
  createModalOverlay,
  createToastOverlay,
  createCriticalOverlay,
  // Types
  type OverlayPriority,
  type OverlayConfig,
  type OverlayEntry,
  type OverlayStackState,
  type OverlayContainerProps,
  type UseOverlayInputOptions,
} from './overlay-stack.js';

// =============================================================================
// Split Panel
// =============================================================================

export {
  // Components
  SplitPanel,
  ThreePanel,
  // State factory
  createSplitPanel,
  // Types
  type DividerStyle,
  type SplitPanelProps,
  type SplitPanelState,
  type ThreePanelProps,
} from './split-panel.js';

// =============================================================================
// Scroll Area & Virtual List
// =============================================================================

export {
  // Components
  ScrollArea,
  VirtualList,
  ScrollableText,
  LogViewer,
  // State factories
  createScrollArea,
  createVirtualList,
  // Types
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

// =============================================================================
// ScrollList - Simplified scroll list API
// =============================================================================

export {
  // Components
  ScrollList,
  ChatList,
  // Hook
  useScrollList,
  // State factory
  createScrollList,
  // Utilities
  clearScrollListCache,
  invalidateScrollListItem,
  // Types
  type ScrollListProps,
  type ScrollListState,
  type ChatListProps,
  type UseScrollListOptions,
  type UseScrollListReturn,
} from './scroll-list.js';

// =============================================================================
// Grid Layout
// =============================================================================

export {
  // Components
  Grid,
  GridItem,
  GridRow,
  GridColumn,
  AutoGrid,
  DashboardGrid,
  MasonryGrid,
  // Utilities
  parseTrackSize,
  parseTrackDefinition,
  parseGridAreas,
  calculateTrackSizes,
  calculateCellPosition,
  calculateGridLayout,
  repeat,
  minmax,
  gridAreasToTemplate,
  // Types
  type TrackSize,
  type ParsedTrack,
  type GridArea,
  type JustifyItems,
  type AlignItems,
  type JustifyContent,
  type AlignContent,
  type GridOptions,
  type GridItemOptions,
  type CellPosition,
  type GridLayout,
} from './grid.js';

// =============================================================================
// Data Table
// =============================================================================

export {
  // Components
  DataTable,
  VirtualDataTable,
  EditableDataTable,
  // State factory
  createDataTable,
  // Types
  type SortDirection,
  type DataTableColumn,
  type DataTableOptions,
  type DataTableState,
  type DataTableProps,
  type VirtualDataTableOptions,
  type EditableColumn,
  type EditableDataTableOptions,
} from './data-table.js';

// =============================================================================
// File Browser
// =============================================================================

export {
  // Components
  FileBrowser,
  DirectoryTree,
  FileList,
  PathBreadcrumbs,
  FileDetails,
  FilePreview,
  FileIcon,
  DirectoryIndicator,
  // Icon sets
  unicodeIcons,
  asciiIcons,
  nerdIcons,
  // Utility functions
  getFileIcon,
  getExtension,
  formatFileSize,
  formatDate,
  sortFileItems,
  filterFileItems,
  parsePath,
  buildPath,
  getParentPath,
  // Types
  type FileItemType,
  type FileItem,
  type FileSortField,
  type SortDirection as FileSortDirection,
  type FileFilter,
  type FileSorter,
  type DirectoryTreeOptions,
  type FileListOptions,
  type FileListColumn,
  type PathBreadcrumbsOptions,
  type FileBrowserOptions,
  type FileDetailsOptions,
  type FilePreviewOptions,
  type FileIcons,
} from './file-browser.js';
