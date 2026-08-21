/**
 * NodeFsStorage - Node.js file-system persistence for application stores.
 *
 * Implements the `StorageAdapter` interface for `createPersistMiddleware`
 * using Node.js `fs` module for saving/loading state from files.
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'node:crypto';

const SAFE_KEY_RE = /^[A-Za-z0-9._-]+$/;
const SAFE_EXTENSION_RE = /^(?:\.[A-Za-z0-9_-]+)?$/;
const WINDOWS_DEVICE_RE = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

export interface NodeFsStorageOptions {
  /** Base directory for storing files (e.g., './data') */
  dir?: string;
  /** File extension (e.g., '.json') */
  ext?: string;
}

function ensureStorageDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }
  const stats = fs.lstatSync(dir);
  if (stats.isSymbolicLink() || !stats.isDirectory()) {
    throw new Error(`[tuiuiu] Storage root must be a real directory: "${dir}".`);
  }
}

function assertSafeStorageKey(key: string): void {
  if (
    !SAFE_KEY_RE.test(key) ||
    key === '.' ||
    key.includes('..') ||
    WINDOWS_DEVICE_RE.test(key)
  ) {
    throw new Error(
      `[tuiuiu] Invalid storage key "${key}". Keys must match ${SAFE_KEY_RE.source} and not include "..".`
    );
  }
}

function assertSafeExtension(ext: string): void {
  if (!SAFE_EXTENSION_RE.test(ext)) {
    throw new Error(
      `[tuiuiu] Invalid storage extension "${ext}". Extensions must match ${SAFE_EXTENSION_RE.source}.`
    );
  }
}

function resolveStoragePath(root: string, key: string, ext: string): string {
  assertSafeStorageKey(key);
  const target = path.resolve(root, `${key}${ext}`);
  const relative = path.relative(root, target);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`[tuiuiu] Storage path escaped its configured directory.`);
  }
  return target;
}

function assertNotSymlink(filePath: string): void {
  try {
    if (fs.lstatSync(filePath).isSymbolicLink()) {
      throw new Error(`[tuiuiu] Refusing to access storage symlink "${filePath}".`);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
}

/**
 * Creates a Node.js file system storage adapter.
 *
 * @param options - Configuration options for the storage.
 * @returns An object implementing the `StorageAdapter` interface.
 */
export function createNodeFsStorage(options: NodeFsStorageOptions = {}) {
  const { dir = './.tuiuiu-data', ext = '.json' } = options;
  assertSafeExtension(ext);
  const root = path.resolve(dir);

  ensureStorageDir(root);

  const getItem = async (key: string): Promise<string | null> => {
    const filePath = resolveStoragePath(root, key, ext);
    assertNotSymlink(filePath);
    try {
      return await fs.promises.readFile(filePath, {
        encoding: 'utf8',
        flag: fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  };

  const setItem = async (key: string, value: string): Promise<void> => {
    const filePath = resolveStoragePath(root, key, ext);
    assertNotSymlink(filePath);
    const tempPath = path.join(root, `.${key}.${randomUUID()}.tmp`);
    let handle: fs.promises.FileHandle | null = null;
    try {
      handle = await fs.promises.open(tempPath, 'wx', 0o600);
      await handle.writeFile(value, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      await fs.promises.rename(tempPath, filePath);
    } finally {
      await handle?.close().catch(() => {});
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  };

  return { getItem, setItem };
}

/**
 * Creates a synchronous Node.js file system storage adapter.
 *
 * Use this with `createPersistedStore()` when you want deterministic
 * boot-time hydration in Node environments.
 */
export function createNodeFsSyncStorage(options: NodeFsStorageOptions = {}) {
  const { dir = './.tuiuiu-data', ext = '.json' } = options;
  assertSafeExtension(ext);
  const root = path.resolve(dir);

  ensureStorageDir(root);

  const getItem = (key: string): string | null => {
    const filePath = resolveStoragePath(root, key, ext);
    assertNotSymlink(filePath);
    try {
      const fd = fs.openSync(
        filePath,
        fs.constants.O_RDONLY | (fs.constants.O_NOFOLLOW ?? 0),
      );
      try {
        return fs.readFileSync(fd, 'utf8');
      } finally {
        fs.closeSync(fd);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  };

  const setItem = (key: string, value: string): void => {
    const filePath = resolveStoragePath(root, key, ext);
    assertNotSymlink(filePath);
    const tempPath = path.join(root, `.${key}.${randomUUID()}.tmp`);
    let fd: number | null = null;
    try {
      fd = fs.openSync(tempPath, 'wx', 0o600);
      fs.writeFileSync(fd, value, 'utf8');
      fs.fsyncSync(fd);
      fs.closeSync(fd);
      fd = null;
      fs.renameSync(tempPath, filePath);
    } finally {
      if (fd !== null) {
        try { fs.closeSync(fd); } catch { /* already closed */ }
      }
      try { fs.unlinkSync(tempPath); } catch { /* renamed or never created */ }
    }
  };

  return { getItem, setItem };
}
