import { pathToFileURL } from 'node:url';

import {
  render,
  Box,
  Divider,
  Text,
  TextInput,
  getVisualLines,
  createNodeFsSyncStorage,
  createPromptModeRegistry,
  useConst,
  useEffect,
  useInput,
  useState,
  useTerminalSize,
  useTextInputState,
  type PromptModeResolved,
  type VNode,
} from '../src/index.js';
import {
  createShellSessionController,
  type ShellSessionController,
  type ShellSessionEntry,
  type ShellSessionLiveStatus,
  type ShellSessionStdinState,
  type ShellSessionSnapshot,
} from './_shared/shell-session-controller.js';

const DEFAULT_SESSION_STORAGE_DIR = './.tuiuiu-data/examples/shell-session-workbench';
const DEFAULT_SESSION_STORAGE_KEY = 'shell-session-state';
let defaultController: ShellSessionController | null = null;

function getDefaultController(): ShellSessionController {
  if (!defaultController) {
    defaultController = createShellSessionController({
      persistence: {
        storage: createNodeFsSyncStorage({ dir: DEFAULT_SESSION_STORAGE_DIR }),
        key: DEFAULT_SESSION_STORAGE_KEY,
      },
    });
  }

  return defaultController;
}

function destroyDefaultController(): void {
  const controller = defaultController;
  defaultController = null;
  controller?.destroy();
}

const promptModes = createPromptModeRegistry({
  defaultMode: {
    id: 'text',
    label: 'Text',
    description: 'Local note mode. Prefix `!` to run a shell command.',
  },
  modes: [
    {
      id: 'shell',
      label: 'Shell',
      description: 'App-owned shell/session route.',
      prefix: '!',
    },
  ],
});

export interface ShellSessionWorkbenchProps {
  controller?: ShellSessionController;
}

type ShellSubmitAction =
  | { kind: 'ignore' }
  | { kind: 'local'; text: string }
  | { kind: 'run-command'; command: string }
  | { kind: 'write-stdin'; text: string }
  | { kind: 'interrupt' }
  | { kind: 'close-stdin' };

function SessionEntryCard(entry: ShellSessionEntry, compact = false): VNode {
  const color =
    entry.stream === 'stdout'
      ? 'green'
      : entry.stream === 'stderr'
        ? 'red'
        : 'cyan';

  if (compact) {
    return Text(
      { color },
      `${entry.stream.toUpperCase()}> ${entry.text}`,
    );
  }

  return Box(
    {
      flexDirection: 'column',
      borderStyle: 'round',
      borderColor: color,
      paddingX: 1,
      marginBottom: 1,
    },
    Text({ color, bold: true }, entry.stream.toUpperCase()),
    Text({}, entry.text),
  );
}

function PromptModePanel(props: {
  mode: PromptModeResolved;
  compact?: boolean;
}): VNode {
  const mode = props.mode;
  const color = mode.mode.id === 'shell' ? 'magenta' : 'green';

  return Box(
    { flexDirection: 'column' },
    Text({ color, bold: true }, `MODE  ${mode.mode.label ?? mode.mode.id}`),
    !props.compact && mode.mode.description
      ? Text({ color: 'gray', dim: true }, mode.mode.description)
      : null,
    props.compact ? null : Text({}, `explicit: ${mode.isExplicit ? 'yes' : 'no'}`),
    props.compact ? null : Text({}, `prefix: ${mode.prefix ?? '(none)'}`),
    Text({ color: 'gray', dim: true }, `payload: ${mode.payload || '(empty)'}`),
  );
}

function LiveStatusPanel(props: {
  status: ShellSessionLiveStatus;
  compact?: boolean;
}): VNode {
  const status = props.status;
  const color =
    status.phase === 'interrupt-requested'
      ? 'yellow'
      : status.phase === 'running' || status.phase === 'starting'
        ? 'green'
        : status.phase === 'exited'
          ? 'cyan'
          : 'gray';

  return Box(
    { flexDirection: 'column' },
    Text({ color, bold: true }, `STATUS  ${status.phase}`),
    Text({}, `summary: ${status.summary}`),
    props.compact ? null : Text({}, `command: ${status.command ?? '(none)'}`),
    props.compact ? null : Text({}, `last output: ${status.lastOutputStream ?? '(none)'}`),
    props.compact
      ? null
      : Text({ color: 'gray', dim: true }, `last line: ${status.lastOutputText ?? '(none)'}`),
  );
}

function InputRoutePanel(props: {
  action: ShellSubmitAction;
  stdin: ShellSessionStdinState;
}): VNode {
  const route = props.action.kind === 'run-command'
    ? 'launch shell command'
    : props.action.kind === 'write-stdin'
      ? 'send line to active stdin'
      : props.action.kind === 'interrupt'
        ? 'interrupt active process'
        : props.action.kind === 'close-stdin'
          ? 'close active stdin'
          : 'keep local note';
  const color =
    props.action.kind === 'run-command'
      ? 'magenta'
      : props.action.kind === 'write-stdin'
        ? 'green'
        : props.action.kind === 'interrupt' || props.action.kind === 'close-stdin'
          ? 'yellow'
          : 'gray';

  return Box(
    { flexDirection: 'column' },
    Text({ color, bold: true }, 'SUBMIT ROUTE'),
    Text({}, route),
    Text({ color: 'gray', dim: true }, props.stdin.summary),
  );
}

