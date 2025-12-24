/**
 * File Manager Widget
 *
 * A comprehensive file system navigation component for TUI applications.
 *
 * Components:
 * - DirectoryTree: Hierarchical tree view of directories
 * - FileList: List of files with sorting/filtering
 * - PathBreadcrumbs: Clickable path navigation
 * - FileBrowser: Combined file browser component
 * - FileDetails: File metadata display
 * - FilePreview: Preview file contents
 *
 * @example
 * const browser = FileBrowser({
 *   path: '/home/user',
 *   onSelect: (item) => console.log('Selected:', item.name),
 *   onOpen: (item) => console.log('Opened:', item.path),
 * });
 */

import { Box, Text, Each, Spacer, When } from '../primitives/nodes.js';
import { VStack, HStack } from '../templates/stack.js';
import type { VNode, BoxStyleProps, TextStyleProps } from '../utils/types.js';
import { createSignal, createEffect, type Signal } from '../primitives/signal.js';

// =============================================================================
// Types
// =============================================================================

/**
 * File system item type
 */
export type FileItemType = 'file' | 'directory' | 'symlink' | 'device' | 'socket' | 'fifo' | 'unknown';

/**
 * File system item
 */
export interface FileItem {
  name: string;
  path: string;
  type: FileItemType;
  size?: number;
  modified?: Date;
  created?: Date;
  accessed?: Date;
  permissions?: string;
  owner?: string;
  group?: string;
  isHidden?: boolean;
  isReadOnly?: boolean;
  isExecutable?: boolean;
  extension?: string;
  mimeType?: string;
  linkTarget?: string;
  children?: FileItem[];
  isExpanded?: boolean;
  depth?: number;
}

/**
 * Sort field for file lists
 */
export type FileSortField = 'name' | 'size' | 'modified' | 'type' | 'extension';

/**
 * Sort direction
 */
export type SortDirection = 'asc' | 'desc';

/**
 * File filter function
 */
export type FileFilter = (item: FileItem) => boolean;

/**
 * File sorter
 */
export interface FileSorter {
  field: FileSortField;
  direction: SortDirection;
}

/**
 * Directory tree options
 */
export interface DirectoryTreeOptions {
  /** Root path or items */
  items: FileItem[];
  /** Currently selected item path */
  selected?: string;
  /** Expanded directories */
  expanded?: Set<string>;
  /** Callback when item is selected */
  onSelect?: (item: FileItem) => void;
  /** Callback when directory is expanded/collapsed */
  onToggle?: (item: FileItem, expanded: boolean) => void;
  /** Callback when item is opened (double-click or enter) */
  onOpen?: (item: FileItem) => void;
  /** Show hidden files */
  showHidden?: boolean;
  /** Custom icons for file types */
  icons?: Partial<FileIcons>;
  /** Indent size in spaces */
  indentSize?: number;
  /** Tree lines style */
  lineStyle?: 'none' | 'ascii' | 'unicode';
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Max depth to display */
  maxDepth?: number;
  /** Style for selected item */
  selectedStyle?: TextStyleProps;
  /** Style for directories */
  directoryStyle?: TextStyleProps;
  /** Style for files */
  fileStyle?: TextStyleProps;
}

/**
 * File list options
 */
export interface FileListOptions {
  /** Files to display */
  items: FileItem[];
  /** Currently selected item path */
  selected?: string;
  /** Multiple selection */
  selectedItems?: Set<string>;
  /** Enable multi-select */
  multiSelect?: boolean;
  /** Callback when item is selected */
  onSelect?: (item: FileItem) => void;
  /** Callback when item is opened */
  onOpen?: (item: FileItem) => void;
  /** Callback when selection changes (multi-select) */
  onSelectionChange?: (items: FileItem[]) => void;
  /** Show hidden files */
  showHidden?: boolean;
  /** Sorting */
  sort?: FileSorter;
  /** Filter function */
  filter?: FileFilter;
  /** View mode */
  viewMode?: 'list' | 'details' | 'compact';
  /** Custom icons */
  icons?: Partial<FileIcons>;
  /** Columns for details view */
  columns?: FileListColumn[];
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Selected item style */
  selectedStyle?: TextStyleProps;
  /** Directory style */
  directoryStyle?: TextStyleProps;
  /** File style */
  fileStyle?: TextStyleProps;
  /** Show file size */
  showSize?: boolean;
  /** Show modification time */
  showModified?: boolean;
  /** Show permissions */
  showPermissions?: boolean;
}

