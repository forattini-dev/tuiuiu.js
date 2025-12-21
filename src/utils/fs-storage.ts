/**
 * NodeFsStorage - A storage adapter for Node.js file system persistence.
 *
 * Implements the `StorageAdapter` interface for `createPersistMiddleware`
 * using Node.js `fs` module for saving/loading state from files.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface NodeFsStorageOptions {
  /** Base directory for storing files (e.g., './data') */
  dir?: string;
  /** File extension (e.g., '.json') */
  ext?: string;
}

/**
 * Creates a Node.js file system storage adapter.
 *
 * @param options - Configuration options for the storage.
 * @returns An object implementing the `StorageAdapter` interface.
 */
export function createNodeFsStorage(options: NodeFsStorageOptions = {}) {
  const { dir = './.tuiuiu-data', ext = '.json' } = options;

  // Ensure the directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const getItem = async (key: string): Promise<string | null> => {
    const filePath = path.join(dir, `${key}${ext}`);
    if (fs.existsSync(filePath)) {
      return fs.promises.readFile(filePath, 'utf-8');
    }
    return null;
  };

  const setItem = async (key: string, value: string): Promise<void> => {
    const filePath = path.join(dir, `${key}${ext}`);
    await fs.promises.writeFile(filePath, value, 'utf-8');
  };

  return { getItem, setItem };
}
