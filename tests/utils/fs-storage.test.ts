/**
 * fs-storage Tests
 *
 * Tests for NodeFsStorage adapter
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { createNodeFsStorage } from '../../src/utils/fs-storage.js';

const TEST_DIR = './.tuiuiu-test-data';

describe('createNodeFsStorage', () => {
  beforeEach(() => {
    // Clean up test directory before each test
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up after tests
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('Initialization', () => {
    it('should create storage with default options', () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      expect(storage).toBeDefined();
      expect(storage.getItem).toBeInstanceOf(Function);
      expect(storage.setItem).toBeInstanceOf(Function);
    });

    it('should create directory if it does not exist', () => {
      createNodeFsStorage({ dir: TEST_DIR });

      expect(fs.existsSync(TEST_DIR)).toBe(true);
    });
  });

  describe('setItem', () => {
    it('should save value to file', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      await storage.setItem('test-key', '{"value": 42}');

      const filePath = path.join(TEST_DIR, 'test-key.json');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should use custom extension', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR, ext: '.txt' });

      await storage.setItem('data', 'hello');

      const filePath = path.join(TEST_DIR, 'data.txt');
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  describe('getItem', () => {
    it('should retrieve saved value', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      await storage.setItem('my-key', '{"count": 10}');
      const value = await storage.getItem('my-key');

      expect(value).toBe('{"count": 10}');
    });

    it('should return null for non-existent key', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      const value = await storage.getItem('non-existent');

      expect(value).toBeNull();
    });
  });

  describe('Integration', () => {
    it('should work with JSON data', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      const data = { name: 'Test', values: [1, 2, 3] };
      await storage.setItem('json-data', JSON.stringify(data));

      const retrieved = await storage.getItem('json-data');
      expect(JSON.parse(retrieved!)).toEqual(data);
    });

    it('should handle multiple keys', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      await storage.setItem('key1', 'value1');
      await storage.setItem('key2', 'value2');
      await storage.setItem('key3', 'value3');

      expect(await storage.getItem('key1')).toBe('value1');
      expect(await storage.getItem('key2')).toBe('value2');
      expect(await storage.getItem('key3')).toBe('value3');
    });

    it('should overwrite existing values', async () => {
      const storage = createNodeFsStorage({ dir: TEST_DIR });

      await storage.setItem('overwrite', 'first');
      await storage.setItem('overwrite', 'second');

      expect(await storage.getItem('overwrite')).toBe('second');
    });
  });
});