/**
 * File list column definition
 */
export interface FileListColumn {
  field: 'name' | 'size' | 'modified' | 'permissions' | 'type' | 'owner';
  label: string;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
}

/**
 * Path breadcrumbs options
 */
export interface PathBreadcrumbsOptions {
  /** Current path */
  path: string;
  /** Path separator */
  separator?: string;
  /** Callback when segment is clicked */
  onNavigate?: (path: string) => void;
  /** Max segments to show (truncate from left) */
  maxSegments?: number;
  /** Home path (for ~ substitution) */
  homePath?: string;
  /** Show home as ~ */
  showHomeAs?: string;
  /** Style for separator */
  separatorStyle?: TextStyleProps;
  /** Style for path segments */
  segmentStyle?: TextStyleProps;
  /** Style for current segment */
  currentStyle?: TextStyleProps;
  /** Container width */
  width?: number | string;
  /** Custom icons (unused in breadcrumbs but accepted for API consistency) */
  icons?: Partial<FileIcons>;
}

/**
 * File browser options (combined view)
 */
export interface FileBrowserOptions {
  /** Initial path */
  path: string;
  /** Items at current path */
  items: FileItem[];
  /** Callback when path changes */
  onPathChange?: (path: string) => void;
  /** Callback when item is selected */
  onSelect?: (item: FileItem) => void;
  /** Callback when item is opened */
  onOpen?: (item: FileItem) => void;
  /** Show hidden files */
  showHidden?: boolean;
  /** Sorting */
  sort?: FileSorter;
  /** Filter */
  filter?: FileFilter;
  /** View mode */
  viewMode?: 'list' | 'details' | 'tree';
  /** Show breadcrumbs */
  showBreadcrumbs?: boolean;
  /** Show toolbar */
  showToolbar?: boolean;
  /** Show status bar */
  showStatusBar?: boolean;
  /** Show preview panel */
  showPreview?: boolean;
  /** Preview panel width */
  previewWidth?: number | string;
  /** Custom icons */
  icons?: Partial<FileIcons>;
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Split view (tree + list) */
  splitView?: boolean;
  /** Tree panel width for split view */
  treeWidth?: number | string;
}

/**
 * File details options
 */
export interface FileDetailsOptions {
  /** File item to display */
  item: FileItem;
  /** Show permissions */
  showPermissions?: boolean;
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Show owner/group */
  showOwner?: boolean;
  /** Show MIME type */
  showMimeType?: boolean;
  /** Custom icons */
  icons?: Partial<FileIcons>;
  /** Container width */
  width?: number | string;
  /** Label style */
  labelStyle?: TextStyleProps;
  /** Value style */
  valueStyle?: TextStyleProps;
}

/**
 * File preview options
 */
export interface FilePreviewOptions {
  /** File item to preview */
  item: FileItem;
  /** File content (for text files) */
  content?: string;
  /** Max lines to show */
  maxLines?: number;
  /** Enable syntax highlighting */
  syntaxHighlight?: boolean;
  /** Show line numbers */
  lineNumbers?: boolean;
  /** Container width */
  width?: number | string;
  /** Container height */
  height?: number | string;
  /** Placeholder for non-previewable files */
  placeholder?: string;
  /** Binary file message */
  binaryMessage?: string;
  /** Large file message */
  largeFileMessage?: string;
  /** Max file size for preview (bytes) */
  maxPreviewSize?: number;
}

/**
 * File icons mapping
 */
export interface FileIcons {
  // Types
  file: string;
  directory: string;
  directoryOpen: string;
  symlink: string;
  device: string;
  socket: string;
  fifo: string;
  unknown: string;

  // Common extensions
  js: string;
  ts: string;
  jsx: string;
  tsx: string;
  json: string;
  md: string;
  txt: string;
  html: string;
  css: string;
  scss: string;
  py: string;
  rb: string;
  go: string;
  rs: string;
  java: string;
  c: string;
  cpp: string;
  h: string;
  sh: string;
  yml: string;
  yaml: string;
  toml: string;
  xml: string;
  svg: string;
  png: string;
  jpg: string;
  gif: string;
  mp3: string;
  mp4: string;
  pdf: string;
  zip: string;
  tar: string;
  gz: string;
  exe: string;
  bin: string;
  lock: string;
  env: string;
  git: string;
  gitignore: string;
  docker: string;
  dockerfile: string;

