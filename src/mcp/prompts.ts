/**
 * Tuiuiu MCP Prompts
 *
 * Pre-defined prompt templates that help AI assistants create
 * Tuiuiu applications more effectively.
 */

// =============================================================================
// Types
// =============================================================================

export interface MCPPromptArgument {
  name: string;
  description: string;
  required: boolean;
}

export interface MCPPrompt {
  name: string;
  description: string;
  arguments?: MCPPromptArgument[];
}

export interface MCPPromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text';
    text: string;
  };
}

export interface MCPPromptResult {
  description: string;
  messages: MCPPromptMessage[];
}

// =============================================================================
// Prompt Definitions
// =============================================================================

export const prompts: MCPPrompt[] = [
  // ─────────────────────────────────────────────────────────────────────────────
  // Creation Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'create_dashboard',
    description: 'Create a terminal dashboard with metrics, charts, and status indicators. Generates a complete, runnable Tuiuiu application.',
    arguments: [
      {
        name: 'metrics',
        description: 'Comma-separated list of metrics to display (e.g., "cpu,memory,requests,errors")',
        required: true,
      },
      {
        name: 'style',
        description: 'Visual style: minimal, detailed, or gaming',
        required: false,
      },
    ],
  },
  {
    name: 'create_form',
    description: 'Create an interactive form with validation, inputs, selects, and submit handling.',
    arguments: [
      {
        name: 'fields',
        description: 'Comma-separated list of form fields (e.g., "name:text,email:email,role:select")',
        required: true,
      },
      {
        name: 'validation',
        description: 'Include field validation (yes/no)',
        required: false,
      },
    ],
  },
  {
    name: 'create_cli_app',
    description: 'Create a complete CLI application structure with commands, help, and configuration.',
    arguments: [
      {
        name: 'name',
        description: 'Application name',
        required: true,
      },
      {
        name: 'commands',
        description: 'Comma-separated list of commands (e.g., "init,build,deploy,status")',
        required: true,
      },
    ],
  },
  {
    name: 'create_file_browser',
    description: 'Create a file browser/explorer with navigation, preview, and actions.',
    arguments: [
      {
        name: 'features',
        description: 'Comma-separated features: preview, delete, rename, search, hidden',
        required: false,
      },
    ],
  },
  {
    name: 'create_data_table',
    description: 'Create an interactive data table with sorting, filtering, pagination, and row selection.',
    arguments: [
      {
        name: 'columns',
        description: 'Comma-separated column names (e.g., "id,name,status,created")',
        required: true,
      },
      {
        name: 'features',
        description: 'Comma-separated features: sort, filter, paginate, select, edit',
        required: false,
      },
    ],
  },
  {
    name: 'create_wizard',
    description: 'Create a multi-step wizard/onboarding flow with progress indicator.',
    arguments: [
      {
        name: 'steps',
        description: 'Comma-separated step names (e.g., "welcome,config,review,complete")',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Migration Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'migrate_from_ink',
    description: 'Migrate code from Ink (React-based terminal UI) to Tuiuiu. Converts JSX to function calls and React hooks to Tuiuiu equivalents.',
    arguments: [
      {
        name: 'code',
        description: 'The Ink/React code to migrate',
        required: true,
      },
    ],
  },
  {
    name: 'migrate_from_blessed',
    description: 'Migrate code from blessed/blessed-contrib to Tuiuiu. Converts imperative widget code to declarative Tuiuiu components.',
    arguments: [
      {
        name: 'code',
        description: 'The blessed code to migrate',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Debug & Optimization Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'debug_layout',
    description: 'Analyze and fix layout issues in Tuiuiu components. Identifies flexbox problems, sizing issues, and suggests fixes.',
    arguments: [
      {
        name: 'code',
        description: 'The Tuiuiu code with layout issues',
        required: true,
      },
      {
        name: 'issue',
        description: 'Description of the layout problem',
        required: false,
      },
    ],
  },
  {
    name: 'debug_signals',
    description: 'Debug reactivity issues with signals. Identifies missing dependencies, infinite loops, and stale closures.',
    arguments: [
      {
        name: 'code',
        description: 'The Tuiuiu code with signal issues',
        required: true,
      },
    ],
  },
  {
    name: 'optimize_performance',
    description: 'Analyze Tuiuiu code for performance issues and suggest optimizations. Covers memoization, batching, virtual scrolling, etc.',
    arguments: [
      {
        name: 'code',
        description: 'The Tuiuiu code to optimize',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Learning Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'explain_component',
    description: 'Get a detailed explanation of how a Tuiuiu component works, including internals and best practices.',
    arguments: [
      {
        name: 'component',
        description: 'Component name (e.g., "Box", "Select", "DataTable")',
        required: true,
      },
    ],
  },
  {
    name: 'compare_patterns',
    description: 'Compare different implementation patterns in Tuiuiu and recommend the best approach.',
    arguments: [
      {
        name: 'pattern',
        description: 'What you want to achieve (e.g., "state management", "form handling", "routing")',
        required: true,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Theme Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'create_theme',
    description: 'Create a custom Tuiuiu theme with your brand colors and style preferences.',
    arguments: [
      {
        name: 'primary_color',
        description: 'Primary brand color (hex or name)',
        required: true,
      },
      {
        name: 'style',
        description: 'Theme style: dark, light, high-contrast, or monochrome',
        required: false,
      },
      {
        name: 'name',
        description: 'Theme name',
        required: false,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────────
  // Game/Fun Prompts
  // ─────────────────────────────────────────────────────────────────────────────
  {
    name: 'create_game',
    description: 'Create a simple terminal game using Tuiuiu. Includes game loop, input handling, and rendering.',
    arguments: [
      {
        name: 'type',
        description: 'Game type: snake, tetris, pong, roguelike, or custom',
        required: true,
      },
    ],
  },
];

// =============================================================================
// Prompt Handlers
// =============================================================================

export function getPromptResult(
  name: string,
  args: Record<string, string>
): MCPPromptResult | null {
  switch (name) {
    case 'create_dashboard':
      return createDashboardPrompt(args);
    case 'create_form':
      return createFormPrompt(args);
    case 'create_cli_app':
      return createCliAppPrompt(args);
    case 'create_file_browser':
      return createFileBrowserPrompt(args);
    case 'create_data_table':
      return createDataTablePrompt(args);
    case 'create_wizard':
      return createWizardPrompt(args);
    case 'migrate_from_ink':
      return migrateFromInkPrompt(args);
    case 'migrate_from_blessed':
      return migrateFromBlessedPrompt(args);
    case 'debug_layout':
      return debugLayoutPrompt(args);
    case 'debug_signals':
      return debugSignalsPrompt(args);
    case 'optimize_performance':
      return optimizePerformancePrompt(args);
    case 'explain_component':
      return explainComponentPrompt(args);
    case 'compare_patterns':
      return comparePatternsPrompt(args);
    case 'create_theme':
      return createThemePrompt(args);
    case 'create_game':
      return createGamePrompt(args);
    default:
      return null;
  }
}

// =============================================================================
// Prompt Implementations
// =============================================================================

function createDashboardPrompt(args: Record<string, string>): MCPPromptResult {
  const metrics = args.metrics || 'cpu,memory,requests';
  const style = args.style || 'detailed';

  return {
    description: `Create a ${style} dashboard with metrics: ${metrics}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a Tuiuiu terminal dashboard application with the following requirements:

## Metrics to Display
${metrics.split(',').map(m => `- ${m.trim()}`).join('\n')}

## Style
${style === 'minimal' ? 'Clean, minimal design with just the essential information' :
  style === 'gaming' ? 'Game-like aesthetic with ASCII art, colors, and animations' :
  'Detailed dashboard with charts, borders, and comprehensive information'}

## Requirements
1. Use Box, Text, Sparkline/BarChart for data visualization
2. Include a header with title and timestamp
3. Add a status bar at the bottom with FPS and help hints
4. Use appropriate colors for each metric type
5. Handle keyboard input (q to quit, r to refresh)
6. Use useState/useEffect for data updates
7. Apply a theme (suggest dracula or tokyo-night for dark terminals)

## Structure
- Header component with logo/title
- Main content with metric cards arranged in a grid
- Charts for time-series data
- Status bar with controls

Please provide complete, runnable code.`,
        },
      },
    ],
  };
}

function createFormPrompt(args: Record<string, string>): MCPPromptResult {
  const fields = args.fields || 'name:text,email:email';
  const validation = args.validation !== 'no';

  const parsedFields = fields.split(',').map(f => {
    const [name, type] = f.split(':');
    return { name: name.trim(), type: type?.trim() || 'text' };
  });

  return {
    description: `Create a form with fields: ${parsedFields.map(f => f.name).join(', ')}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a Tuiuiu interactive form with the following fields:

## Fields
${parsedFields.map(f => `- **${f.name}**: ${f.type === 'select' ? 'Dropdown selection' : f.type === 'email' ? 'Email input with validation' : f.type === 'password' ? 'Password input (masked)' : 'Text input'}`).join('\n')}

## Requirements
1. Use TextInput for text fields
2. Use Select for dropdown fields
3. ${validation ? 'Include validation with error messages' : 'No validation needed'}
4. Tab/Shift+Tab to navigate between fields
5. Enter to submit when on last field or submit button
6. Show a confirmation after successful submission
7. Use useFocus for focus management
8. Style focused fields differently

## Components to Use
- Box for layout
- Text for labels
- TextInput for text/email/password
- Select for dropdowns
- Button for submit
- Badge for validation errors

Please provide complete, runnable code with proper focus handling.`,
        },
      },
    ],
  };
}

function createCliAppPrompt(args: Record<string, string>): MCPPromptResult {
  const name = args.name || 'mycli';
  const commands = args.commands || 'help,version';

  return {
    description: `Create CLI app "${name}" with commands: ${commands}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a complete Tuiuiu CLI application:

## App Name
${name}

## Commands
${commands.split(',').map(c => `- \`${c.trim()}\``).join('\n')}

## Requirements
1. Parse command-line arguments
2. Show help with available commands
3. Use CommandPalette for interactive command selection
4. Include version command
5. Proper exit codes
6. Loading spinners for async operations
7. Colored output for success/error states
8. Configuration file support (~/.${name}rc)

## Structure
- Main entry point with argument parsing
- Individual command handlers
- Shared utilities (config, output formatting)
- Error handling with helpful messages

## Features
- --help flag on all commands
- --version global flag
- Interactive mode when run without args
- Progress indicators for long operations

Please provide complete, runnable code with TypeScript types.`,
        },
      },
    ],
  };
}

function createFileBrowserPrompt(args: Record<string, string>): MCPPromptResult {
  const features = args.features || 'preview,search';

  return {
    description: `Create file browser with features: ${features}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a Tuiuiu file browser/explorer:

## Features
${features.split(',').map(f => `- ${f.trim()}`).join('\n')}

## Requirements
1. Use Tree component or custom list for file navigation
2. Display file icons based on type
3. Show file size, modified date in columns
4. Keyboard navigation (arrows, enter, backspace)
5. ${features.includes('preview') ? 'Preview panel for file contents' : ''}
6. ${features.includes('search') ? 'Fuzzy search with highlighting' : ''}
7. ${features.includes('delete') ? 'Delete with confirmation modal' : ''}
8. ${features.includes('hidden') ? 'Toggle hidden files (Ctrl+H)' : ''}
9. Path breadcrumb at top
10. Status bar showing selection info

## Components to Use
- SplitPanel for preview layout
- Tree or custom list for files
- Modal for confirmations
- TextInput for search
- CodeBlock for file preview

Please provide complete, runnable code.`,
        },
      },
    ],
  };
}

function createDataTablePrompt(args: Record<string, string>): MCPPromptResult {
  const columns = args.columns || 'id,name,status';
  const features = args.features || 'sort,filter';

  return {
    description: `Create data table with columns: ${columns}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a Tuiuiu interactive data table:

## Columns
${columns.split(',').map(c => `- ${c.trim()}`).join('\n')}

## Features
${features.split(',').map(f => `- ${f.trim()}`).join('\n')}

## Requirements
1. Use DataTable component or build custom table
2. ${features.includes('sort') ? 'Click column headers to sort (asc/desc/none)' : ''}
3. ${features.includes('filter') ? 'Filter input per column' : ''}
4. ${features.includes('paginate') ? 'Pagination with page size selector' : ''}
5. ${features.includes('select') ? 'Row selection with checkboxes, select all' : ''}
6. ${features.includes('edit') ? 'Inline editing on double-click' : ''}
7. Keyboard navigation (arrows, enter, space)
8. Status bar showing row count, selection count
9. Handle empty state gracefully

## Sample Data
Generate 20-50 rows of sample data for demonstration.

Please provide complete, runnable code.`,
        },
      },
    ],
  };
}

function createWizardPrompt(args: Record<string, string>): MCPPromptResult {
  const steps = args.steps || 'welcome,details,review,complete';

  return {
    description: `Create wizard with steps: ${steps}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a Tuiuiu multi-step wizard:

## Steps
${steps.split(',').map((s, i) => `${i + 1}. ${s.trim()}`).join('\n')}

## Requirements
1. Progress indicator showing current step
2. Next/Back buttons with keyboard shortcuts
3. Step validation before proceeding
4. Persist data across steps
5. Confirmation on final step
6. Cancel with confirmation modal
7. Animated transitions between steps
8. Summary of entered data on review step

## Components to Use
- Box for layout
- ProgressBar for step indicator
- Button for navigation
- Modal for cancel confirmation
- Form components as needed per step

Please provide complete, runnable code with smooth step transitions.`,
        },
      },
    ],
  };
}

function migrateFromInkPrompt(args: Record<string, string>): MCPPromptResult {
  const code = args.code || '// Paste your Ink code here';

  return {
    description: 'Migrate Ink code to Tuiuiu',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Migrate this Ink (React-based terminal UI) code to Tuiuiu:

\`\`\`tsx
${code}
\`\`\`

## Migration Guide
Apply these transformations:

### JSX to Function Calls
\`\`\`tsx
// Ink (JSX)
<Box flexDirection="column">
  <Text color="green">Hello</Text>
</Box>

// Tuiuiu (Function calls)
Box({ flexDirection: 'column' },
  Text({ color: 'green' }, 'Hello')
)
\`\`\`

### Hooks
| Ink | Tuiuiu |
|-----|--------|
| useState | useState (same) |
| useEffect | useEffect (same) |
| useInput | useInput (similar) |
| useApp | useApp (same) |
| useFocus | useFocus (same) |
| useStdin | Not needed |

### Components
| Ink | Tuiuiu |
|-----|--------|
| Box | Box |
| Text | Text |
| Newline | Newline |
| Spacer | Spacer |
| Transform | Not needed (use string manipulation) |

### Key Differences
1. No JSX - use function composition
2. Signals instead of React state (optional)
3. No \`<Static>\` - use renderOnce for static content
4. Different input event format

Please provide the migrated Tuiuiu code with explanations of changes.`,
        },
      },
    ],
  };
}

