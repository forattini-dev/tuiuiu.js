/**
 * Small, zero-dependency argument parser used by the CLI wizard example.
 *
 * It intentionally covers the contracts demonstrated by the example:
 * nested commands, global and command options, short flags, choices,
 * array values, positional arguments, defaults, contextual help, and
 * asynchronous handlers.
 */

export type Formatter = Record<string, (value: string) => string>;

type OptionType = 'string' | 'boolean' | 'array';

export interface OptionDefinition {
  type: OptionType;
  short?: string;
  description?: string;
  default?: unknown;
  choices?: readonly string[];
}

export interface PositionalDefinition {
  name: string;
  description?: string;
  required?: boolean;
}

export interface CLIResult {
  options: Record<string, unknown>;
  positional: Record<string, string>;
  commandPath: string[];
}

export interface CommandDefinition {
  description?: string;
  options?: Record<string, OptionDefinition>;
  positional?: PositionalDefinition[];
  commands?: Record<string, CommandDefinition>;
  handler?: (result: CLIResult) => void | Promise<void>;
}

export interface CLIConfig extends CommandDefinition {
  name: string;
  version?: string;
  formatter?: Formatter;
  autoShort?: boolean;
}

interface ResolvedCommand {
  definition: CommandDefinition;
  path: string[];
  consumed: number;
}

function format(config: CLIConfig, token: string, value: string): string {
  return config.formatter?.[token]?.(value) ?? value;
}

function optionValue(
  name: string,
  definition: OptionDefinition,
  rawValue: string | undefined
): unknown {
  if (definition.type === 'boolean') {
    if (rawValue === undefined) return true;
    if (rawValue === 'true') return true;
    if (rawValue === 'false') return false;
    throw new Error(`Option --${name} expects true or false`);
  }

  if (rawValue === undefined) {
    throw new Error(`Option --${name} expects a value`);
  }

  if (definition.choices && !definition.choices.includes(rawValue)) {
    throw new Error(
      `Invalid value for --${name}: ${rawValue}. Expected one of: ${definition.choices.join(', ')}`
    );
  }

  return definition.type === 'array'
    ? rawValue.split(',').map((value) => value.trim()).filter(Boolean)
    : rawValue;
}

function resolveCommand(config: CLIConfig, args: string[]): ResolvedCommand {
  let commands = config.commands;
  let definition: CommandDefinition = config;
  const path: string[] = [];
  let consumed = 0;

  while (commands && consumed < args.length) {
    const candidate = args[consumed];
    if (!candidate || candidate.startsWith('-')) break;

    const next = commands[candidate];
    if (!next) break;

    path.push(candidate);
    definition = next;
    commands = next.commands;
    consumed += 1;
  }

  if (
    config.commands &&
    path.length === 0 &&
    args[0] &&
    !args[0].startsWith('-')
  ) {
    throw new Error(`Unknown command: ${args[0]}`);
  }

  return { definition, path, consumed };
}

function collectOptions(
  config: CLIConfig,
  command: CommandDefinition
): Record<string, OptionDefinition> {
  return {
    ...(config.options ?? {}),
    ...(command === config ? {} : command.options ?? {}),
  };
}

function buildShortOptions(
  definitions: Record<string, OptionDefinition>,
  autoShort: boolean
): Map<string, string> {
  const aliases = new Map<string, string>();

  for (const [name, definition] of Object.entries(definitions)) {
    const explicit = definition.short?.replace(/^-/, '');
    if (explicit) aliases.set(explicit, name);
  }

  if (autoShort) {
    for (const name of Object.keys(definitions)) {
      const alias = name[0];
      if (alias && !aliases.has(alias)) aliases.set(alias, name);
    }
  }

  aliases.set('h', 'help');
  return aliases;
}

