import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  readdirSync: vi.fn(),
}));

import * as fs from 'node:fs';
import {
  formatBytes,
  formatUptime,
  getCpuUsage,
  getMemoryInfo,
  getProcessList,
  getStateDescription,
  getSystemInfo,
  resetSystemDataSampling,
} from '../../examples/_shared/system-data.js';

const readFileSync = vi.mocked(fs.readFileSync);
const readdirSync = vi.mocked(fs.readdirSync);

function useFiles(files: Record<string, string>): void {
  readFileSync.mockImplementation((file) => {
    const normalizedPath = String(file).replaceAll('\\', '/');
    const value = files[normalizedPath];
    if (value === undefined) {
      throw new Error(`ENOENT: ${normalizedPath}`);
    }
    return value;
  });
}

describe('system data', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetSystemDataSampling();
  });

  it('calculates aggregate and per-core CPU deltas', () => {
    useFiles({
      '/proc/stat': [
        'cpu 100 0 50 850 0 0 0 0',
        'cpu0 50 0 25 425 0 0 0 0',
        'cpu1 50 0 25 425 0 0 0 0',
      ].join('\n'),
    });
    expect(getCpuUsage()).toEqual({ total: 0, cores: [0, 0] });

    useFiles({
      '/proc/stat': [
        'cpu 120 0 60 920 0 0 0 0',
        'cpu0 60 0 30 460 0 0 0 0',
        'cpu1 60 0 30 460 0 0 0 0',
      ].join('\n'),
    });
    expect(getCpuUsage()).toEqual({ total: 30, cores: [30, 30] });
  });

  it('parses memory and swap values from /proc/meminfo', () => {
    useFiles({
      '/proc/meminfo': [
        'MemTotal: 1000 kB',
        'MemFree: 100 kB',
        'Buffers: 50 kB',
        'Cached: 150 kB',
        'MemAvailable: 400 kB',
        'SwapTotal: 200 kB',
        'SwapFree: 75 kB',
      ].join('\n'),
    });

    expect(getMemoryInfo()).toEqual({
      total: 1_024_000,
      used: 614_400,
      free: 102_400,
      buffers: 51_200,
      cached: 153_600,
      available: 409_600,
      swapTotal: 204_800,
      swapUsed: 128_000,
      swapFree: 76_800,
    });
  });

  it('parses process names containing a closing parenthesis', () => {
    const fields = Array.from({ length: 21 }, () => '0');
    fields[10] = '100';
    fields[11] = '50';
    fields[14] = '20';
    fields[16] = '3';
    fields[19] = '1048576';
    fields[20] = '10';
    useFiles({
      '/etc/passwd': 'alice:x:1000:1000::/home/alice:/bin/sh',
      '/proc/meminfo': 'MemTotal: 1000 kB\nMemAvailable: 500 kB',
      '/proc/123/stat': `123 (worker) special) S ${fields.join(' ')}`,
      '/proc/123/status': 'Uid:\t1000\nRssShmem:\t2 kB',
      '/proc/123/cmdline': 'node\0worker\0',
    });
    readdirSync.mockReturnValue(['123', 'self'] as never);

    expect(getProcessList()).toMatchObject([{
      pid: 123,
      name: 'worker) special',
      user: 'alice',
      state: 'S',
      priority: 20,
      threads: 3,
      virt: 1024,
      res: 40,
      shr: 2,
      time: '0:01',
      command: 'node worker',
    }]);
  });

  it('builds system task counts from a supplied process snapshot', () => {
    useFiles({
      '/etc/hostname': 'tuiuiu-host\n',
      '/proc/uptime': '90061.5 0',
      '/proc/loadavg': '1.25 0.75 0.50 1/100 1',
    });
    const process = (state: string) => ({
      pid: 1,
      name: 'task',
      user: 'user',
      state,
      priority: 0,
      nice: 0,
      threads: 1,
      virt: 0,
      res: 0,
      shr: 0,
      cpuPercent: 0,
      memPercent: 0,
      time: '0:00',
      command: 'task',
    });

    expect(getSystemInfo([
      process('R'),
      process('S'),
      process('D'),
      process('T'),
      process('Z'),
    ])).toEqual({
      hostname: 'tuiuiu-host',
      uptime: 90061.5,
      loadAvg: [1.25, 0.75, 0.5],
      tasks: {
        total: 5,
        running: 1,
        sleeping: 2,
        stopped: 1,
        zombie: 1,
      },
    });
  });

  it('returns conservative fallbacks when procfs is unavailable', () => {
    readFileSync.mockImplementation(() => {
      throw new Error('not supported');
    });
    readdirSync.mockImplementation(() => {
      throw new Error('not supported');
    });

    expect(getCpuUsage()).toEqual({ total: 0, cores: [] });
    expect(getMemoryInfo()).toMatchObject({ total: 0, used: 0, swapUsed: 0 });
    expect(getProcessList()).toEqual([]);
    expect(getSystemInfo([])).toMatchObject({
      hostname: 'unknown',
      uptime: 0,
      loadAvg: [0, 0, 0],
    });
  });

  it('formats system values deterministically', () => {
    expect(formatBytes(512)).toBe('512B');
    expect(formatBytes(1536)).toBe('1.5K');
    expect(formatBytes(2 * 1024 * 1024)).toBe('2.0M');
    expect(formatBytes(3 * 1024 * 1024 * 1024)).toBe('3.00G');
    expect(formatUptime(3660)).toBe('1:01');
    expect(formatUptime(90060)).toBe('1 days, 1:01');
    expect(getStateDescription('R')).toBe('Running');
    expect(getStateDescription('?')).toBe('?');
  });
});
