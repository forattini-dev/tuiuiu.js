import { searchCommands, type Command } from './command-palette.js';

export interface PromptCommandDefinition {
  id: string;
  command: string;
  description?: string;
  usage?: string;
  aliases?: string[];
  tags?: string[];
  completeArgs?: (
    context: PromptCommandArgumentCompletionContext
  ) => PromptCommandArgumentCompletionItem[] | Promise<PromptCommandArgumentCompletionItem[]>;
  getLiveDiagnostic?: (
    context: PromptCommandLiveDiagnosticContext
  ) => PromptCommandLiveDiagnostic | null;
}

export interface PromptCommandCompletion {
  id: string;
  label: string;
  detail?: string;
  replacement: string;
  command: PromptCommandDefinition;
  score: number;
}

export interface PromptCommandArgumentCompletionItem {
  id: string;
  label: string;
  detail?: string;
  replacement: string;
}

export interface PromptCommandParseResult {
  command: PromptCommandDefinition;
  matchedToken: string;
  invocation: string;
  argsText: string;
}

export interface PromptCommandArgumentCompletionContext extends PromptCommandParseResult {
  value: string;
  cursorPosition: number;
  currentArgText: string;
  args: string[];
  replaceRange: {
    start: number;
    end: number;
  };
}

export interface PromptCommandCompletionContext {
  target: 'command' | 'argument';
  replaceRange: {
    start: number;
    end: number;
  };
  query: string;
  parseResult?: PromptCommandArgumentCompletionContext;
}