function migrateFromBlessedPrompt(args: Record<string, string>): MCPPromptResult {
  const code = args.code || '// Paste your blessed code here';

  return {
    description: 'Migrate blessed code to Tuiuiu',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Migrate this blessed/blessed-contrib code to Tuiuiu:

\`\`\`javascript
${code}
\`\`\`

## Migration Guide

### Paradigm Shift
Blessed is imperative (create widgets, update properties), Tuiuiu is declarative (describe UI, state drives updates).

### Screen → render()
\`\`\`javascript
// Blessed
const screen = blessed.screen({ smartCSR: true });
// ... create widgets
screen.render();

// Tuiuiu
const { waitUntilExit } = render(App);
await waitUntilExit();
\`\`\`

### Widgets → Components
| Blessed | Tuiuiu |
|---------|--------|
| box | Box |
| text | Text |
| list | Select or custom |
| table | Table or DataTable |
| textbox | TextInput |
| button | Button |
| checkbox | Checkbox |
| form | Box + form components |
| progressbar | ProgressBar |
| loading | Spinner |
| log | ScrollArea + Text |

### blessed-contrib → Tuiuiu
| contrib | Tuiuiu |
|---------|--------|
| line | LineChart |
| bar | BarChart |
| gauge | Gauge |
| sparkline | Sparkline |
| table | DataTable |
| tree | Tree |
| markdown | Markdown |

### Key Differences
1. Declarative vs imperative
2. State management with signals
3. Flexbox layout vs absolute positioning
4. Function composition vs object creation

Please provide the migrated Tuiuiu code with explanations.`,
        },
      },
    ],
  };
}