function parseArguments(
  config: CLIConfig,
  resolved: ResolvedCommand,
  args: string[]
): CLIResult {
  const definitions = collectOptions(config, resolved.definition);
  const aliases = buildShortOptions(definitions, config.autoShort ?? false);
  const options: Record<string, unknown> = {};
  const positionalValues: string[] = [];

  for (const [name, definition] of Object.entries(definitions)) {
    if (definition.default !== undefined) options[name] = definition.default;
  }

  for (let index = resolved.consumed; index < args.length; index += 1) {
    const token = args[index]!;

    if (token === '--') {
      positionalValues.push(...args.slice(index + 1));
      break;
    }

    if (token === '--help' || token === '-h') {
      options.help = true;
      continue;
    }

    if (token.startsWith('--')) {
      const equalsIndex = token.indexOf('=');
      const rawName = token.slice(2, equalsIndex === -1 ? undefined : equalsIndex);
      const negated = rawName.startsWith('no-');
      const name = negated ? rawName.slice(3) : rawName;
      const definition = definitions[name];

      if (!definition) throw new Error(`Unknown option: --${rawName}`);
      if (negated && definition.type !== 'boolean') {
        throw new Error(`Only boolean options support --no-${name}`);
      }

      let rawValue = equalsIndex === -1 ? undefined : token.slice(equalsIndex + 1);
      if (
        !negated &&
        rawValue === undefined &&
        definition.type !== 'boolean'
      ) {
        rawValue = args[++index];
      }

      options[name] = negated
        ? false
        : optionValue(name, definition, rawValue);
      continue;
    }

    if (token.startsWith('-') && token !== '-') {
      const short = token.slice(1);
      const name = aliases.get(short);
      if (!name || name === 'help') throw new Error(`Unknown option: -${short}`);

      const definition = definitions[name]!;
      const rawValue = definition.type === 'boolean' ? undefined : args[++index];
      options[name] = optionValue(name, definition, rawValue);
      continue;
    }

    positionalValues.push(token);
  }

  const positional: Record<string, string> = {};
  for (const [index, definition] of (resolved.definition.positional ?? []).entries()) {
    const value = positionalValues[index];
    if (value !== undefined) positional[definition.name] = value;
    if (definition.required && value === undefined) {
      throw new Error(`Missing required argument: ${definition.name}`);
    }
  }

  if (positionalValues.length > (resolved.definition.positional?.length ?? 0)) {
    throw new Error(`Unexpected argument: ${positionalValues[resolved.definition.positional?.length ?? 0]}`);
  }

  return { options, positional, commandPath: resolved.path };
}

function resolveHelpCommand(
  config: CLIConfig,
  commandPath: string[]
): CommandDefinition {
  let command: CommandDefinition = config;

  for (const segment of commandPath) {
    const next = command.commands?.[segment];
    if (!next) throw new Error(`Unknown command: ${commandPath.join(' ')}`);
    command = next;
  }

  return command;
}

function renderOptions(
  config: CLIConfig,
  definitions: Record<string, OptionDefinition>,
  tokenPrefix: 'option' | 'global-option'
): string[] {
  return Object.entries(definitions).map(([name, definition]) => {
    const short = definition.short ? `-${definition.short}, ` : '    ';
    const type = definition.type === 'boolean' ? '' : ` <${definition.type}>`;
    const defaultValue = definition.default === undefined
      ? ''
      : ` (default: ${String(definition.default)})`;
    const flag = format(config, `${tokenPrefix}-flag`, `${short}--${name}`);
    const renderedType = format(config, `${tokenPrefix}-type`, type);
    const renderedDefault = format(config, `${tokenPrefix}-default`, defaultValue);
    return `  ${flag}${renderedType.padEnd(Math.max(1, 22 - name.length))}${definition.description ?? ''}${renderedDefault}`;
  });
}

function renderHelp(config: CLIConfig, commandPath: string[]): string {
  const command = resolveHelpCommand(config, commandPath);
  const usagePath = [config.name, ...commandPath].join(' ');
  const lines = [
    `${format(config, 'program-name', config.name)} ${format(config, 'version', config.version ?? '')}`.trimEnd(),
    format(config, 'description', command.description ?? config.description ?? ''),
    '',
    format(config, 'section-header', 'Usage'),
    `  ${usagePath}${command.commands ? ' <command>' : ''}${command.positional?.map((item) => item.required ? ` <${item.name}>` : ` [${item.name}]`).join('') ?? ''} [options]`,
  ];

  if (command.commands) {
    lines.push('', format(config, 'section-header', 'Commands'));
    for (const [name, child] of Object.entries(command.commands)) {
      lines.push(
        `  ${format(config, 'command-name', name).padEnd(20)}${format(config, 'command-description', child.description ?? '')}`
      );
    }
  }

  if (command.positional?.length) {
    lines.push('', format(config, 'section-header', 'Arguments'));
    for (const positional of command.positional) {
      lines.push(
        `  ${format(config, 'positional-name', positional.name).padEnd(20)}${positional.description ?? ''}`
      );
    }
  }

  if (command.options && command !== config) {
    lines.push(
      '',
      format(config, 'section-header', 'Options'),
      ...renderOptions(config, command.options, 'option')
    );
  }

  if (config.options) {
    lines.push(
      '',
      format(config, 'section-header', 'Global options'),
      ...renderOptions(config, config.options, 'global-option')
    );
  }

  lines.push('  -h, --help          Show contextual help');
  return lines.join('\n');
}

export function createCLI(config: CLIConfig) {
  return {
    help(commandPath: string[] = []): string {
      return renderHelp(config, commandPath);
    },

    async run(args: string[]): Promise<void> {
      const resolved = resolveCommand(config, args);
      const result = parseArguments(config, resolved, args);

      if (result.options.help) {
        console.log(renderHelp(config, resolved.path));
        return;
      }

      if (!resolved.definition.handler) {
        if (resolved.definition.commands) {
          throw new Error(`Missing command. Run ${config.name} ${resolved.path.join(' ')} --help`);
        }
        throw new Error(`No handler configured for ${[config.name, ...resolved.path].join(' ')}`);
      }

      await resolved.definition.handler(result);
    },
  };
}