function resolveShellSubmitAction(
  rawValue: string,
  mode: PromptModeResolved,
  snapshot: ShellSessionSnapshot
): ShellSubmitAction {
  const trimmed = rawValue.trim();
  if (!trimmed) {
    return { kind: 'ignore' };
  }

  if (snapshot.stdin.writable) {
    if (mode.mode.id === 'shell' && mode.payload === 'interrupt') {
      return { kind: 'interrupt' };
    }
    if (mode.mode.id === 'shell' && mode.payload === 'stdin-close') {
      return { kind: 'close-stdin' };
    }
    return { kind: 'write-stdin', text: rawValue.replace(/\r?\n$/, '') };
  }

  if (mode.mode.id === 'shell') {
    return { kind: 'run-command', command: mode.payload };
  }

  return { kind: 'local', text: mode.payload };
}

function getPromptVisualLineIndex(value: string, cursorPosition: number, width: number): {
  lineIndex: number;
  lineCount: number;
} {
  const lines = getVisualLines(value, width, true);
  let lineIndex = 0;

  if (cursorPosition >= value.length && lines.length > 0) {
    lineIndex = lines.length - 1;
  } else {
    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];
      if (!line) {
        continue;
      }
      if (cursorPosition >= line.start && cursorPosition <= line.end) {
        lineIndex = index;
        if (cursorPosition < line.end || index === lines.length - 1) {
          break;
        }
      }
    }
  }

  return {
    lineIndex,
    lineCount: lines.length,
  };
}