  // Tree lines
  treeVertical: string;
  treeBranch: string;
  treeCorner: string;
  treeSpace: string;
}

// =============================================================================
// Default Icons
// =============================================================================

/**
 * Unicode icons (default)
 */
export const unicodeIcons: FileIcons = {
  // Types
  file: '📄',
  directory: '📁',
  directoryOpen: '📂',
  symlink: '🔗',
  device: '💾',
  socket: '🔌',
  fifo: '📤',
  unknown: '❓',

  // Extensions
  js: '🟨',
  ts: '🔷',
  jsx: '⚛️',
  tsx: '⚛️',
  json: '📋',
  md: '📝',
  txt: '📃',
  html: '🌐',
  css: '🎨',
  scss: '🎨',
  py: '🐍',
  rb: '💎',
  go: '🐹',
  rs: '🦀',
  java: '☕',
  c: '🔵',
  cpp: '🔵',
  h: '📑',
  sh: '⚡',
  yml: '⚙️',
  yaml: '⚙️',
  toml: '⚙️',
  xml: '📰',
  svg: '🖼️',
  png: '🖼️',
  jpg: '🖼️',
  gif: '🎞️',
  mp3: '🎵',
  mp4: '🎬',
  pdf: '📕',
  zip: '📦',
  tar: '📦',
  gz: '📦',
  exe: '⚙️',
  bin: '⚙️',
  lock: '🔒',
  env: '🔐',
  git: '🔀',
  gitignore: '🙈',
  docker: '🐳',
  dockerfile: '🐳',

  // Tree lines
  treeVertical: '│',
  treeBranch: '├',
  treeCorner: '└',
  treeSpace: ' ',
};

/**
 * ASCII icons (fallback)
 */
export const asciiIcons: FileIcons = {
  // Types
  file: '[F]',
  directory: '[D]',
  directoryOpen: '[D]',
  symlink: '[L]',
  device: '[V]',
  socket: '[S]',
  fifo: '[P]',
  unknown: '[?]',

  // Extensions (simplified)
  js: '[JS]',
  ts: '[TS]',
  jsx: '[JX]',
  tsx: '[TX]',
  json: '[{}]',
  md: '[MD]',
  txt: '[T]',
  html: '[H]',
  css: '[C]',
  scss: '[S]',
  py: '[PY]',
  rb: '[RB]',
  go: '[GO]',
  rs: '[RS]',
  java: '[JV]',
  c: '[C]',
  cpp: '[C+]',
  h: '[H]',
  sh: '[SH]',
  yml: '[YM]',
  yaml: '[YM]',
  toml: '[TM]',
  xml: '[XM]',
  svg: '[SV]',
  png: '[IM]',
  jpg: '[IM]',
  gif: '[IM]',
  mp3: '[AU]',
  mp4: '[VD]',
  pdf: '[PD]',
  zip: '[ZP]',
  tar: '[TR]',
  gz: '[GZ]',
  exe: '[EX]',
  bin: '[BN]',
  lock: '[LK]',
  env: '[EV]',
  git: '[GT]',
  gitignore: '[GI]',
  docker: '[DK]',
  dockerfile: '[DK]',

  // Tree lines
  treeVertical: '|',
  treeBranch: '+',
  treeCorner: '`',
  treeSpace: ' ',
};

/**
 * Nerd font icons
 */
export const nerdIcons: FileIcons = {
  // Types
  file: '',
  directory: '',
  directoryOpen: '',
  symlink: '',
  device: '',
  socket: '',
  fifo: '',
  unknown: '',

  // Extensions
  js: '',
  ts: '',
  jsx: '',
  tsx: '',
  json: '',
  md: '',
  txt: '',
  html: '',
  css: '',
  scss: '',
  py: '',
  rb: '',
  go: '',
  rs: '',
  java: '',
  c: '',
  cpp: '',
  h: '',
  sh: '',
  yml: '',
  yaml: '',
  toml: '',
  xml: '',
  svg: '',
  png: '',
  jpg: '',
  gif: '',
  mp3: '',
  mp4: '',
  pdf: '',
  zip: '',
  tar: '',
  gz: '',
  exe: '',
  bin: '',
  lock: '',
  env: '',
  git: '',
  gitignore: '',
  docker: '',
  dockerfile: '',

  // Tree lines
  treeVertical: '│',
  treeBranch: '├',
  treeCorner: '└',
  treeSpace: ' ',
};

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Get icon for a file item
 */
