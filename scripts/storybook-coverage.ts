import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

type StoryCategory = 'Primitives' | 'Atoms' | 'Molecules' | 'Organisms' | 'Templates';

interface StoryBlock {
  category: StoryCategory;
  fullName: string;
  prefix: string;
  hasControls: boolean;
  description: string;
}

interface CoverageSection {
  heading: StoryCategory;
  rows: string[];
}

interface CoverageResult {
  content: string;
  unresolved: string[];
}

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const coveragePath = path.join(rootDir, 'docs', 'core', 'storybook-coverage.md');

const storySources: Record<StoryCategory, string> = {
  Primitives: path.join(rootDir, 'src', 'storybook', 'stories', 'primitives', 'index.ts'),
  Atoms: path.join(rootDir, 'src', 'storybook', 'stories', 'atoms', 'index.ts'),
  Molecules: path.join(rootDir, 'src', 'storybook', 'stories', 'molecules', 'index.ts'),
  Organisms: path.join(rootDir, 'src', 'storybook', 'stories', 'organisms', 'index.ts'),
  Templates: path.join(rootDir, 'src', 'storybook', 'stories', 'templates', 'index.ts'),
};

const extraRows: Partial<Record<StoryCategory, string[]>> = {
  Atoms: ['DataRow', 'ListItem', 'HttpStatus'],
  Molecules: ['Waveform'],
  Organisms: ['ScrollPanel'],
  Templates: ['Screen', 'Main', 'Footer', 'Sidebar', 'Panel'],
};

const aliasMap: Record<string, string[]> = {
  'Molecules::AutocompleteInput': ['AutocompleteInput + Suggestions'],
  'Molecules::AutocompleteSuggestions': ['AutocompleteInput + Suggestions'],
};

const explicitNotes: Record<string, string> = {
  'Primitives::Spacer (primitives)': 'No public props; spacing is layout-driven and not controllable.',
  'Primitives::Fragment': 'No public props; child grouping is not controllable.',
  'Atoms::MultiProgressBar': 'Segment arrays are not controllable; use code examples for segment composition.',
  'Atoms::ColoredPicture': 'Pixel grid data is not controllable; use code examples for color maps.',
  'Molecules::Checkbox': 'Item arrays and selection callbacks are not controllable.',
  'Molecules::AutocompleteInput': 'Covered by the shared `AutocompleteInput + Suggestions` story; the shared state factory is not controllable.',
  'Molecules::AutocompleteSuggestions': 'Covered by the shared `AutocompleteInput + Suggestions` story; the shared state factory is not controllable.',
  'Molecules::SimpleTable': 'Headers, rows, and alignment arrays are not controllable.',
  'Molecules::KeyValueTable': 'Entry objects are not controllable.',
  'Molecules::VerticalTabs': 'Tab definition arrays are not controllable.',
  'Molecules::LazyTabs': 'Lazy content factories are not controllable.',
  'Molecules::InlineCode': 'Inline code content is fixed to preserve surrounding layout context; use code examples for alternate snippets.',
  'Molecules::Collapsible': 'Expanded content children are not controllable.',
  'Molecules::Accordion': 'Section arrays and section content are not controllable.',
  'Molecules::Details': 'Child content is not controllable.',
  'Molecules::ExpandableText': 'Long-form text content is not controllable.',
  'Molecules::StackedBarChart': 'Series segment data is not controllable.',
  'Molecules::LineChart': 'Series arrays are not controllable.',
  'Molecules::AreaChart': 'Series data is not controllable.',
  'Molecules::RadarChart': 'Axis and series arrays are not controllable.',
  'Molecules::ContributionGraph': 'Contribution datasets are not controllable.',
  'Molecules::CalendarHeatmap': 'Contribution datasets are not controllable.',
  'Molecules::CorrelationMatrix': 'Matrix inputs are not controllable.',
  'Molecules::GanttChart': 'Task collections are not controllable.',
  'Molecules::TimeHeatmap': 'Heatmap datasets are not controllable.',
  'Molecules::Legend': 'Legend item arrays are not controllable.',
  'Molecules::TuiuiuSplash': 'Preset art and branding are fixed; only preset behavior is demonstrated.',
  'Molecules::ImpactSplashScreen': 'Preset art composition is not controllable.',
  'Molecules::MinimalSplash': 'Preset layout composition is not controllable.',
  'Molecules::ProgressSplash': 'Preset layout composition is not controllable.',
  'Organisms::OverlayContainer': 'Overlay stack entries are not controllable.',
  'Organisms::Grid': 'Named area definitions are not controllable.',
  'Organisms::GridItem': 'Span/layout placement is not controllable.',
  'Organisms::GridRow': 'Column content arrays are not controllable.',
  'Organisms::GridColumn': 'Row content arrays are not controllable.',
  'Organisms::AutoGrid': 'Responsive item arrays are not controllable.',
  'Organisms::DashboardGrid': 'Dashboard widget arrays are not controllable.',
  'Organisms::MasonryGrid': 'Masonry card arrays are not controllable.',
  'Organisms::EditableDataTable':
    'Inline editing is interactive; callback results are not persisted by the static story.',
  'Organisms::FileDirectoryTree': 'File tree datasets are not controllable.',
  'Organisms::FileList': 'File item datasets are not controllable.',
  'Organisms::PathBreadcrumbs': 'Path segments are not controllable.',
  'Organisms::FileDetails': 'File metadata objects are not controllable.',
  'Organisms::FilePreview': 'File content and preview buffers are not controllable.',
  'Organisms::FileIcon': 'File metadata objects are not controllable.',
  'Organisms::DirectoryIndicator': 'Expanded/collapsed states are shown side by side instead of a live control.',
  'Templates::Spacer (templates)': 'No public props; spacing is layout-driven and not controllable.',
};