function debugLayoutPrompt(args: Record<string, string>): MCPPromptResult {
  const code = args.code || '// Paste your code here';
  const issue = args.issue || 'Unknown layout issue';

  return {
    description: 'Debug layout issues',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Debug this Tuiuiu layout issue:

## Issue Description
${issue}

## Code
\`\`\`typescript
${code}
\`\`\`

## Common Layout Issues to Check

### Flexbox Problems
1. Missing \`flexDirection\` (defaults to 'row')
2. \`flexGrow: 1\` without container height
3. Nested flex without proper sizing
4. \`alignItems\` vs \`justifyContent\` confusion

### Sizing Issues
1. \`width\`/\`height\` as string vs number
2. Percentage widths need parent size
3. \`minWidth\`/\`maxWidth\` conflicts
4. Content overflow without \`overflow: 'hidden'\`

### Border/Padding Problems
1. Borders add to element size
2. Padding inside borders
3. \`gap\` only works with flexbox

### Text Issues
1. Text wrapping without \`wrap\` prop
2. ANSI sequences affecting width calculation
3. Unicode characters width

## Debug Tools
\`\`\`typescript
// Add Debugger overlay
import { Debugger } from 'tuiuiu.js/dev-tools';
Box({ ... },
  Debugger({ showLayout: true }),
  // your content
)
\`\`\`

Please analyze the code and provide:
1. The root cause of the issue
2. Step-by-step fix
3. Best practices to prevent similar issues`,
        },
      },
    ],
  };
}

