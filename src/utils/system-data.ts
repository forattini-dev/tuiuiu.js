/**
 * System Data Reader
 *
 * Reads real system information from /proc filesystem on Linux.
 * Provides CPU, memory, and process information for monitoring tools.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CpuStats {
  user: number;
  nice: number;
  system: number;
  idle: number;
  iowait: number;
  irq: number;
  softirq: number;
  steal: number;
}

export interface CpuUsage {
  total: number; // 0-100 percentage
  cores: number[]; // per-core 0-100 percentages
}

export interface MemoryInfo {
  total: number; // bytes
  used: number; // bytes
  free: number; // bytes
  buffers: number; // bytes
  cached: number; // bytes
  available: number; // bytes
  swapTotal: number; // bytes
  swapUsed: number; // bytes
  swapFree: number; // bytes
}

export interface ProcessInfo {
  pid: number;
  name: string;
  user: string;
  state: string;
  priority: number;
  nice: number;
  threads: number;
  virt: number; // virtual memory in KB
  res: number; // resident memory in KB
  shr: number; // shared memory in KB
  cpuPercent: number;
  memPercent: number;
  time: string; // CPU time formatted
  command: string;
}

export interface SystemInfo {
  hostname: string;
  uptime: number; // seconds
  loadAvg: [number, number, number];
  tasks: {
    total: number;
    running: number;
    sleeping: number;
    stopped: number;
    zombie: number;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal State
// ─────────────────────────────────────────────────────────────────────────────

let prevCpuStats: CpuStats | null = null;
let prevCpuCoreStats: CpuStats[] = [];
let prevProcessCpuTimes: Map<number, { utime: number; stime: number; timestamp: number }> =
  new Map();

// ─────────────────────────────────────────────────────────────────────────────
// File Reading Helpers
// ─────────────────────────────────────────────────────────────────────────────

function readFile(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function parseKb(value: string): number {
  // Parse values like "16384 kB" to bytes
  const match = value.match(/^(\d+)\s*kB?$/i);
  return match ? parseInt(match[1], 10) * 1024 : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// CPU Stats
// ─────────────────────────────────────────────────────────────────────────────

function parseCpuLine(line: string): CpuStats | null {
  const parts = line.trim().split(/\s+/);
  if (parts.length < 8) return null;

  return {
    user: parseInt(parts[1], 10) || 0,
    nice: parseInt(parts[2], 10) || 0,
    system: parseInt(parts[3], 10) || 0,
    idle: parseInt(parts[4], 10) || 0,
    iowait: parseInt(parts[5], 10) || 0,
    irq: parseInt(parts[6], 10) || 0,
    softirq: parseInt(parts[7], 10) || 0,
    steal: parseInt(parts[8], 10) || 0,
  };
}

function calculateCpuPercent(prev: CpuStats, curr: CpuStats): number {
  const prevTotal =
    prev.user +
    prev.nice +
    prev.system +
    prev.idle +
    prev.iowait +
    prev.irq +
    prev.softirq +
    prev.steal;
  const currTotal =
    curr.user +
    curr.nice +
    curr.system +
    curr.idle +
    curr.iowait +
    curr.irq +
    curr.softirq +
    curr.steal;

  const totalDiff = currTotal - prevTotal;
  const idleDiff = curr.idle - prev.idle;

  if (totalDiff === 0) return 0;
  return Math.round(((totalDiff - idleDiff) / totalDiff) * 100);
}

export function getCpuUsage(): CpuUsage {
  const content = readFile('/proc/stat');
  if (!content) {
    return { total: 0, cores: [] };
  }

  const lines = content.split('\n');
  const cpuLines = lines.filter(line => line.startsWith('cpu'));

  // First line is aggregate CPU
  const totalLine = cpuLines[0];
  const currTotal = parseCpuLine(totalLine);

  // Core lines
  const coreLines = cpuLines.slice(1).filter(line => /^cpu\d+/.test(line));
  const currCores = coreLines.map(parseCpuLine).filter((s): s is CpuStats => s !== null);

  let total = 0;
  const cores: number[] = [];

  if (currTotal && prevCpuStats) {
    total = calculateCpuPercent(prevCpuStats, currTotal);
  }

  for (let i = 0; i < currCores.length; i++) {
    if (prevCpuCoreStats[i]) {
      cores.push(calculateCpuPercent(prevCpuCoreStats[i], currCores[i]));
    } else {
      cores.push(0);
    }
  }

  // Store for next call
  if (currTotal) prevCpuStats = currTotal;
  prevCpuCoreStats = currCores;

  return { total, cores };
}

// ─────────────────────────────────────────────────────────────────────────────
// Memory Stats
// ─────────────────────────────────────────────────────────────────────────────

export function getMemoryInfo(): MemoryInfo {
  const content = readFile('/proc/meminfo');
  if (!content) {
    return {
      total: 0,
      used: 0,
      free: 0,
      buffers: 0,
      cached: 0,
      available: 0,
      swapTotal: 0,
      swapUsed: 0,
      swapFree: 0,
    };
  }

  const info: Record<string, number> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const match = line.match(/^(\w+):\s+(.+)$/);
    if (match) {
      info[match[1]] = parseKb(match[2]);
    }
  }

  const total = info['MemTotal'] || 0;
  const free = info['MemFree'] || 0;
  const buffers = info['Buffers'] || 0;
  const cached = info['Cached'] || 0;
  const available = info['MemAvailable'] || free + buffers + cached;
  const used = total - available;

  const swapTotal = info['SwapTotal'] || 0;
  const swapFree = info['SwapFree'] || 0;
  const swapUsed = swapTotal - swapFree;

  return {
    total,
    used,
    free,
    buffers,
    cached,
    available,
    swapTotal,
    swapUsed,
    swapFree,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Process Stats
// ─────────────────────────────────────────────────────────────────────────────

function getUidUsername(): Map<number, string> {
  const content = readFile('/etc/passwd');
  const map = new Map<number, string>();

  if (content) {
    for (const line of content.split('\n')) {
      const parts = line.split(':');
      if (parts.length >= 3) {
        const username = parts[0];
        const uid = parseInt(parts[2], 10);
        map.set(uid, username);
      }
    }
  }

  return map;
}

function formatCpuTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function getClockTicks(): number {
  // sysconf(_SC_CLK_TCK) is typically 100 on Linux
  return 100;
}

export function getProcessList(): ProcessInfo[] {
  const procDir = '/proc';
  const processes: ProcessInfo[] = [];
  const uidMap = getUidUsername();
  const clockTicks = getClockTicks();
  const memInfo = getMemoryInfo();
  const now = Date.now();

  let entries: string[];
  try {
    entries = fs.readdirSync(procDir);
  } catch {
    return [];
  }

  // Filter to only numeric (PID) directories
  const pidDirs = entries.filter(e => /^\d+$/.test(e));

  for (const pidStr of pidDirs) {
    const pid = parseInt(pidStr, 10);
    const pidPath = path.join(procDir, pidStr);

    try {
      // Read /proc/[pid]/stat
      const statContent = readFile(path.join(pidPath, 'stat'))?.trim();
      if (!statContent) continue;

      // Parse stat - format: pid (comm) state ppid pgrp session tty_nr tpgid flags
      // minflt cminflt majflt cmajflt utime stime cutime cstime priority nice
      // num_threads itrealvalue starttime vsize rss ...
      const statMatch = statContent.match(/^(\d+)\s+\((.+?)\)\s+(\S)\s+(.+)$/);
      if (!statMatch) continue;

      const name = statMatch[2];
      const state = statMatch[3];
      const restFields = statMatch[4].split(/\s+/);

      // Fields after (comm) state:
      // 0: ppid, 1: pgrp, 2: session, 3: tty_nr, 4: tpgid, 5: flags
      // 6: minflt, 7: cminflt, 8: majflt, 9: cmajflt
      // 10: utime, 11: stime, 12: cutime, 13: cstime
      // 14: priority, 15: nice, 16: num_threads
      // 17: itrealvalue, 18: starttime
      // 19: vsize, 20: rss

      const utime = parseInt(restFields[10], 10) || 0;
      const stime = parseInt(restFields[11], 10) || 0;
      const priority = parseInt(restFields[14], 10) || 0;
      const nice = parseInt(restFields[15], 10) || 0;
      const threads = parseInt(restFields[16], 10) || 1;
      const vsize = (parseInt(restFields[19], 10) || 0) / 1024; // bytes to KB
      const rss = ((parseInt(restFields[20], 10) || 0) * 4096) / 1024; // pages to KB

      // Calculate CPU percentage
      let cpuPercent = 0;
      const prevTimes = prevProcessCpuTimes.get(pid);
      if (prevTimes) {
        const timeDiff = (now - prevTimes.timestamp) / 1000; // seconds
        const cpuTimeDiff = (utime + stime - prevTimes.utime - prevTimes.stime) / clockTicks;
        if (timeDiff > 0) {
          cpuPercent = Math.min(100, (cpuTimeDiff / timeDiff) * 100);
        }
      }
      prevProcessCpuTimes.set(pid, { utime, stime, timestamp: now });

      // Calculate memory percentage
      const memPercent = memInfo.total > 0 ? (rss * 1024 * 100) / memInfo.total : 0;

      // Format CPU time
      const totalCpuSeconds = (utime + stime) / clockTicks;
      const time = formatCpuTime(totalCpuSeconds);

      // Read /proc/[pid]/status for UID and shared memory
      const statusContent = readFile(path.join(pidPath, 'status'));
      let uid = 0;
      let shr = 0;

      if (statusContent) {
        const uidMatch = statusContent.match(/^Uid:\s+(\d+)/m);
        if (uidMatch) uid = parseInt(uidMatch[1], 10);

        const rssSharedMatch = statusContent.match(/^RssShmem:\s+(\d+)\s+kB/m);
        if (rssSharedMatch) shr = parseInt(rssSharedMatch[1], 10);
      }

      const user = uidMap.get(uid) || uid.toString();

      // Read /proc/[pid]/cmdline for full command
      const cmdlineContent = readFile(path.join(pidPath, 'cmdline'));
      const command = cmdlineContent
        ? cmdlineContent.replace(/\0/g, ' ').trim() || name
        : name;

      processes.push({
        pid,
        name,
        user,
        state,
        priority,
        nice,
        threads,
        virt: Math.round(vsize),
        res: Math.round(rss),
        shr: Math.round(shr),
        cpuPercent: Math.round(cpuPercent * 10) / 10,
        memPercent: Math.round(memPercent * 10) / 10,
        time,
        command,
      });
    } catch {
      // Process may have exited, skip it
      continue;
    }
  }

  // Clean up old process CPU times
  const currentPids = new Set(processes.map(p => p.pid));
  for (const pid of prevProcessCpuTimes.keys()) {
    if (!currentPids.has(pid)) {
      prevProcessCpuTimes.delete(pid);
    }
  }

  return processes;
}

// ─────────────────────────────────────────────────────────────────────────────
// System Info
// ─────────────────────────────────────────────────────────────────────────────

export function getSystemInfo(): SystemInfo {
  // Hostname
  const hostname = readFile('/etc/hostname')?.trim() || 'unknown';

  // Uptime
  const uptimeContent = readFile('/proc/uptime');
  const uptime = uptimeContent ? parseFloat(uptimeContent.split(' ')[0]) : 0;

  // Load average
  const loadContent = readFile('/proc/loadavg');
  const loadParts = loadContent?.split(' ') || [];
  const loadAvg: [number, number, number] = [
    parseFloat(loadParts[0]) || 0,
    parseFloat(loadParts[1]) || 0,
    parseFloat(loadParts[2]) || 0,
  ];

  // Task counts from processes
  const processes = getProcessList();
  const tasks = {
    total: processes.length,
    running: processes.filter(p => p.state === 'R').length,
    sleeping: processes.filter(p => p.state === 'S' || p.state === 'D').length,
    stopped: processes.filter(p => p.state === 'T').length,
    zombie: processes.filter(p => p.state === 'Z').length,
  };

  return {
    hostname,
    uptime,
    loadAvg,
    tasks,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Formatted Helpers
// ─────────────────────────────────────────────────────────────────────────────

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}K`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)}M`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)}G`;
}

export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) {
    return `${days} days, ${hours}:${minutes.toString().padStart(2, '0')}`;
  }
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

export function getStateDescription(state: string): string {
  const states: Record<string, string> = {
    R: 'Running',
    S: 'Sleeping',
    D: 'Disk sleep',
    Z: 'Zombie',
    T: 'Stopped',
    t: 'Tracing stop',
    X: 'Dead',
    I: 'Idle',
  };
  return states[state] || state;
}