export interface PromptCommandLiveDiagnostic {
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface PromptCommandLiveDiagnosticContext extends PromptCommandParseResult {
  value: string;
  cursorPosition: number;
  target: 'command' | 'argument';
  query: string;
  args: string[];
  currentArgText: string | null;
  replaceRange: {
    start: number;
    end: number;
  };
}

export interface PromptCommandMatchedLiveContext extends PromptCommandParseResult {
  status: 'matched';
  target: 'command' | 'argument';
  token: string;
  tokenRange: {
    start: number;
    end: number;
  };
  replaceRange: {
    start: number;
    end: number;
  };
  query: string;
  usage?: string;
  args: string[];
  currentArgText: string | null;
  diagnostic?: PromptCommandLiveDiagnostic | null;
}

export interface PromptCommandUnresolvedLiveContext {
  status: 'unresolved';
  target: 'command';
  token: string;
  invocation: string;
  tokenRange: {
    start: number;
    end: number;
  };
  replaceRange: {
    start: number;
    end: number;
  };
  query: string;
}

export type PromptCommandLiveContext =
  | PromptCommandMatchedLiveContext
  | PromptCommandUnresolvedLiveContext;

export interface PromptCommandResolvedCompletion {
  context: PromptCommandCompletionContext;
  items: PromptCommandCompletion[];
}

export interface PromptCommandRegistry {
  getAll: () => PromptCommandDefinition[];
  complete: (query: string, maxResults?: number) => PromptCommandCompletion[];
  parse: (input: string) => PromptCommandParseResult | null;
  getCompletionContext: (
    value: string,
    cursorPosition: number
  ) => PromptCommandCompletionContext | null;
  inspectPrompt: (
    value: string,
    cursorPosition: number
  ) => PromptCommandLiveContext | null;
  resolvePromptCompletion: (
    value: string,
    cursorPosition: number,
    maxResults?: number
  ) => PromptCommandResolvedCompletion | null | Promise<PromptCommandResolvedCompletion | null>;
}

interface PromptCommandAnalysis {
  start: number;
  commandTokenStart: number;
  commandTokenEnd: number;
  commandToken: string;
  normalizedCommandToken: string;
  command?: PromptCommandDefinition;
  invocation: string;
  argsText: string;
  args: string[];
  target: 'command' | 'argument';
  query: string;
  replaceRange: {
    start: number;
    end: number;
  };
  currentArgText: string | null;
}

function normalizeCommandToken(token: string): string {
  return token.trim().replace(/^\/+/, '').toLowerCase();
}

function toPromptCommand(definition: PromptCommandDefinition): PromptCommandDefinition {
  return {
    ...definition,
    command: normalizeCommandToken(definition.command),
    aliases: [...new Set((definition.aliases ?? []).map((alias) => normalizeCommandToken(alias)).filter(Boolean))],
    tags: definition.tags ? [...definition.tags] : undefined,
  };
}

function toSearchCommand(definition: PromptCommandDefinition): Command {
  return {
    id: definition.id,
    label: definition.command,
    description: definition.description,
    tags: definition.aliases?.map((alias) => `/${alias}`).concat(definition.tags ?? []),
    action: () => {},
  };
}

function toPromptCommandCompletion(
  command: PromptCommandDefinition,
  score: number
): PromptCommandCompletion {
  return {
    id: command.id,
    label: `/${command.command}`,
    detail: command.description,
    replacement: `/${command.command}`,
    command,
    score,
  };
}

export function createPromptCommandRegistry(
  definitions: readonly PromptCommandDefinition[]
): PromptCommandRegistry {
  const commands = definitions.map((definition) => toPromptCommand(definition));
  const commandsByToken = new Map<string, PromptCommandDefinition>();
  const commandsById = new Map<string, PromptCommandDefinition>();

  for (const command of commands) {
    commandsById.set(command.id, command);
    commandsByToken.set(command.command, command);
    for (const alias of command.aliases ?? []) {
      commandsByToken.set(alias, command);
    }
  }

  const getLiveDiagnostic = (
    command: PromptCommandDefinition,
    context: PromptCommandLiveDiagnosticContext
  ): PromptCommandLiveDiagnostic | null => command.getLiveDiagnostic?.(context) ?? null;

  const analyzePrompt = (
    value: string,
    cursorPosition: number
  ): PromptCommandAnalysis | null => {
    const prefix = value.slice(0, cursorPosition);
    const match = prefix.match(/(?:^|\s)\/([^\s]*)(?:\s+(.*))?$/);
    if (!match || match.index === undefined) {
      return null;
    }

    const raw = match[0];
    const start = raw.startsWith(' ') ? match.index + 1 : match.index;
    const commandTokenStart = start + 1;
    const commandToken = value.slice(commandTokenStart).match(/^[^\s]*/)?.[0] ?? '';
    const commandTokenEnd = commandTokenStart + commandToken.length;
    const normalizedCommandToken = normalizeCommandToken(commandToken);
    const command = normalizedCommandToken
      ? commandsByToken.get(normalizedCommandToken)
      : undefined;
    const invocation = commandToken ? `/${commandToken}` : '/';

    if (match[2] === undefined) {
      return {
        start,
        commandTokenStart,
        commandTokenEnd,
        commandToken,
        normalizedCommandToken,
        command,
        invocation,
        argsText: value.slice(commandTokenEnd).trim(),
        args: value.slice(commandTokenEnd).trim().length > 0
          ? value.slice(commandTokenEnd).trim().split(/\s+/).filter(Boolean)
          : [],
        target: 'command',
        query: match[1] ?? '',
        replaceRange: {
          start,
          end: commandTokenEnd,
        },
        currentArgText: null,
      };
    }

    const argsStart = commandTokenEnd;
    const leadingWhitespace = value.slice(argsStart).match(/^\s*/)?.[0].length ?? 0;
    const argumentContentStart = argsStart + leadingWhitespace;
    const prefixArgumentText = value.slice(argumentContentStart, cursorPosition);
    const currentArgPrefixMatch = prefixArgumentText.match(/(?:^|\s)([^\s]*)$/);
    const currentArgQuery = currentArgPrefixMatch?.[1] ?? '';
    const currentArgStart = currentArgPrefixMatch && currentArgPrefixMatch.index !== undefined
      ? argumentContentStart
        + currentArgPrefixMatch.index
        + (currentArgPrefixMatch[0].startsWith(' ') ? 1 : 0)
      : cursorPosition;
    const currentArgEnd = cursorPosition + (value.slice(cursorPosition).match(/^[^\s]*/)?.[0].length ?? 0);
    const argsText = value.slice(argumentContentStart).trim();

    return {
      start,
      commandTokenStart,
      commandTokenEnd,
      commandToken,
      normalizedCommandToken,
      command,
      invocation,
      argsText,
      args: argsText.length > 0 ? argsText.split(/\s+/).filter(Boolean) : [],
      target: 'argument',
      query: currentArgQuery,
      replaceRange: {
        start: currentArgStart,
        end: currentArgEnd,
      },
      currentArgText: value.slice(currentArgStart, currentArgEnd),
    };
  };

  const completeCommands = (query: string, maxResults: number) =>
    searchCommands(commands.map((command) => toSearchCommand(command)), normalizeCommandToken(query), maxResults)
      .flatMap((result) => {
        const command = commandsById.get(result.command.id);
        if (!command) {
          return [];
        }

        return [toPromptCommandCompletion(command, result.score)];
      });

  const inspectPrompt = (
    value: string,
    cursorPosition: number
  ): PromptCommandLiveContext | null => {
    const analysis = analyzePrompt(value, cursorPosition);
    if (!analysis) {
      return null;
    }

    if (!analysis.command) {
      return {
        status: 'unresolved',
        target: 'command',
        token: analysis.commandToken,
        invocation: analysis.invocation,
        tokenRange: {
          start: analysis.commandTokenStart,
          end: analysis.commandTokenEnd,
        },
        replaceRange: analysis.replaceRange,
        query: analysis.query,
      };
    }

    if (analysis.target === 'command') {
      const diagnosticContext: PromptCommandLiveDiagnosticContext = {
        command: analysis.command,
        matchedToken: analysis.normalizedCommandToken,
        invocation: analysis.invocation,
        argsText: analysis.argsText,
        value,
        cursorPosition,
        target: 'command',
        query: analysis.query,
        args: analysis.args,
        currentArgText: null,
        replaceRange: analysis.replaceRange,
      };
      return {
        status: 'matched',
        target: 'command',
        command: analysis.command,
        matchedToken: analysis.normalizedCommandToken,
        invocation: analysis.invocation,
        argsText: analysis.argsText,
        token: analysis.commandToken,
        tokenRange: {
          start: analysis.commandTokenStart,
          end: analysis.commandTokenEnd,
        },
        replaceRange: analysis.replaceRange,
        query: analysis.query,
        usage: analysis.command.usage,
        args: analysis.args,
        currentArgText: null,
        diagnostic: getLiveDiagnostic(analysis.command, diagnosticContext),
      };
    }

    const diagnosticContext: PromptCommandLiveDiagnosticContext = {
      command: analysis.command,
      matchedToken: analysis.normalizedCommandToken,
      invocation: analysis.invocation,
      argsText: analysis.argsText,
      value,
      cursorPosition,
      target: 'argument',
      query: analysis.query,
      args: analysis.args,
      currentArgText: analysis.currentArgText,
      replaceRange: analysis.replaceRange,
    };

    return {
      status: 'matched',
      target: 'argument',
      command: analysis.command,
      matchedToken: analysis.normalizedCommandToken,
      invocation: analysis.invocation,
      argsText: analysis.argsText,
      token: analysis.commandToken,
      tokenRange: {
        start: analysis.commandTokenStart,
        end: analysis.commandTokenEnd,
      },
      replaceRange: analysis.replaceRange,
      query: analysis.query,
      usage: analysis.command.usage,
      args: analysis.args,
      currentArgText: analysis.currentArgText,
      diagnostic: getLiveDiagnostic(analysis.command, diagnosticContext),
    };
  };

  const getCompletionContext = (
    value: string,
    cursorPosition: number
  ): PromptCommandCompletionContext | null => {
    const analysis = analyzePrompt(value, cursorPosition);
    if (!analysis) {
      return null;
    }

    if (analysis.target === 'command' || !analysis.command) {
      return {
        target: 'command',
        replaceRange: analysis.replaceRange,
        query: analysis.query,
      };
    }

    return {
      target: 'argument',
      replaceRange: analysis.replaceRange,
      query: analysis.query,
      parseResult: {
        command: analysis.command,
        matchedToken: analysis.normalizedCommandToken,
        invocation: analysis.invocation,
        argsText: analysis.argsText,
        value,
        cursorPosition,
        currentArgText: analysis.currentArgText ?? '',
        args: analysis.args,
        replaceRange: analysis.replaceRange,
      },
    };
  };

  return {
    getAll: () => commands.map((command) => ({ ...command, aliases: command.aliases ? [...command.aliases] : undefined, tags: command.tags ? [...command.tags] : undefined })),
    complete: (query: string, maxResults = 20) => completeCommands(query, maxResults),
    parse: (input: string) => {
      const trimmed = input.trim();
      const analysis = analyzePrompt(trimmed, trimmed.length);
      if (!analysis?.command) {
        return null;
      }

      return {
        command: analysis.command,
        matchedToken: analysis.normalizedCommandToken,
        invocation: analysis.invocation,
        argsText: analysis.argsText,
      };
    },
    getCompletionContext,
    inspectPrompt,
    resolvePromptCompletion: async (value: string, cursorPosition: number, maxResults = 20) => {
      const context = getCompletionContext(value, cursorPosition);
      if (!context) {
        return null;
      }

      if (context.target === 'command') {
        return {
          context,
          items: completeCommands(context.query, maxResults),
        };
      }

      const parseResult = context.parseResult;
      if (!parseResult?.command.completeArgs) {
        return null;
      }

      const items = await Promise.resolve(parseResult.command.completeArgs(parseResult));
      return {
        context,
        items: items.map((item, index) => ({
          id: item.id,
          label: item.label,
          detail: item.detail,
          replacement: item.replacement,
          command: parseResult.command,
          score: Math.max(1, maxResults - index),
        })),
      };
    },
  };
}