function debugSignalsPrompt(args: Record<string, string>): MCPPromptResult {
  const code = args.code || '// Paste your code here';

  return {
    description: 'Debug signal/reactivity issues',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Debug signal/reactivity issues in this Tuiuiu code:

\`\`\`typescript
${code}
\`\`\`

## Common Signal Issues

### Not Reactive
\`\`\`typescript
// WRONG - value captured, not reactive
const [count] = useState(0);
const doubled = count * 2; // static!

// RIGHT - use createMemo or call in render
const doubled = createMemo(() => count() * 2);
// or
Text({}, \`Doubled: \${count() * 2}\`)
\`\`\`

### Infinite Loops
\`\`\`typescript
// WRONG - effect triggers itself
createEffect(() => {
  setCount(count() + 1); // infinite loop!
});

// RIGHT - use conditions or separate signals
createEffect(() => {
  if (count() < 10) setCount(count() + 1);
});
\`\`\`

### Stale Closures
\`\`\`typescript
// WRONG - closure captures stale value
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count); // always initial value!
  }, 1000);
});

// RIGHT - access signal in callback
useEffect(() => {
  const interval = setInterval(() => {
    console.log(count()); // current value
  }, 1000);
});
\`\`\`

### Missing Dependencies
\`\`\`typescript
// Effects auto-track, but be aware of conditional access
createEffect(() => {
  if (showDetails()) {
    // 'details' only tracked when showDetails is true
    console.log(details());
  }
});
\`\`\`

Please analyze and provide:
1. Identified reactivity issues
2. Fixed code
3. Explanation of the fix`,
        },
      },
    ],
  };
}