export function getFileIcon(item: FileItem, icons: FileIcons = unicodeIcons): string {
  if (item.type === 'directory') {
    return item.isExpanded ? icons.directoryOpen : icons.directory;
  }

  if (item.type === 'symlink') {
    return icons.symlink;
  }

  if (item.type !== 'file') {
    return icons[item.type] || icons.unknown;
  }

  // Check extension
  const ext = item.extension?.toLowerCase() || getExtension(item.name);
  const iconKey = ext as keyof FileIcons;

  if (iconKey && icons[iconKey]) {
    return icons[iconKey];
  }

  return icons.file;
}

/**
 * Get extension from filename
 */
export function getExtension(filename: string): string {
  // Handle dotfiles like .gitignore (no prefix, just the extension)
  if (filename.startsWith('.') && filename.indexOf('.', 1) === -1) {
    return filename.slice(1).toLowerCase();
  }
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1 || lastDot === 0) {
    return '';
  }
  return filename.slice(lastDot + 1).toLowerCase();
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) {
    return '';
  }

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

/**
 * Format date
 */
export function formatDate(date: Date | undefined): string {
  if (!date) {
    return '';
  }

  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const day = 24 * 60 * 60 * 1000;

  if (diff < day) {
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  if (diff < 7 * day) {
    return date.toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }

  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

/**
 * Sort file items
 */
export function sortFileItems(items: FileItem[], sorter: FileSorter): FileItem[] {
  const sorted = [...items];

  sorted.sort((a, b) => {
    // Directories first
    if (a.type === 'directory' && b.type !== 'directory') {
      return -1;
    }
    if (a.type !== 'directory' && b.type === 'directory') {
      return 1;
    }

    let result = 0;

    switch (sorter.field) {
      case 'name':
        result = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
        break;
      case 'size':
        result = (a.size || 0) - (b.size || 0);
        break;
      case 'modified':
        result = (a.modified?.getTime() || 0) - (b.modified?.getTime() || 0);
        break;
      case 'type':
        result = a.type.localeCompare(b.type);
        break;
      case 'extension':
        result = (a.extension || '').localeCompare(b.extension || '');
        break;
    }

    return sorter.direction === 'desc' ? -result : result;
  });

  return sorted;
}

/**
 * Filter file items
 */
export function filterFileItems(
  items: FileItem[],
  options: { showHidden?: boolean; filter?: FileFilter }
): FileItem[] {
  return items.filter(item => {
    if (!options.showHidden && item.isHidden) {
      return false;
    }
    if (options.filter && !options.filter(item)) {
      return false;
    }
    return true;
  });
}

/**
 * Parse path into segments
 */
export function parsePath(path: string, separator = '/'): string[] {
  return path.split(separator).filter(Boolean);
}

/**
 * Build path from segments
 */
export function buildPath(segments: string[], separator = '/'): string {
  const path = segments.join(separator);
  return path.startsWith(separator) ? path : separator + path;
}

/**
 * Get parent path
 */
export function getParentPath(path: string, separator = '/'): string {
  const segments = parsePath(path, separator);
  if (segments.length <= 1) {
    return separator;
  }
  return buildPath(segments.slice(0, -1), separator);
}

// =============================================================================
// Components
// =============================================================================

/**
 * Directory Tree Component
 *
 * Displays a hierarchical tree view of directories.
 *
 * @example
 * DirectoryTree({
 *   items: directoryData,
 *   selected: '/home/user/documents',
 *   onSelect: (item) => setSelected(item.path),
 *   onToggle: (item, expanded) => toggleExpand(item.path),
 * })
 */
export function DirectoryTree(options: DirectoryTreeOptions): VNode {
  const {
    items,
    selected,
    expanded = new Set(),
    onSelect,
    onToggle,
    onOpen,
    showHidden = false,
    icons = unicodeIcons,
    indentSize = 2,
    lineStyle = 'unicode',
    width = '100%',
    height = 'auto',
    maxDepth = Infinity,
    selectedStyle = { backgroundColor: 'info', color: 'foreground' },
    directoryStyle = { color: 'primary', bold: true },
    fileStyle = { color: 'foreground' },
  } = options;

  const treeIcons = {
    vertical: lineStyle === 'none' ? '' : lineStyle === 'ascii' ? '|' : icons.treeVertical,
    branch: lineStyle === 'none' ? '' : lineStyle === 'ascii' ? '+' : icons.treeBranch,
    corner: lineStyle === 'none' ? '' : lineStyle === 'ascii' ? '`' : icons.treeCorner,
    space: ' ',
  };

  // Flatten tree for rendering
  function flattenTree(
    treeItems: FileItem[],
    depth = 0,
    prefix = '',
    isLast = true
  ): Array<{ item: FileItem; prefix: string; isLast: boolean }> {
    if (depth > maxDepth) {
      return [];
    }

    const result: Array<{ item: FileItem; prefix: string; isLast: boolean }> = [];
    const filtered = filterFileItems(treeItems, { showHidden });

    filtered.forEach((item, index) => {
      const isLastItem = index === filtered.length - 1;
      result.push({ item, prefix, isLast: isLastItem });

      if (item.type === 'directory' && expanded.has(item.path) && item.children) {
        const childPrefix = prefix + (isLastItem ? '  ' : treeIcons.vertical + ' ');
        const childFlat = flattenTree(item.children, depth + 1, childPrefix, isLastItem);
        result.push(...childFlat);
      }
    });

    return result;
  }

  const flatItems = flattenTree(items);

  const treeNodes = flatItems.map(({ item, prefix, isLast }) => {
    const isSelected = item.path === selected;
    const isDir = item.type === 'directory';
    const isOpen = expanded.has(item.path);
    const icon = getFileIcon({ ...item, isExpanded: isOpen }, { ...unicodeIcons, ...icons });

    const lineChar = isLast ? treeIcons.corner : treeIcons.branch;
    const treeLine = prefix + lineChar + '─ ';

    return Box(
      {
        width: '100%',
        onClick: () => {
          onSelect?.(item);
          if (isDir) {
            onToggle?.(item, !isOpen);
          }
        },
        onDoubleClick: () => {
          onOpen?.(item);
        },
        ...(isSelected ? selectedStyle : {}),
      },
      Text(
        { color: 'mutedForeground' },
        treeLine
      ),
      Text({}, icon + ' '),
      Text(isDir ? directoryStyle : fileStyle, item.name)
    );
  });

  return Box(
    { flexDirection: 'column', width, height },
    ...treeNodes
  );
}

/**
 * File List Component
 *
 * Displays a list of files with optional details view.
 *
 * @example
 * FileList({
 *   items: files,
 *   selected: '/home/user/file.txt',
 *   viewMode: 'details',
 *   sort: { field: 'name', direction: 'asc' },
 * })
 */
export function FileList(options: FileListOptions): VNode {
  const {
    items,
    selected,
    selectedItems,
    multiSelect = false,
    onSelect,
    onOpen,
    onSelectionChange,
    showHidden = false,
    sort = { field: 'name', direction: 'asc' },
    filter,
    viewMode = 'list',
    icons = unicodeIcons,
    columns,
    width = '100%',
    height = 'auto',
    selectedStyle = { backgroundColor: 'info', color: 'foreground' },
    directoryStyle = { color: 'primary', bold: true },
    fileStyle = { color: 'foreground' },
    showSize = true,
    showModified = true,
    showPermissions = false,
  } = options;

  // Process items
  let processedItems = filterFileItems(items, { showHidden, filter });
  processedItems = sortFileItems(processedItems, sort);

  // Default columns for details view
  const defaultColumns: FileListColumn[] = [
    { field: 'name', label: 'Name', width: 40 },
    ...(showSize ? [{ field: 'size' as const, label: 'Size', width: 10, align: 'right' as const }] : []),
    ...(showModified ? [{ field: 'modified' as const, label: 'Modified', width: 15 }] : []),
    ...(showPermissions ? [{ field: 'permissions' as const, label: 'Perm', width: 10 }] : []),
  ];

  const activeColumns = columns || defaultColumns;

  // Render item based on view mode
  function renderItem(item: FileItem): VNode {
    const isSelected = multiSelect
      ? selectedItems?.has(item.path)
      : item.path === selected;
    const isDir = item.type === 'directory';
    const icon = getFileIcon(item, { ...unicodeIcons, ...icons });

    if (viewMode === 'compact') {
      return Box(
        {
          paddingRight: 2,
          onClick: () => onSelect?.(item),
          onDoubleClick: () => onOpen?.(item),
          ...(isSelected ? selectedStyle : {}),
        },
        Text({}, icon + ' '),
        Text(isDir ? directoryStyle : fileStyle, item.name)
      );
    }

    if (viewMode === 'details') {
      return Box(
        {
          width: '100%',
          onClick: () => onSelect?.(item),
          onDoubleClick: () => onOpen?.(item),
          ...(isSelected ? selectedStyle : {}),
        },
        ...activeColumns.map(col => {
          let content = '';
          switch (col.field) {
            case 'name':
              content = icon + ' ' + item.name;
              break;
            case 'size':
              content = isDir ? '<DIR>' : formatFileSize(item.size);
              break;
            case 'modified':
              content = formatDate(item.modified);
              break;
            case 'permissions':
              content = item.permissions || '';
              break;
            case 'type':
              content = item.type;
              break;
            case 'owner':
              content = item.owner || '';
              break;
          }

          const style: TextStyleProps = col.field === 'name'
            ? (isDir ? directoryStyle : fileStyle)
            : { color: 'mutedForeground' };

          return Box(
            { width: col.width, flexShrink: 0 },
            Text(style, content)
          );
        })
      );
    }

    // Default list view
    return Box(
      {
        width: '100%',
        onClick: () => onSelect?.(item),
        onDoubleClick: () => onOpen?.(item),
        ...(isSelected ? selectedStyle : {}),
      },
      Text({}, icon + ' '),
      Text(isDir ? directoryStyle : fileStyle, item.name),
      Spacer(),
      When(showSize && !isDir, Text({ color: 'mutedForeground' }, formatFileSize(item.size)))
    );
  }

  // Header for details view
  const headerRow = viewMode === 'details'
    ? Box(
        { width: '100%', borderStyle: 'none', borderBottom: true },
        ...activeColumns.map(col =>
          Box(
            { width: col.width, flexShrink: 0 },
            Text({ bold: true, color: 'warning' }, col.label)
          )
        )
      )
    : null;

  const rowsContainer = viewMode === 'compact'
    ? Box({ flexDirection: 'row', flexWrap: 'wrap', width },
        ...processedItems.map(renderItem)
      )
    : VStack({ width, children: processedItems.map(renderItem) });

  return Box(
    { flexDirection: 'column', width, height },
    headerRow,
    rowsContainer
  );
}

/**
 * Path Breadcrumbs Component
 *
 * Shows clickable path segments for navigation.
 *
 * @example
 * PathBreadcrumbs({
 *   path: '/home/user/documents',
 *   onNavigate: (path) => setCurrentPath(path),
 * })
 */
export function PathBreadcrumbs(options: PathBreadcrumbsOptions): VNode {
  const {
    path,
    separator = '/',
    onNavigate,
    maxSegments = 5,
    homePath,
    showHomeAs = '~',
    separatorStyle = { color: 'mutedForeground' },
    segmentStyle = { color: 'primary' },
    currentStyle = { color: 'foreground', bold: true },
    width = '100%',
  } = options;

  const segments = parsePath(path, separator);
  let displaySegments = segments;
  let truncated = false;

  // Truncate from left if too many segments
  if (segments.length > maxSegments) {
    displaySegments = segments.slice(-maxSegments);
    truncated = true;
  }

  // Build path for each segment
  const pathItems = displaySegments.map((segment, index) => {
    const segmentPath = buildPath(segments.slice(0, segments.length - displaySegments.length + index + 1), separator);
    const isCurrent = index === displaySegments.length - 1;

    // Check for home path substitution
    let displayName = segment;
    if (homePath && segmentPath === homePath && showHomeAs) {
      displayName = showHomeAs;
    }

    return Box(
      {},
      When(index > 0 || truncated, Text(separatorStyle, ` ${separator} `)),
      Text(
        {
          ...(isCurrent ? currentStyle : segmentStyle),
          onClick: () => onNavigate?.(segmentPath),
        },
        displayName
      )
    );
  });

  return HStack({
    width: typeof width === 'string' ? undefined : width,
    children: [
      // Root
      Text(
        {
          ...segmentStyle,
          onClick: () => onNavigate?.(separator),
        },
        separator
      ),
      // Truncation indicator
      When(truncated, Text(separatorStyle, ' ... ')),
      ...pathItems
    ].filter((n): n is VNode => n !== null)
  });
}

/**
 * File Details Component
 *
 * Shows detailed information about a file.
 *
 * @example
 * FileDetails({
 *   item: selectedFile,
 *   showPermissions: true,
 *   showTimestamps: true,
 * })
 */
export function FileDetails(options: FileDetailsOptions): VNode {
  const {
    item,
    showPermissions = true,
    showTimestamps = true,
    showOwner = true,
    showMimeType = true,
    icons = unicodeIcons,
    width = '100%',
    labelStyle = { color: 'mutedForeground' },
    valueStyle = { color: 'foreground' },
  } = options;

  const icon = getFileIcon(item, { ...unicodeIcons, ...icons });

  const rows: Array<[string, string]> = [
    ['Name', item.name],
    ['Type', item.type],
    ['Path', item.path],
  ];

  if (item.type === 'file' && item.size !== undefined) {
    rows.push(['Size', formatFileSize(item.size)]);
  }

  if (item.type === 'symlink' && item.linkTarget) {
    rows.push(['Target', item.linkTarget]);
  }

  if (showPermissions && item.permissions) {
    rows.push(['Permissions', item.permissions]);
  }

  if (showOwner) {
    if (item.owner) {
      rows.push(['Owner', item.owner]);
    }
    if (item.group) {
      rows.push(['Group', item.group]);
    }
  }

  if (showTimestamps) {
    if (item.modified) {
      rows.push(['Modified', item.modified.toLocaleString()]);
    }
    if (item.created) {
      rows.push(['Created', item.created.toLocaleString()]);
    }
    if (item.accessed) {
      rows.push(['Accessed', item.accessed.toLocaleString()]);
    }
  }

  if (showMimeType && item.mimeType) {
    rows.push(['MIME Type', item.mimeType]);
  }

  return Box(
    { flexDirection: 'column', width },
    // Icon and name header
    Box(
      { marginBottom: 1 },
      Text({}, icon),
      Text({}, ' '),
      Text({ bold: true }, item.name)
    ),
    // Details rows
    ...rows.map(([label, value]) =>
      HStack({
        children: [
          Box(
            { width: 12, flexShrink: 0 },
            Text(labelStyle, label + ':')
          ),
          Text(valueStyle, value)
        ]
      })
    )
  );
}

/**
 * File Preview Component
 *
 * Shows a preview of file contents.
 *
 * @example
 * FilePreview({
 *   item: selectedFile,
 *   content: fileContent,
 *   maxLines: 50,
 *   syntaxHighlight: true,
 * })
 */
export function FilePreview(options: FilePreviewOptions): VNode {
  const {
    item,
    content,
    maxLines = 100,
    syntaxHighlight = false,
    lineNumbers = true,
    width = '100%',
    height = 'auto',
    placeholder = 'No preview available',
    binaryMessage = 'Binary file - preview not available',
    largeFileMessage = 'File too large for preview',
    maxPreviewSize = 1024 * 1024, // 1MB
  } = options;

  // Check if file is previewable
  const ext = item.extension || getExtension(item.name);
  const textExtensions = ['txt', 'md', 'js', 'ts', 'jsx', 'tsx', 'json', 'html', 'css', 'scss', 'py', 'rb', 'go', 'rs', 'java', 'c', 'cpp', 'h', 'sh', 'yml', 'yaml', 'toml', 'xml'];
  const isTextFile = textExtensions.includes(ext);

  // Check size
  if (item.size && item.size > maxPreviewSize) {
    return Box(
      { width, height, padding: 2, borderStyle: 'single' },
      Text({ color: 'warning' }, largeFileMessage)
    );
  }

  // Check if binary
  if (!isTextFile && !content) {
    return Box(
      { width, height, padding: 2, borderStyle: 'single' },
      Text({ color: 'mutedForeground' }, binaryMessage)
    );
  }

  // No content
  if (!content) {
    return Box(
      { width, height, padding: 2, borderStyle: 'single' },
      Text({ color: 'mutedForeground' }, placeholder)
    );
  }

  // Split and limit lines
  const lines = content.split('\n').slice(0, maxLines);
  const lineNumberWidth = String(lines.length).length;

  const lineNodes = lines.map((line, index) => {
    const lineNum = String(index + 1).padStart(lineNumberWidth, ' ');

    return HStack({
      children: [
        When(lineNumbers,
          Box(
            { width: lineNumberWidth + 2, flexShrink: 0 },
            Text({ color: 'mutedForeground' }, lineNum + ' │')
          )
        ),
        Text({}, line)
      ].filter((n): n is VNode => n !== null)
    });
  });

  return Box(
    { flexDirection: 'column', width, height, overflow: 'hidden' },
    ...lineNodes
  );
}

/**
 * File Browser Component
 *
 * Combined file browser with tree, list, breadcrumbs, and preview.
 *
 * @example
 * FileBrowser({
 *   path: '/home/user',
 *   items: currentItems,
 *   onPathChange: (path) => loadDirectory(path),
 *   onOpen: (item) => openFile(item),
 *   splitView: true,
 * })
 */
export function FileBrowser(options: FileBrowserOptions): VNode {
  const {
    path,
    items,
    onPathChange,
    onSelect,
    onOpen,
    showHidden = false,
    sort = { field: 'name', direction: 'asc' },
    filter,
    viewMode = 'list',
    showBreadcrumbs = true,
    showToolbar = false,
    showStatusBar = true,
    showPreview = false,
    previewWidth = '40%',
    icons = unicodeIcons,
    width = '100%',
    height = '100%',
    splitView = false,
    treeWidth = '30%',
  } = options;

  // Count items
  const visibleItems = filterFileItems(items, { showHidden, filter });
  const dirCount = visibleItems.filter(i => i.type === 'directory').length;
  const fileCount = visibleItems.length - dirCount;

  // Status bar text
  const statusText = `${dirCount} directories, ${fileCount} files`;

  // Breadcrumbs
  const breadcrumbs = showBreadcrumbs
    ? PathBreadcrumbs({
        path,
        onNavigate: (newPath) => onPathChange?.(newPath),
        icons,
      })
    : null;

  // Status bar
  const statusBar = showStatusBar
    ? Box(
        { width: '100%', borderStyle: 'none', borderTop: true, paddingTop: 1 },
        Text({ color: 'mutedForeground' }, statusText)
      )
    : null;

  // Main content
  let mainContent: VNode;

  if (viewMode === 'tree') {
    // Build tree structure
    const treeItems: FileItem[] = items.map(item => ({
      ...item,
      children: item.type === 'directory' ? item.children || [] : undefined,
    }));

    mainContent = DirectoryTree({
      items: treeItems,
      onSelect,
      onOpen,
      showHidden,
      icons,
      width: '100%',
      height: 'auto',
    });
  } else if (splitView) {
    // Split view with tree on left
    const treeItems = items.filter(i => i.type === 'directory');

    mainContent = HStack({
      children: [
        Box(
          { width: treeWidth, borderStyle: 'single', padding: 1 },
          DirectoryTree({
            items: treeItems,
            onSelect,
            onOpen,
            showHidden,
            icons,
          })
        ),
        Box(
          { flexGrow: 1, borderStyle: 'single', padding: 1 },
          FileList({
            items,
            onSelect,
            onOpen,
            showHidden,
            sort,
            filter,
            viewMode: 'list',
            icons,
          })
        )
      ]
    });
  } else {
    mainContent = FileList({
      items,
      onSelect,
      onOpen,
      showHidden,
      sort,
      filter,
      viewMode: viewMode === 'details' ? 'details' : 'list',
      icons,
      width: showPreview ? `calc(100% - ${previewWidth})` : '100%',
    });
  }

  // With preview panel
  if (showPreview) {
    mainContent = HStack({
      children: [
        mainContent,
        Box(
          { width: previewWidth, borderStyle: 'single', padding: 1 },
          Text({ color: 'mutedForeground' }, 'Preview')
        )
      ]
    });
  }

  return VStack({
    width: typeof width === 'string' ? undefined : width,
    height: typeof height === 'string' ? undefined : height,
    children: [
      breadcrumbs,
      Box({ flexGrow: 1 }, mainContent),
      statusBar
    ].filter(Boolean) as VNode[]
  });
}

// =============================================================================
// Helper Components
// =============================================================================

/**
 * File Icon Component
 *
 * Displays just the icon for a file type.
 */
export function FileIcon(options: {
  item: FileItem;
  icons?: Partial<FileIcons>;
  style?: TextStyleProps;
}): VNode {
  const { item, icons = unicodeIcons, style = {} } = options;
  const icon = getFileIcon(item, icons as FileIcons);
  return Text(style, icon);
}

/**
 * Directory Indicator
 *
 * Shows expand/collapse indicator for directories.
 */
export function DirectoryIndicator(options: {
  isExpanded: boolean;
  style?: 'arrow' | 'plus' | 'triangle';
}): VNode {
  const { isExpanded, style = 'triangle' } = options;

  const indicators = {
    arrow: isExpanded ? '▼' : '►',
    plus: isExpanded ? '−' : '+',
    triangle: isExpanded ? '▾' : '▸',
  };

  return Text({ color: 'mutedForeground' }, indicators[style]);
}
