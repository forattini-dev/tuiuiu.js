/**
 * File Manager Tests
 *
 * Tests for file browser and navigation components.
 */

import { describe, it, expect } from 'vitest';
import {
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
  type FileItem,
} from '../../src/design-system/navigation/file-manager.js';

// =============================================================================
// Test Data
// =============================================================================

function createTestFileItem(overrides: Partial<FileItem> = {}): FileItem {
  return {
    name: 'test.txt',
    path: '/home/user/test.txt',
    type: 'file',
    size: 1024,
    modified: new Date('2024-01-15'),
    ...overrides,
  };
}

function createTestDirectory(overrides: Partial<FileItem> = {}): FileItem {
  return {
    name: 'documents',
    path: '/home/user/documents',
    type: 'directory',
    modified: new Date('2024-01-15'),
    ...overrides,
  };
}

function createTestFileList(): FileItem[] {
  return [
    createTestDirectory({ name: 'documents', path: '/documents' }),
    createTestDirectory({ name: 'pictures', path: '/pictures' }),
    createTestFileItem({ name: 'readme.md', path: '/readme.md', size: 512 }),
    createTestFileItem({ name: 'app.ts', path: '/app.ts', size: 2048, extension: 'ts' }),
    createTestFileItem({ name: 'config.json', path: '/config.json', size: 256, extension: 'json' }),
    createTestFileItem({ name: '.hidden', path: '/.hidden', isHidden: true }),
  ];
}

// =============================================================================
// Utility Function Tests
// =============================================================================