function optimizePerformancePrompt(args: Record<string, string>): MCPPromptResult {
  const code = args.code || '// Paste your code here';

  return {
    description: 'Optimize Tuiuiu performance',
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Optimize this Tuiuiu code for performance:

\`\`\`typescript
${code}
\`\`\`

## Optimization Checklist

### Signal Optimization
- [ ] Use \`createMemo\` for derived values
- [ ] Batch multiple signal updates
- [ ] Avoid creating signals in render functions

### Rendering Optimization
- [ ] Use \`When\` instead of ternary for conditional rendering
- [ ] Use \`Each\` with keys for lists
- [ ] Avoid inline object creation for styles
- [ ] Use \`renderOnce\` for static content

### Large Data
- [ ] Virtual scrolling for long lists (ScrollArea)
- [ ] Pagination for tables
- [ ] Lazy loading of heavy components

### Animation
- [ ] Use \`tick\` system instead of setInterval
- [ ] Spring animations with reasonable stiffness
- [ ] Avoid animating every frame if not visible

### Memory
- [ ] Cleanup effects properly
- [ ] Unsubscribe from stores
- [ ] Clear intervals/timeouts

## Example Optimizations
\`\`\`typescript
// SLOW - recreates array every render
Each(data.filter(x => x.active).map(x => x.name), ...)

// FAST - memoize the computation
const activeNames = createMemo(() =>
  data().filter(x => x.active).map(x => x.name)
);
Each(activeNames(), ...)
\`\`\`

Please analyze and provide:
1. Performance bottlenecks found
2. Optimized code
3. Expected improvement`,
        },
      },
    ],
  };
}

