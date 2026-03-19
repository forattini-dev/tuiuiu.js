import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

import type { SyncStorageAdapter } from '../../src/primitives/store.js';
import { spawnShellSessionDemoProcess } from './shell-session-demo-process.js';

export type ShellSessionStream = 'stdout' | 'stderr' | 'system';

export interface ShellSessionEntry {
  id: number;
  stream: ShellSessionStream;
  text: string;
}

export type ShellSessionPhase =
  | 'idle'
  | 'starting'
  | 'running'
  | 'interrupt-requested'
  | 'exited';

export interface ShellSessionLiveStatus {
  phase: ShellSessionPhase;
  command: string | null;
  summary: string;
  lastOutputStream: Exclude<ShellSessionStream, 'system'> | null;
  lastOutputText: string | null;
  lastUpdatedAt: number | null;
}

export interface ShellSessionStdinState {
  writable: boolean;
  summary: string;
}

export interface ShellSessionSnapshot {
  entries: ShellSessionEntry[];
  running: boolean;
  currentCommand: string | null;
  commandHistory: string[];
  liveStatus: ShellSessionLiveStatus;
  stdin: ShellSessionStdinState;
}

export interface ShellSessionController {
  getSnapshot: () => ShellSessionSnapshot;
  subscribe: (listener: (snapshot: ShellSessionSnapshot) => void) => () => void;
  appendSystemMessage: (message: string) => void;
  runCommand: (command: string) => boolean;
  writeInputLine: (input: string) => boolean;
  closeInput: () => boolean;
  interrupt: () => boolean;
  getHistorySnapshot: () => string[];
  reset: () => void;
  destroy: () => void;
}

export interface ShellSessionControllerOptions {
  maxEntries?: number;
  maxHistory?: number;
  persistence?: {
    storage: SyncStorageAdapter;
    key: string;
  };
}

let nextEntryId = 1;

interface PersistedShellSessionEntry {
  stream: ShellSessionStream;
  text: string;
}

interface PersistedShellSessionState {
  entries?: PersistedShellSessionEntry[];
  commandHistory?: string[];
}

function createIdleStatus(): ShellSessionLiveStatus {
  return {
    phase: 'idle',
    command: null,
    summary: 'No active shell command.',
    lastOutputStream: null,
    lastOutputText: null,
    lastUpdatedAt: null,
  };
}

function createIdleStdinState(): ShellSessionStdinState {
  return {
    writable: false,
    summary: 'No active stdin target.',
  };
}

function createEntry(stream: ShellSessionStream, text: string): ShellSessionEntry {
  return {
    id: nextEntryId++,
    stream,
    text,
  };
}