describe('File Manager Utilities', () => {
  describe('getExtension', () => {
    it('should extract extension from filename', () => {
      expect(getExtension('test.txt')).toBe('txt');
      expect(getExtension('app.config.ts')).toBe('ts');
      expect(getExtension('README.MD')).toBe('md');
    });

    it('should return empty string for no extension', () => {
      expect(getExtension('Makefile')).toBe('');
    });

    it('should return extension for dotfiles', () => {
      expect(getExtension('.gitignore')).toBe('gitignore');
      expect(getExtension('.env')).toBe('env');
      expect(getExtension('.dockerignore')).toBe('dockerignore');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
      expect(formatFileSize(1024)).toBe('1.0 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1048576)).toBe('1.0 MB');
      expect(formatFileSize(1073741824)).toBe('1.0 GB');
    });

    it('should return empty string for undefined', () => {
      expect(formatFileSize(undefined)).toBe('');
    });
  });

  describe('formatDate', () => {
    it('should format dates', () => {
      const date = new Date('2024-01-15T10:30:00');
      const result = formatDate(date);
      expect(result).toBeTruthy();
    });

    it('should return empty string for undefined', () => {
      expect(formatDate(undefined)).toBe('');
    });
  });

  describe('parsePath', () => {
    it('should parse Unix paths', () => {
      expect(parsePath('/home/user/documents')).toEqual(['home', 'user', 'documents']);
      expect(parsePath('/single')).toEqual(['single']);
      expect(parsePath('/')).toEqual([]);
    });

    it('should handle custom separators', () => {
      expect(parsePath('C:\\Users\\Name', '\\')).toEqual(['C:', 'Users', 'Name']);
    });
  });

  describe('buildPath', () => {
    it('should build paths from segments', () => {
      expect(buildPath(['home', 'user', 'documents'])).toBe('/home/user/documents');
      expect(buildPath(['single'])).toBe('/single');
      expect(buildPath([])).toBe('/');
    });
  });

  describe('getParentPath', () => {
    it('should get parent path', () => {
      expect(getParentPath('/home/user/documents')).toBe('/home/user');
      expect(getParentPath('/home')).toBe('/');
      expect(getParentPath('/')).toBe('/');
    });
  });

  describe('sortFileItems', () => {
    it('should sort by name ascending', () => {
      const items = createTestFileList();
      const sorted = sortFileItems(items, { field: 'name', direction: 'asc' });

      // Directories should come first
      expect(sorted[0]!.type).toBe('directory');
      expect(sorted[1]!.type).toBe('directory');

      // Then files sorted by name
      expect(sorted[2]!.name).toBe('.hidden');
      expect(sorted[3]!.name).toBe('app.ts');
    });

    it('should sort by name descending', () => {
      const items = createTestFileList();
      const sorted = sortFileItems(items, { field: 'name', direction: 'desc' });

      // Directories still first (reverse order)
      expect(sorted[0]!.type).toBe('directory');
      expect(sorted[0]!.name).toBe('pictures');
    });

    it('should sort by size', () => {
      const items = createTestFileList();
      const sorted = sortFileItems(items, { field: 'size', direction: 'desc' });

      // Largest file first (among files)
      const files = sorted.filter(i => i.type === 'file');
      expect(files[0]!.name).toBe('app.ts');
    });
  });

  describe('filterFileItems', () => {
    it('should hide hidden files by default', () => {
      const items = createTestFileList();
      const filtered = filterFileItems(items, { showHidden: false });

      expect(filtered.some(i => i.isHidden)).toBe(false);
      expect(filtered.length).toBe(5);
    });

    it('should show hidden files when enabled', () => {
      const items = createTestFileList();
      const filtered = filterFileItems(items, { showHidden: true });

      expect(filtered.some(i => i.isHidden)).toBe(true);
      expect(filtered.length).toBe(6);
    });

    it('should apply custom filter', () => {
      const items = createTestFileList();
      const filtered = filterFileItems(items, {
        showHidden: true,
        filter: (item) => item.type === 'directory',
      });

      expect(filtered.every(i => i.type === 'directory')).toBe(true);
      expect(filtered.length).toBe(2);
    });
  });
});

// =============================================================================
// Icon Tests
// =============================================================================

describe('File Icons', () => {
  describe('getFileIcon', () => {
    it('should return directory icon', () => {
      const item = createTestDirectory();
      expect(getFileIcon(item)).toBe(unicodeIcons.directory);
    });

    it('should return open directory icon', () => {
      const item = createTestDirectory({ isExpanded: true });
      expect(getFileIcon(item)).toBe(unicodeIcons.directoryOpen);
    });

    it('should return file icon for txt extension', () => {
      const item = createTestFileItem({ extension: 'txt' });
      expect(getFileIcon(item)).toBe(unicodeIcons.txt);
    });

    it('should return default file icon', () => {
      const item = createTestFileItem({ name: 'unknown', extension: 'xyz' });
      expect(getFileIcon(item)).toBe(unicodeIcons.file);
    });

    it('should return extension-specific icon', () => {
      const jsFile = createTestFileItem({ name: 'app.js', extension: 'js' });
      expect(getFileIcon(jsFile)).toBe(unicodeIcons.js);

      const tsFile = createTestFileItem({ name: 'app.ts', extension: 'ts' });
      expect(getFileIcon(tsFile)).toBe(unicodeIcons.ts);

      const pyFile = createTestFileItem({ name: 'app.py', extension: 'py' });
      expect(getFileIcon(pyFile)).toBe(unicodeIcons.py);
    });

    it('should return symlink icon', () => {
      const item = createTestFileItem({ type: 'symlink' });
      expect(getFileIcon(item)).toBe(unicodeIcons.symlink);
    });

    it('should use ASCII icons when specified', () => {
      const item = createTestDirectory();
      expect(getFileIcon(item, asciiIcons)).toBe(asciiIcons.directory);
    });

    it('should use Nerd font icons when specified', () => {
      const item = createTestDirectory();
      expect(getFileIcon(item, nerdIcons)).toBe(nerdIcons.directory);
    });
  });

  describe('Icon sets', () => {
    it('unicodeIcons should have all required icons', () => {
      expect(unicodeIcons.file).toBeDefined();
      expect(unicodeIcons.directory).toBeDefined();
      expect(unicodeIcons.symlink).toBeDefined();
      expect(unicodeIcons.js).toBeDefined();
      expect(unicodeIcons.ts).toBeDefined();
    });

    it('asciiIcons should have all required icons', () => {
      expect(asciiIcons.file).toBeDefined();
      expect(asciiIcons.directory).toBeDefined();
      expect(asciiIcons.symlink).toBeDefined();
      expect(asciiIcons.js).toBeDefined();
    });

    it('nerdIcons should have all required icons', () => {
      expect(nerdIcons.file).toBeDefined();
      expect(nerdIcons.directory).toBeDefined();
      expect(nerdIcons.symlink).toBeDefined();
    });
  });
});

// =============================================================================
// Component Tests
// =============================================================================

describe('File Manager Components', () => {
  describe('DirectoryTree', () => {
    it('should return a VNode', () => {
      const items = [createTestDirectory({ children: [] })];
      const node = DirectoryTree({ items });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept showHidden option', () => {
      const items = [
        createTestDirectory({ children: [] }),
        createTestDirectory({ name: '.hidden', isHidden: true, children: [] }),
      ];
      const node = DirectoryTree({ items, showHidden: true });

      expect(node).toBeDefined();
    });

    it('should accept lineStyle option', () => {
      const items = [createTestDirectory({ children: [] })];

      const unicode = DirectoryTree({ items, lineStyle: 'unicode' });
      const ascii = DirectoryTree({ items, lineStyle: 'ascii' });
      const none = DirectoryTree({ items, lineStyle: 'none' });

      expect(unicode).toBeDefined();
      expect(ascii).toBeDefined();
      expect(none).toBeDefined();
    });
  });

  describe('FileList', () => {
    it('should return a VNode', () => {
      const items = createTestFileList();
      const node = FileList({ items });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept viewMode option', () => {
      const items = createTestFileList();

      const list = FileList({ items, viewMode: 'list' });
      const details = FileList({ items, viewMode: 'details' });
      const compact = FileList({ items, viewMode: 'compact' });

      expect(list).toBeDefined();
      expect(details).toBeDefined();
      expect(compact).toBeDefined();
    });

    it('should accept sort option', () => {
      const items = createTestFileList();
      const node = FileList({
        items,
        sort: { field: 'size', direction: 'desc' },
      });

      expect(node).toBeDefined();
    });

    it('should accept multiSelect option', () => {
      const items = createTestFileList();
      const node = FileList({
        items,
        multiSelect: true,
        selectedItems: new Set(['/app.ts', '/config.json']),
      });

      expect(node).toBeDefined();
    });
  });

  describe('PathBreadcrumbs', () => {
    it('should return a VNode', () => {
      const node = PathBreadcrumbs({ path: '/home/user/documents' });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept maxSegments option', () => {
      const node = PathBreadcrumbs({
        path: '/very/deep/nested/path/structure',
        maxSegments: 3,
      });

      expect(node).toBeDefined();
    });

    it('should accept homePath option', () => {
      const node = PathBreadcrumbs({
        path: '/home/user/documents',
        homePath: '/home/user',
        showHomeAs: '~',
      });

      expect(node).toBeDefined();
    });
  });

  describe('FileBrowser', () => {
    it('should return a VNode', () => {
      const items = createTestFileList();
      const node = FileBrowser({
        path: '/home/user',
        items,
      });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should accept viewMode option', () => {
      const items = createTestFileList();

      const list = FileBrowser({ path: '/', items, viewMode: 'list' });
      const details = FileBrowser({ path: '/', items, viewMode: 'details' });
      const tree = FileBrowser({ path: '/', items, viewMode: 'tree' });

      expect(list).toBeDefined();
      expect(details).toBeDefined();
      expect(tree).toBeDefined();
    });

    it('should accept splitView option', () => {
      const items = createTestFileList();
      const node = FileBrowser({
        path: '/',
        items,
        splitView: true,
        treeWidth: '30%',
      });

      expect(node).toBeDefined();
    });

    it('should accept showPreview option', () => {
      const items = createTestFileList();
      const node = FileBrowser({
        path: '/',
        items,
        showPreview: true,
        previewWidth: '40%',
      });

      expect(node).toBeDefined();
    });

    it('should show/hide components based on options', () => {
      const items = createTestFileList();

      const withAll = FileBrowser({
        path: '/',
        items,
        showBreadcrumbs: true,
        showStatusBar: true,
        showToolbar: true,
      });

      const minimal = FileBrowser({
        path: '/',
        items,
        showBreadcrumbs: false,
        showStatusBar: false,
        showToolbar: false,
      });

      expect(withAll).toBeDefined();
      expect(minimal).toBeDefined();
    });
  });

  describe('FileDetails', () => {
    it('should return a VNode', () => {
      const item = createTestFileItem();
      const node = FileDetails({ item });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should show file information', () => {
      const item = createTestFileItem({
        name: 'document.txt',
        path: '/home/user/document.txt',
        size: 2048,
        permissions: '-rw-r--r--',
        owner: 'user',
        group: 'users',
        modified: new Date('2024-01-15'),
      });

      const node = FileDetails({
        item,
        showPermissions: true,
        showTimestamps: true,
        showOwner: true,
      });

      expect(node).toBeDefined();
    });

    it('should handle symlinks', () => {
      const item = createTestFileItem({
        type: 'symlink',
        linkTarget: '/actual/target',
      });

      const node = FileDetails({ item });
      expect(node).toBeDefined();
    });
  });

  describe('FilePreview', () => {
    it('should return a VNode', () => {
      const item = createTestFileItem({ name: 'test.txt' });
      const node = FilePreview({
        item,
        content: 'Hello, World!',
      });

      expect(node).toBeDefined();
      expect(node.type).toBe('box');
    });

    it('should show preview for text files', () => {
      const item = createTestFileItem({ name: 'readme.md' });
      const content = '# README\n\nThis is a test file.';

      const node = FilePreview({
        item,
        content,
        maxLines: 10,
      });

      expect(node).toBeDefined();
    });

    it('should show placeholder for binary files', () => {
      const item = createTestFileItem({ name: 'image.png', extension: 'png' });
      const node = FilePreview({ item });

      expect(node).toBeDefined();
    });

    it('should show message for large files', () => {
      const item = createTestFileItem({
        name: 'large.txt',
        size: 10 * 1024 * 1024, // 10MB
      });

      const node = FilePreview({
        item,
        maxPreviewSize: 1024 * 1024, // 1MB limit
      });

      expect(node).toBeDefined();
    });

    it('should accept lineNumbers option', () => {
      const item = createTestFileItem({ name: 'code.ts' });
      const content = 'const x = 1;\nconst y = 2;';

      const withNumbers = FilePreview({ item, content, lineNumbers: true });
      const withoutNumbers = FilePreview({ item, content, lineNumbers: false });

      expect(withNumbers).toBeDefined();
      expect(withoutNumbers).toBeDefined();
    });
  });

  describe('FileIcon', () => {
    it('should return a VNode', () => {
      const item = createTestFileItem();
      const node = FileIcon({ item });

      expect(node).toBeDefined();
      expect(node.type).toBe('text');
    });

    it('should accept icons option', () => {
      const item = createTestDirectory();

      const unicode = FileIcon({ item, icons: unicodeIcons });
      const ascii = FileIcon({ item, icons: asciiIcons });

      expect(unicode).toBeDefined();
      expect(ascii).toBeDefined();
    });
  });

  describe('DirectoryIndicator', () => {
    it('should return a VNode', () => {
      const expanded = DirectoryIndicator({ isExpanded: true });
      const collapsed = DirectoryIndicator({ isExpanded: false });

      expect(expanded).toBeDefined();
      expect(collapsed).toBeDefined();
      expect(expanded.type).toBe('text');
    });

    it('should accept style option', () => {
      const arrow = DirectoryIndicator({ isExpanded: true, style: 'arrow' });
      const plus = DirectoryIndicator({ isExpanded: true, style: 'plus' });
      const triangle = DirectoryIndicator({ isExpanded: true, style: 'triangle' });

      expect(arrow).toBeDefined();
      expect(plus).toBeDefined();
      expect(triangle).toBeDefined();
    });
  });
});