function explainComponentPrompt(args: Record<string, string>): MCPPromptResult {
  const component = args.component || 'Box';

  return {
    description: `Explain ${component} component in depth`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Explain the Tuiuiu **${component}** component in detail.

Please cover:

1. **Purpose & Use Cases**
   - What problem does it solve?
   - When should I use it vs alternatives?

2. **API Reference**
   - All props with types and defaults
   - Return value/behavior

3. **Internal Implementation**
   - How does it work under the hood?
   - Key algorithms or patterns used

4. **Best Practices**
   - Recommended usage patterns
   - Common mistakes to avoid
   - Performance considerations

5. **Examples**
   - Basic usage
   - Advanced/complex usage
   - Integration with other components

6. **Related Components**
   - Similar components
   - Components often used together

Use \`tuiuiu_get_component\` tool first to get the documentation, then expand with implementation details and advanced examples.`,
        },
      },
    ],
  };
}

function comparePatternsPrompt(args: Record<string, string>): MCPPromptResult {
  const pattern = args.pattern || 'state management';

  return {
    description: `Compare patterns for: ${pattern}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Compare different approaches for "${pattern}" in Tuiuiu:

## Analysis Required

1. **Available Options**
   List all ways to achieve this in Tuiuiu

2. **Comparison Matrix**
   | Approach | Complexity | Performance | Use Case |
   |----------|------------|-------------|----------|
   | ... | ... | ... | ... |

3. **Code Examples**
   Show each approach with equivalent functionality

4. **Recommendation**
   - Best for simple cases
   - Best for complex cases
   - When to use each

5. **Migration Path**
   How to switch between approaches if needs change

Focus on practical, real-world considerations.`,
        },
      },
    ],
  };
}