const coverageHeader = [
  '# Storybook Coverage Checklist',
  '',
  'This checklist tracks Storybook coverage for every exported UI component.',
  '',
  'Legend:',
  '- Story: at least one story exists',
  '- Controls: story exposes all public props or documents non-controllable ones',
  '',
  'Notes:',
  '- Callback handlers, render children, and state factories are not controllable in storybook and require code examples.',
  '- This file is generated from the story catalog. Run `pnpm storybook:coverage` after changing story metadata.',
  '',
].join('\n');

function parseStoryBlocks(): StoryBlock[] {
  const blocks: StoryBlock[] = [];

  for (const [category, sourcePath] of Object.entries(storySources) as Array<[StoryCategory, string]>) {
    const text = readFileSync(sourcePath, 'utf8');
    const storyPattern =
      /story\('([^']+)'\)([\s\S]*?)(?=\n\s*story\('|(?:\n|\r\n)\s*];|(?:\n|\r\n)export const [^=]+= \[|(?:\n|\r\n)\/\/ ============================================================================|$)/g;

    for (const match of text.matchAll(storyPattern)) {
      const fullName = match[1] ?? '';
      const block = match[2] ?? '';
      const descriptionMatch = block.match(/\.description\((['"`])([\s\S]*?)\1\)/);

      blocks.push({
        category,
        fullName,
        prefix: fullName.includes(' - ') ? fullName.split(' - ')[0] : fullName,
        hasControls: block.includes('.controls('),
        description: descriptionMatch?.[2] ?? '',
      });
    }
  }

  return blocks;
}

function parseCoverageSections(): CoverageSection[] {
  const content = readFileSync(coveragePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const sections: CoverageSection[] = [];
  let current: CoverageSection | null = null;

  for (const line of lines) {
    const headingMatch = line.match(/^##\s+(Primitives|Atoms|Molecules|Organisms|Templates)$/);
    if (headingMatch) {
      current = { heading: headingMatch[1] as StoryCategory, rows: [] };
      sections.push(current);
      continue;
    }

    const rowMatch = line.match(/^\|\s*([^|]+?)\s*\|\s*\[[x ]\]\s*\|\s*\[[x ]\]\s*\|/i);
    if (rowMatch && current && rowMatch[1] !== 'Component') {
      current.rows.push(rowMatch[1].trim());
    }
  }

  for (const section of sections) {
    for (const row of extraRows[section.heading] ?? []) {
      if (!section.rows.includes(row)) {
        section.rows.push(row);
      }
    }
  }

  return sections;
}

function normalizeComponentName(component: string): string {
  return component.replace(/ \([^)]*\)$/, '');
}

function getAliases(category: StoryCategory, component: string): string[] {
  const key = `${category}::${component}`;
  return aliasMap[key] ?? [normalizeComponentName(component)];
}

function getDocumentedNote(key: string, stories: StoryBlock[]): string {
  const storyNote = stories.find((story) => /not controllable|non-controllable/i.test(story.description));
  return storyNote?.description ?? explicitNotes[key] ?? '';
}

function buildTableRow(
  category: StoryCategory,
  component: string,
  stories: StoryBlock[]
): { line: string; unresolved: string | null } {
  const key = `${category}::${component}`;
  const note = getDocumentedNote(key, stories);
  const hasStory = stories.length > 0;
  const hasControls = hasStory && (stories.some((story) => story.hasControls) || note.length > 0);
  const escapedNote = note.replace(/\|/g, '\\|');
  const line = `| ${component} | ${hasStory ? '[x]' : '[ ]'} | ${hasControls ? '[x]' : '[ ]'} | ${escapedNote} |`;

  if (!hasStory || !hasControls) {
    return { line, unresolved: `${key} -> story=${hasStory} controls=${hasControls}` };
  }

  return { line, unresolved: null };
}

export function buildStorybookCoverageDocument(): CoverageResult {
  const storyBlocks = parseStoryBlocks();
  const sections = parseCoverageSections();
  const unresolved: string[] = [];
  const parts: string[] = [coverageHeader];

  for (const section of sections) {
    parts.push(`## ${section.heading}`);
    parts.push('');
    parts.push('| Component | Story | Controls | Notes |');
    parts.push('| --- | --- | --- | --- |');

    for (const component of section.rows) {
      const aliases = getAliases(section.heading, component);
      const stories = storyBlocks.filter(
        (story) => story.category === section.heading && aliases.includes(story.fullName || story.prefix) || story.category === section.heading && aliases.includes(story.prefix)
      );
      const { line, unresolved: issue } = buildTableRow(section.heading, component, stories);
      parts.push(line);
      if (issue) {
        unresolved.push(issue);
      }
    }

    parts.push('');
  }

  return {
    content: `${parts.join('\n').trimEnd()}\n`,
    unresolved,
  };
}

export function writeStorybookCoverageDocument(): CoverageResult {
  const result = buildStorybookCoverageDocument();
  writeFileSync(coveragePath, result.content, 'utf8');
  return result;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const mode = process.argv[2] ?? 'check';
  const result = mode === 'write' ? writeStorybookCoverageDocument() : buildStorybookCoverageDocument();
  const current = readFileSync(coveragePath, 'utf8');

  if (result.unresolved.length > 0) {
    console.error('[storybook:coverage] Missing coverage entries:');
    for (const issue of result.unresolved) {
      console.error(`- ${issue}`);
    }
    process.exit(1);
  }

  if (mode === 'check' && current !== result.content) {
    console.error('[storybook:coverage] docs/core/storybook-coverage.md is out of date. Run `pnpm storybook:coverage`.');
    process.exit(1);
  }

  if (mode === 'write') {
    console.log('[storybook:coverage] updated docs/core/storybook-coverage.md');
  } else {
    console.log('[storybook:coverage] OK');
  }
}