export function ShellSessionWorkbench(props: ShellSessionWorkbenchProps = {}): VNode {
  const controller = props.controller ?? getDefaultController();
  const { columns, rows } = useTerminalSize();
  const [snapshot, setSnapshot] = useState<ShellSessionSnapshot>(controller.getSnapshot());
  const historyCursor = useConst(() => ({ index: -1 }));
  const prompt = useTextInputState({
    placeholder: 'Try !demo-stream, !demo-stdin, !demo-status, !demo-hang, or !echo hello',
    multiline: true,
    wordWrap: true,
    autoGrow: true,
    maxLines: 4,
    onSubmit: (value) => {
      const raw = value;
      const mode = promptModes.inspectPrompt(raw.trim());
      const action = resolveShellSubmitAction(raw, mode, snapshot());

      if (action.kind === 'ignore') {
        return;
      }

      if (action.kind === 'local') {
        controller.appendSystemMessage(`Text mode stays local: ${action.text}`);
      } else if (action.kind === 'run-command') {
        controller.runCommand(action.command);
      } else if (action.kind === 'write-stdin') {
        controller.writeInputLine(action.text);
      } else if (action.kind === 'interrupt') {
        controller.interrupt();
      } else if (action.kind === 'close-stdin') {
        controller.closeInput();
      }

      historyCursor.index = -1;
      prompt.clear();
    },
  });

  useEffect(() => controller.subscribe((next) => {
    setSnapshot(next);
  }));

  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'x')) {
      if (snapshot().running) {
        controller.interrupt();
        return true;
      }
    }

    if (key.upArrow) {
      const history = snapshot().commandHistory;
      if (history.length === 0) {
        return false;
      }
      const promptWidth = Math.max(1, (prompt.getOptions().width ?? 80) - 6);
      const lineInfo = getPromptVisualLineIndex(
        prompt.value(),
        prompt.cursorPosition(),
        promptWidth
      );
      if (lineInfo.lineIndex > 0) {
        return false;
      }

      const nextIndex = historyCursor.index < 0
        ? history.length - 1
        : Math.max(0, historyCursor.index - 1);
      historyCursor.index = nextIndex;
      prompt.setValue(`!${history[nextIndex] ?? ''}`);
      prompt.setCursorPosition(prompt.value().length);
      return true;
    }

    if (key.downArrow) {
      const history = snapshot().commandHistory;
      if (history.length === 0 || historyCursor.index < 0) {
        return false;
      }
      const promptWidth = Math.max(1, (prompt.getOptions().width ?? 80) - 6);
      const lineInfo = getPromptVisualLineIndex(
        prompt.value(),
        prompt.cursorPosition(),
        promptWidth
      );
      if (lineInfo.lineIndex < lineInfo.lineCount - 1) {
        return false;
      }

      const nextIndex = historyCursor.index + 1;
      if (nextIndex >= history.length) {
        historyCursor.index = -1;
        prompt.clear();
        return true;
      }

      historyCursor.index = nextIndex;
      prompt.setValue(`!${history[nextIndex] ?? ''}`);
      prompt.setCursorPosition(prompt.value().length);
      return true;
    }

    if (key.ctrl && input === 'l') {
      controller.reset();
      return true;
    }
    return false;
  }, { priority: 'critical', stopPropagation: true });

  const mode = promptModes.inspectPrompt(prompt.value());
  const previewAction = resolveShellSubmitAction(prompt.value(), mode, snapshot());
  const sidebarWidth = Math.max(36, Math.min(44, Math.floor(columns * 0.34)));
  const transcriptWidth = Math.max(40, columns - sidebarWidth - 7);
  const compactSidebar = columns < 110 || rows < 36;

  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ color: 'cyan', bold: true }, 'Shell Session Workbench'),
    Text({ color: 'gray', dim: true }, 'This example keeps shell execution, replay, and reconnect logic in app code. The library only contributes input, layout, and prompt-mode primitives.'),
    Text({ color: 'gray', dim: true }, 'The default demo persists replayable transcript and command history locally, but it never resumes an active process after restart.'),
    Divider(),
    Box(
      { flexDirection: 'row', gap: 1 as any, alignItems: 'flex-start' as any },
      Box(
        {
          flexDirection: 'column',
          width: transcriptWidth,
          borderStyle: 'round',
          borderColor: 'cyan',
          paddingX: 1,
        },
        Text({ color: 'cyan', bold: true }, 'Session Transcript'),
        ...(snapshot().entries.length === 0
          ? [Text({ color: 'gray', dim: true }, 'No shell output yet. Submit !demo-stream to watch incremental output.')]
          : snapshot().entries
            .slice(-8)
            .map((entry) => SessionEntryCard(entry, compactSidebar)))
      ),
      Box(
        {
          flexDirection: 'column',
          width: sidebarWidth,
          borderStyle: 'round',
          borderColor: 'gray',
          paddingX: 1,
        },
        Text({ color: 'yellow', bold: true }, 'Live Status'),
        LiveStatusPanel({
          status: snapshot().liveStatus,
          compact: compactSidebar,
        }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Prompt Mode'),
        PromptModePanel({ mode, compact: compactSidebar }),
        Divider(),
        Text({ color: 'yellow', bold: true }, 'Session State'),
        Text({}, `running: ${snapshot().running ? 'yes' : 'no'}`),
        Text({}, `current command: ${snapshot().currentCommand ?? '(none)'}`),
        compactSidebar ? null : Text({}, `replay entries: ${snapshot().entries.length}`),
        compactSidebar ? null : Text({}, `history entries: ${snapshot().commandHistory.length}`),
        Text({}, `stdin writable: ${snapshot().stdin.writable ? 'yes' : 'no'}`),
        compactSidebar
          ? null
          : Text({}, `persistence: ${props.controller ? 'external controller' : DEFAULT_SESSION_STORAGE_KEY}`),
        Divider(),
        InputRoutePanel({ action: previewAction, stdin: snapshot().stdin }),
        Divider(),
        Text({ color: 'gray', dim: true }, '!demo-stream for deterministic test output'),
        Text({ color: 'gray', dim: true }, '!demo-stdin for line-based stdin bridging'),
        Text({ color: 'gray', dim: true }, '!demo-status for long-running status feedback'),
        Text({ color: 'gray', dim: true }, '!demo-hang for deterministic interrupt testing'),
        Text({ color: 'gray', dim: true }, '!stdin-close closes stdin for the active process'),
        Text({ color: 'gray', dim: true }, '!interrupt requests app-owned process stop'),
        Text({ color: 'gray', dim: true }, 'While stdin is active, only !interrupt and !stdin-close stay reserved'),
        Text({ color: 'gray', dim: true }, 'Other submits, including lines starting with !, go to stdin intentionally'),
        Text({ color: 'gray', dim: true }, '!echo hello for a real shell-built command'),
        Text({ color: 'gray', dim: true }, 'Up/Down recalls command history'),
        Text({ color: 'gray', dim: true }, 'Esc or Ctrl+X interrupts active command'),
        Text({ color: 'gray', dim: true }, 'Ctrl+L clears replay buffer'),
        Text({ color: 'gray', dim: true }, 'Persisted replay does not resume active processes'),
      ),
    ),
    Divider(),
    TextInput({
      state: prompt,
      borderStyle: 'round',
      fullWidth: true,
      prompt: '>',
      focusedBorderColor: snapshot().running ? 'yellow' : 'cyan',
    }),
  );
}

function isMainModule(): boolean {
  const entry = process.argv[1];
  if (!entry) {
    return false;
  }

  return import.meta.url === pathToFileURL(entry).href;
}

if (isMainModule()) {
  const { waitUntilExit } = render(() => ShellSessionWorkbench(), {
    fullHeight: true,
    maxFps: 30,
  });
  await waitUntilExit();
  destroyDefaultController();
}
