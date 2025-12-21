/**
 * Design System Navigation - File browser and navigation components
 *
 * FileManager:
 * - DirectoryTree: Hierarchical tree view
 * - FileList: List/details view of files
 * - PathBreadcrumbs: Path navigation
 * - FileBrowser: Combined file browser
 * - FileDetails: File information
 * - FilePreview: File content preview
 */

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
  // Types
  type FileItemType,
  type FileItem,
  type FileSortField,
  type SortDirection,
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
} from './file-manager.js';
