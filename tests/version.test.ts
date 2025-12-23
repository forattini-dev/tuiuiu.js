/**
 * Version Tests
 *
 * Tests for version information utilities
 */

import { describe, it, expect } from 'vitest';
import {
  getVersion,
  getVersionSync,
  getVersionInfo,
  formatVersionInfo,
} from '../src/version.js';

describe('getVersion', () => {
  it('should return a version string', async () => {
    const version = await getVersion();

    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
    expect(version.length).toBeGreaterThan(0);
  });

  it('should return consistent version on multiple calls', async () => {
    const version1 = await getVersion();
    const version2 = await getVersion();

    expect(version1).toBe(version2);
  });
});

describe('getVersionSync', () => {
  it('should return a version string', () => {
    const version = getVersionSync();

    expect(version).toBeDefined();
    expect(typeof version).toBe('string');
  });

  it('should not be undefined', () => {
    const version = getVersionSync();

    expect(version).not.toBe(undefined);
    expect(version).not.toBe(null);
  });
});

describe('getVersionInfo', () => {
  it('should return version info object', async () => {
    const info = await getVersionInfo();

    expect(info).toBeDefined();
    expect(info.version).toBeDefined();
    expect(info.name).toBe('tuiuiu.js');
    expect(info.nodeVersion).toBeDefined();
    expect(info.platform).toBeDefined();
    expect(info.arch).toBeDefined();
  });

  it('should include node version', async () => {
    const info = await getVersionInfo();

    expect(info.nodeVersion).toMatch(/^v?\d+\.\d+/);
  });

  it('should include platform info', async () => {
    const info = await getVersionInfo();

    expect(['linux', 'darwin', 'win32']).toContain(info.platform);
  });

  it('should include architecture', async () => {
    const info = await getVersionInfo();

    expect(['x64', 'arm64', 'ia32', 'arm']).toContain(info.arch);
  });
});

describe('formatVersionInfo', () => {
  it('should return simple version by default', async () => {
    const formatted = await formatVersionInfo();

    expect(formatted).toBeDefined();
    expect(typeof formatted).toBe('string');
  });

  it('should return verbose info when verbose=true', async () => {
    const formatted = await formatVersionInfo(true);

    expect(formatted).toContain('tuiuiu/');
    expect(formatted).toContain('node/');
  });

  it('should match version from getVersion', async () => {
    const version = await getVersion();
    const formatted = await formatVersionInfo();

    expect(formatted).toBe(version);
  });
});
