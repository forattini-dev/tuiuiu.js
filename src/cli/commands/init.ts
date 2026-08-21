import {
  access,
  mkdir,
  readdir,
  writeFile,
} from 'node:fs/promises';
import path from 'node:path';
import { getVersion } from '../../version.js';

export interface InitCommandOptions {
  directory: string;
  help: boolean;
}

export interface ScaffoldProjectOptions extends InitCommandOptions {
  cwd?: string;
  version?: string;
}

const INIT_HELP = `
Usage:
  tuiuiu init [directory]

Options:
  --help, -h  Show this command help

The target must not contain existing project files. The command never installs
dependencies or overwrites a non-empty directory.
`.trim();

export function showInitHelp(): void {
  console.log(INIT_HELP);
}

export function parseInitArgs(args: string[]): InitCommandOptions {
  let directory: string | undefined;
  let help = false;

  for (const argument of args) {
    if (argument === '--help' || argument === '-h') {
      help = true;
      continue;
    }
    if (argument.startsWith('-')) {
      throw new Error(`Unknown init option: ${argument}`);
    }
    if (directory) {
      throw new Error('The init command accepts only one target directory');
    }
    directory = argument;
  }

  return {
    directory: directory ?? 'tuiuiu-app',
    help,
  };
}

function packageNameFromDirectory(directory: string): string {
  const candidate = path.basename(path.resolve(directory))
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^[._-]+|[._-]+$/g, '');
  return candidate || 'tuiuiu-app';
}

async function pathExists(target: string): Promise<boolean> {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function createPackageJson(name: string, version: string): string {
  return `${JSON.stringify({
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'tsx src/index.ts',
      build: 'tsc',
      start: 'node dist/index.js',
    },
    engines: {
      node: '>=22.12',
    },
    dependencies: {
      'tuiuiu.js': `^${version}`,
    },
    devDependencies: {
      '@types/node': '^25.0.3',
      tsx: '^4.23.1',
      typescript: '^5.9.3',
    },
  }, null, 2)}\n`;
}

function createTsConfig(): string {
  const compilerOptions: Record<string, unknown> = {
    target: 'ES2022',
    module: 'NodeNext',
    moduleResolution: 'NodeNext',
    outDir: 'dist',
    rootDir: 'src',
    strict: true,
    skipLibCheck: true,
  };
  return `${JSON.stringify({
    compilerOptions,
    include: ['src/**/*.ts'],
  }, null, 2)}\n`;
}

function createEntrySource(): string {
  return `import {
  Box,
  Text,
  render,
  useApp,
  useShortcut,
} from 'tuiuiu.js';

function App() {
  const app = useApp();
  useShortcut('q', () => app.exit());

  return Box(
    { flexDirection: 'column', padding: 1, borderStyle: 'round' },
    Text({ bold: true, color: 'cyan' }, 'Hello from Tuiuiu'),
    Text({ dim: true }, 'Press q to exit.'),
  );
}

const tui = render(App, { screen: 'inline' });
await tui.waitUntilExit();
`;
}

function createReadme(name: string): string {
  return `# ${name}

Minimal Tuiuiu terminal application using the functional component API.

\`\`\`sh
pnpm install
pnpm dev
\`\`\`

Press \`q\` to exit.
`;
}

export async function scaffoldProject(options: ScaffoldProjectOptions): Promise<string> {
  const cwd = options.cwd ?? process.cwd();
  const target = path.resolve(cwd, options.directory);
  const version = options.version ?? await getVersion();

  if (await pathExists(target)) {
    const existingEntries = await readdir(target);
    const projectEntries = existingEntries.filter((entry) => entry !== '.git');
    if (projectEntries.length > 0) {
      throw new Error(`Refusing to overwrite non-empty directory: ${target}`);
    }
  }

  const name = packageNameFromDirectory(target);
  const files = new Map<string, string>([
    ['package.json', createPackageJson(name, version)],
    ['tsconfig.json', createTsConfig()],
    ['.gitignore', 'node_modules/\ndist/\n'],
    ['README.md', createReadme(name)],
    [path.join('src', 'index.ts'), createEntrySource()],
  ]);

  for (const relativePath of files.keys()) {
    if (await pathExists(path.join(target, relativePath))) {
      throw new Error(`Refusing to overwrite existing file: ${path.join(target, relativePath)}`);
    }
  }

  await mkdir(path.join(target, 'src'), { recursive: true });
  for (const [relativePath, content] of files) {
    await writeFile(path.join(target, relativePath), content, {
      encoding: 'utf8',
      flag: 'wx',
    });
  }

  return target;
}

export async function runInitCommand(args: string[]): Promise<void> {
  const options = parseInitArgs(args);
  if (options.help) {
    showInitHelp();
    return;
  }

  const target = await scaffoldProject(options);
  const relativeTarget = path.relative(process.cwd(), target) || '.';
  console.log(`Created Tuiuiu app in ${relativeTarget}`);
  console.log(`Next: cd ${relativeTarget} && pnpm install && pnpm dev`);
}