export function createShellSessionController(
  options: ShellSessionControllerOptions = {}
): ShellSessionController {
  const maxEntries = Math.max(10, options.maxEntries ?? 120);
  const maxHistory = Math.max(5, options.maxHistory ?? 40);
  const persistence = options.persistence;
  const listeners = new Set<(snapshot: ShellSessionSnapshot) => void>();
  let entries: ShellSessionEntry[] = [];
  let commandHistory: string[] = [];
  let running = false;
  let currentCommand: string | null = null;
  let liveStatus: ShellSessionLiveStatus = createIdleStatus();
  let stdinState: ShellSessionStdinState = createIdleStdinState();
  let currentProcess: ChildProcessWithoutNullStreams | null = null;
  let stdoutCarry = '';
  let stderrCarry = '';

  const buildSnapshot = (): ShellSessionSnapshot => ({
    entries: [...entries],
    running,
    currentCommand,
    commandHistory: [...commandHistory],
    liveStatus: { ...liveStatus },
    stdin: { ...stdinState },
  });

  const resetProcessRuntimeState = () => {
    currentProcess = null;
    running = false;
    currentCommand = null;
    stdoutCarry = '';
    stderrCarry = '';
    stdinState = createIdleStdinState();
  };

  const restoreIdleSessionState = (
    nextEntries: ShellSessionEntry[],
    nextHistory: string[]
  ) => {
    entries = nextEntries;
    commandHistory = nextHistory;
    liveStatus = createIdleStatus();
    resetProcessRuntimeState();
  };

  const setLiveStatus = (
    phase: ShellSessionPhase,
    partial: Partial<Omit<ShellSessionLiveStatus, 'phase'>>
  ) => {
    liveStatus = {
      ...liveStatus,
      phase,
      ...partial,
      lastUpdatedAt: Date.now(),
    };
  };

  const setStdinState = (writable: boolean, summary: string) => {
    stdinState = {
      writable,
      summary,
    };
  };

  const persistReplayState = () => {
    if (!persistence) {
      return;
    }

    try {
      persistence.storage.setItem(
        persistence.key,
        JSON.stringify({
          entries: entries.map((entry) => ({
            stream: entry.stream,
            text: entry.text,
          })),
          commandHistory: [...commandHistory],
        } satisfies PersistedShellSessionState)
      );
    } catch (error) {
      console.warn(
        'Failed to persist shell session replay state. Continuing without persisted shell state.',
        error
      );
    }
  };

  const hydratePersistedState = (): void => {
    if (!persistence) {
      return;
    }

    try {
      const raw = persistence.storage.getItem(persistence.key);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as PersistedShellSessionState;
      const hydratedEntries = Array.isArray(parsed.entries)
        ? parsed.entries
          .filter((entry): entry is PersistedShellSessionEntry =>
            Boolean(entry)
            && (entry.stream === 'stdout' || entry.stream === 'stderr' || entry.stream === 'system')
            && typeof entry.text === 'string'
          )
          .slice(-maxEntries)
          .map((entry) => createEntry(entry.stream, entry.text))
        : [];
      const hydratedHistory = Array.isArray(parsed.commandHistory)
        ? parsed.commandHistory
          .filter((entry): entry is string => typeof entry === 'string')
          .slice(-maxHistory)
        : [];

      restoreIdleSessionState(hydratedEntries, hydratedHistory);
    } catch (error) {
      console.warn(
        'Failed to hydrate persisted shell session state. Falling back to empty session state.',
        error
      );
      restoreIdleSessionState([], []);
    }
  };

  hydratePersistedState();

  const emit = () => {
    const snapshot = buildSnapshot();
    for (const listener of listeners) {
      listener(snapshot);
    }
  };

  const append = (stream: ShellSessionStream, text: string) => {
    if (!text) {
      return;
    }
    entries = [...entries, createEntry(stream, text)].slice(-maxEntries);
    persistReplayState();
    emit();
  };

  const flushCarry = (stream: 'stdout' | 'stderr') => {
    if (stream === 'stdout') {
      if (stdoutCarry) {
        append('stdout', stdoutCarry);
        stdoutCarry = '';
      }
      return;
    }

    if (stderrCarry) {
      append('stderr', stderrCarry);
      stderrCarry = '';
    }
  };

  const appendChunkLines = (stream: 'stdout' | 'stderr', chunk: string) => {
    const buffered = `${stream === 'stdout' ? stdoutCarry : stderrCarry}${chunk}`;
    const parts = buffered.split(/\r?\n/);
    const trailing = parts.pop() ?? '';

    for (const part of parts) {
      setLiveStatus('running', {
        command: currentCommand,
        summary: `Receiving ${stream} output from ${currentCommand ?? 'command'}.`,
        lastOutputStream: stream,
        lastOutputText: part,
      });
      append(stream, part);
    }

    if (stream === 'stdout') {
      stdoutCarry = trailing;
    } else {
      stderrCarry = trailing;
    }
  };

  const clearProcessState = () => {
    resetProcessRuntimeState();
    emit();
  };

  return {
    getSnapshot: () => buildSnapshot(),
    subscribe: (listener) => {
      listeners.add(listener);
      listener(buildSnapshot());
      return () => {
        listeners.delete(listener);
      };
    },
    appendSystemMessage: (message) => {
      append('system', message);
    },
    runCommand: (command) => {
      const trimmed = command.trim();
      if (!trimmed) {
        append('system', 'Shell mode expects a command after `!`.');
        return false;
      }

      if (running || currentProcess) {
        append('system', 'A shell command is already running.');
        return false;
      }

      append('system', `$ ${trimmed}`);
      commandHistory = [...commandHistory, trimmed].slice(-maxHistory);
      persistReplayState();
      running = true;
      currentCommand = trimmed;
      setLiveStatus('starting', {
        command: trimmed,
        summary: `Starting ${trimmed}...`,
        lastOutputStream: null,
        lastOutputText: null,
      });
      emit();

      const proc = spawnShellSessionDemoProcess(trimmed) ?? spawn(trimmed, {
        shell: true,
      });

      currentProcess = proc;
      setLiveStatus('running', {
        command: trimmed,
        summary: `Running ${trimmed}...`,
      });
      setStdinState(
        trimmed === 'demo-stdin' && proc.stdin.writable,
        trimmed === 'demo-stdin' && proc.stdin.writable
          ? `Plain-text submit writes a line to ${trimmed} stdin.`
          : `Prompt submit stays local while ${trimmed} runs.`
      );
      emit();

      proc.stdout.on('data', (data) => {
        appendChunkLines('stdout', data.toString());
      });

      proc.stderr.on('data', (data) => {
        appendChunkLines('stderr', data.toString());
      });

      proc.stdin.on('close', () => {
        if (!running || currentProcess !== proc) {
          return;
        }

        setStdinState(false, `stdin closed for ${currentCommand ?? 'process'}.`);
        emit();
      });

      proc.on('error', (error) => {
        setLiveStatus('exited', {
          command: currentCommand,
          summary: `Process error: ${error.message}`,
        });
        append('system', `Process error: ${error.message}`);
        clearProcessState();
      });

      proc.on('close', (code, signal) => {
        flushCarry('stdout');
        flushCarry('stderr');
        setLiveStatus('exited', {
          command: currentCommand,
          summary: signal
            ? `Interrupted by ${signal}`
            : `Exited with code ${code ?? 0}`,
        });
        append('system', signal
          ? `Process interrupted by ${signal}`
          : `Process exited with code ${code ?? 0}`);
        clearProcessState();
      });

      return true;
    },
    writeInputLine: (input) => {
      const text = input.replace(/\r?\n$/, '');
      if (!running || !currentProcess || !stdinState.writable) {
        append('system', 'No active shell command is accepting stdin input.');
        return false;
      }

      if (!currentProcess.stdin.writable || currentProcess.stdin.writableEnded) {
        setStdinState(false, `stdin closed for ${currentCommand ?? 'process'}.`);
        append('system', 'stdin is no longer writable for the active shell command.');
        emit();
        return false;
      }

      append('system', `stdin> ${text}`);
      setLiveStatus('running', {
        command: currentCommand,
        summary: `Sent input to ${currentCommand ?? 'process'}.`,
      });

      try {
        currentProcess.stdin.write(`${text}\n`);
      } catch (error) {
        setStdinState(false, `stdin write failed for ${currentCommand ?? 'process'}.`);
        append(
          'system',
          `stdin write failed: ${error instanceof Error ? error.message : String(error)}`
        );
        emit();
        return false;
      }

      emit();
      return true;
    },
    closeInput: () => {
      if (!running || !currentProcess || !stdinState.writable) {
        append('system', 'No active shell stdin stream to close.');
        return false;
      }

      setStdinState(false, `stdin close requested for ${currentCommand ?? 'process'}.`);
      append('system', `stdin close requested for: ${currentCommand ?? 'process'}`);
      currentProcess.stdin.end();
      emit();
      return true;
    },
    interrupt: () => {
      if (!running || !currentProcess) {
        append('system', 'No active command to interrupt.');
        return false;
      }

      append('system', `Interrupt requested for: ${currentCommand ?? 'process'}`);
      setLiveStatus('interrupt-requested', {
        command: currentCommand,
        summary: `Interrupt requested for ${currentCommand ?? 'process'}.`,
      });
      setStdinState(false, `stdin disabled while interrupt is pending for ${currentCommand ?? 'process'}.`);
      emit();
      currentProcess.kill('SIGTERM');
      return true;
    },
    getHistorySnapshot: () => [...commandHistory],
    reset: () => {
      entries = [];
      liveStatus = running
        ? liveStatus
        : createIdleStatus();
      stdinState = running
        ? stdinState
        : createIdleStdinState();
      persistReplayState();
      emit();
    },
    destroy: () => {
      currentProcess?.kill();
      resetProcessRuntimeState();
      liveStatus = createIdleStatus();
      listeners.clear();
    },
  };
}
