/**
 * NodeFsStorage - A storage adapter for Node.js file system persistence.
 *
 * Implements the `StorageAdapter` interface for `createPersistMiddleware`
 * using Node.js `fs` module for saving/loading state from files.
 */

import * as fs from 'fs';
import * as path from 'path';

const SAFE_KEY_RE = /^[A-Za-z0-9._-]+$/;

export interface NodeFsStorageOptions {
  /** Base directory for storing files (e.g., './data') */
  dir?: string;
  /** File extension (e.g., '.json') */
  ext?: string;
}

function ensureStorageDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function assertSafeStorageKey(key: string): void {
  if (!SAFE_KEY_RE.test(key) || key.includes('..')) {
    throw new Error(
      `[tuiuiu] Invalid storage key "${key}". Keys must match ${SAFE_KEY_RE.source} and not include "..".`
    );
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

  ensureStorageDir(dir);

  const getItem = async (key: string): Promise<string | null> => {
    assertSafeStorageKey(key);
    const filePath = path.join(dir, `${key}${ext}`);
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath, 'utf-8');
    }
    return null;
  };

  const setItem = async (key: string, value: string): Promise<void> => {
    assertSafeStorageKey(key);
    const filePath = path.join(dir, `${key}${ext}`);
    await fs.promises.writeFile(filePath, value, 'utf-8');
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

  ensureStorageDir(dir);

  const getItem = (key: string): string | null => {
    assertSafeStorageKey(key);
    const filePath = path.join(dir, `${key}${ext}`);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
  };

  const setItem = (key: string, value: string): void => {
    assertSafeStorageKey(key);
    const filePath = path.join(dir, `${key}${ext}`);
    fs.writeFileSync(filePath, value, 'utf-8');
  };

  return { getItem, setItem };
}