function createThemePrompt(args: Record<string, string>): MCPPromptResult {
  const primaryColor = args.primary_color || '#6366f1';
  const style = args.style || 'dark';
  const name = args.name || 'custom';

  return {
    description: `Create ${name} theme with primary color ${primaryColor}`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a custom Tuiuiu theme:

## Requirements
- **Name**: ${name}
- **Primary Color**: ${primaryColor}
- **Style**: ${style}

## Theme Structure
\`\`\`typescript
import { createTheme, generateColorScale } from 'tuiuiu.js';

const ${name}Theme = createTheme({
  name: '${name}',

  // Generate full color scale from primary
  palette: {
    primary: generateColorScale('${primaryColor}'),
    // ... other colors
  },

  // Background hierarchy
  background: {
    base: '${style === 'dark' ? '#0a0a0a' : '#ffffff'}',
    surface: '...',
    elevated: '...',
    overlay: '...',
  },

  // Foreground hierarchy
  foreground: {
    base: '${style === 'dark' ? '#fafafa' : '#0a0a0a'}',
    muted: '...',
    subtle: '...',
  },

  // Semantic colors
  accents: {
    positive: '...',
    negative: '...',
    warning: '...',
    info: '...',
  },

  // Component tokens (optional overrides)
  components: {
    button: { ... },
    input: { ... },
  },
});
\`\`\`

Please generate a complete, harmonious theme with:
1. Full color palette (22 colors × 11 shades)
2. Proper contrast ratios for accessibility
3. Semantic color assignments
4. Component token overrides if needed
5. Usage example

Use \`tuiuiu_create_theme\` tool for detailed theme API reference.`,
        },
      },
    ],
  };
}

function createGamePrompt(args: Record<string, string>): MCPPromptResult {
  const type = args.type || 'snake';

  const gameRequirements: Record<string, string> = {
    snake: `
- Grid-based movement
- Food spawning
- Collision detection (walls, self)
- Score tracking
- Speed increase with score
- Game over state with restart`,
    tetris: `
- 7 tetromino pieces
- Rotation with wall kicks
- Line clearing with animation
- Next piece preview
- Score/level system
- Increasing speed`,
    pong: `
- Paddle movement
- Ball physics (angle based on hit position)
- Score tracking
- AI opponent (optional)
- Serve mechanic`,
    roguelike: `
- Procedural dungeon generation
- Player movement (@)
- Enemies with basic AI
- Items/pickups
- FOV/visibility
- Turn-based or real-time`,
    custom: `
- Define your own game mechanics
- Input handling
- Game state management
- Rendering loop`,
  };

  return {
    description: `Create a ${type} game`,
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Create a terminal ${type.toUpperCase()} game using Tuiuiu:

## Game Type: ${type}

## Requirements
${gameRequirements[type] || gameRequirements.custom}

## Technical Implementation

### Game Loop
\`\`\`typescript
import { render, Box, Text, useState, useEffect, useInput, useTick } from 'tuiuiu.js';

function Game() {
  const [gameState, setGameState] = useState<GameState>(initialState);

  // Game tick (60 FPS)
  useTick((delta) => {
    setGameState(state => updateGame(state, delta));
  });

  // Input handling
  useInput((input, key) => {
    setGameState(state => handleInput(state, key));
  });

  return Box({ flexDirection: 'column' },
    // Render game board
    renderBoard(gameState()),
    // Render UI (score, etc)
    renderUI(gameState()),
  );
}
\`\`\`

### Rendering
- Use Box with grid layout or character-based rendering
- Use colors for different game elements
- Consider using Canvas for complex graphics

### State Management
- Immutable game state
- Pure update functions
- Separate input handling from game logic

Please provide:
1. Complete, runnable game code
2. Clear separation of concerns
3. Proper game states (menu, playing, paused, game over)
4. Score persistence (optional)`,
        },
      },
    ],
  };
}
