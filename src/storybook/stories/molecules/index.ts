/**
 * Molecules Stories
 *
 * Molecules are simple combinations of atoms that form functional units:
 * - Utility components (When, Each, Fragment)
 * - Form controls (TextInput, Checkbox, RadioGroup, Select)
 * - ProgressBar: Task progress indicator
 * - Alert: Status messages
 * - Toast: Notification popups
 * - Tabs: Tab navigation
 * - Sparkline & Gauge: Simple data visualizations
 * - Advanced Charts: LineChart, ScatterPlot, RadarChart, GanttChart, TimeHeatmap, Legend
 */

import { Box, Text, When, Each, Fragment, Spacer, Newline } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import {
  TextInput,
  Checkbox,
  Select,
  RadioGroup,
  ToggleGroup
} from '../../../design-system/forms/index.js';
import {
  Collapsible,
  Accordion,
  Details,
  ExpandableText,
  createCollapsible,
  createAccordion,
} from '../../../molecules/collapsible.js';
import { ProgressBar } from '../../../design-system/feedback/index.js';
import {
  LineChart,
  ScatterPlot,
  RadarChart,
  GanttChart,
  TimeHeatmap,
  Legend,
} from '../../../molecules/data-viz/index.js';
import { story, defaultControls } from '../../core/registry.js';
import { getTheme, getContrastColor } from '../../../core/theme.js';
import type { Story } from '../../types.js';

// Chart helpers
const sparklineChars = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

function textSparkline(data: number[]): string {
  if (data.length === 0) return '';
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  return data.map((v) => {
    const idx = Math.floor(((v - min) / range) * 7);
    return sparklineChars[idx];
  }).join('');
}

function textProgressBar(
  value: number,
  max: number,
  width: number,
  filled: string = '█',
  empty: string = '░'
): string {
  const filledWidth = Math.round((value / max) * width);
  return filled.repeat(filledWidth) + empty.repeat(width - filledWidth);
}

/**
 * Utility components stories (When, Each, Fragment)
 */
export const utilityStories: Story[] = [
  story('When - Conditional')
    .category('Molecules')
    .description('Conditional rendering with When')
    .controls({
      show: defaultControls.boolean('Show Content', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Text({}, 'Always visible'),
        When(props.show, Text({ color: 'success' }, 'Conditionally visible')),
        Text({}, 'Also always visible')
      )
    ),

  story('Each - List Rendering')
    .category('Molecules')
    .description('Render lists with Each')
    .controls({
      count: defaultControls.range('Item Count', 5, 1, 10),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Each(
          Array.from({ length: props.count }, (_, i) => `Item ${i + 1}`),
          (item, index) =>
            Box(
              {},
              Text({ color: index % 2 === 0 ? 'primary' : 'mutedForeground' }, `${index + 1}. ${item}`)
            )
        )
      )
    ),

  story('Fragment - Grouping')
    .category('Molecules')
    .description('Group elements without wrapper')
    .render(() =>
      Box(
        { flexDirection: 'column' },
        Text({}, 'Before fragment'),
        Fragment(
          Text({ color: 'primary' }, 'Inside fragment 1'),
          Text({ color: 'success' }, 'Inside fragment 2'),
          Text({ color: 'warning' }, 'Inside fragment 3')
        ),
        Text({}, 'After fragment')
      )
    ),
];

/**
 * TextInput component stories
 */
export const textInputStories: Story[] = [
  story('TextInput - Basic')
    .category('Molecules')
    .description('Basic text input field')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'Hello, World!'),
      placeholder: defaultControls.text('Placeholder', 'Enter text...'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        placeholder: props.placeholder,
        onChange: (val: string) => console.log('Input changed:', val),
        onSubmit: (val: string) => console.log('Input submitted:', val),
      })
    ),

  story('TextInput - Password')
    .category('Molecules')
    .description('Password input with masked characters')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'secret'),
      maskChar: defaultControls.text('Mask Char', '*'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        password: true,
        maskChar: props.maskChar,
        onChange: (val: string) => console.log('Password changed:', val),
      })
    ),

  story('TextInput - Multi-line')
    .category('Molecules')
    .description('Multi-line text input (Shift+Enter for newline)')
    .controls({
      initialValue: defaultControls.text('Initial Value', 'Line 1\nLine 2'),
    })
    .render((props) =>
      TextInput({
        initialValue: props.initialValue,
        multiline: true,
        onChange: (val: string) => console.log('Multi-line changed:', val),
      })
    ),

  story('TextInput - With Label')
    .category('Molecules')
    .description('TextInput with label and full-width')
    .controls({
      label: defaultControls.text('Label', 'Username:'),
      initialValue: defaultControls.text('Initial Value', 'john_doe'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'primary' }, props.label),
        TextInput({
          initialValue: props.initialValue,
          fullWidth: true,
          onChange: (val: string) => console.log('Input changed:', val),
        })
      )
    ),
];

/**
 * Checkbox stories
 */
export const checkboxStories: Story[] = [
  story('Checkbox - Basic')
    .category('Molecules')
    .description('Basic interactive checkbox')
    .controls({
      label: defaultControls.text('Label', 'Accept terms'),
    })
    .render((props) =>
      Checkbox({
        items: [{ label: props.label, value: 'accept', description: 'Click me!' }],
        onChange: (val) => console.log('Checkbox changed:', val),
        showCount: false,
        searchable: false,
        cursorIndicator: ' ', // Hide cursor for simple checkbox feel
      })
    ),

  story('Checkbox - List')
    .category('Molecules')
    .description('Multiple checkboxes in a list')
    .render(() => 
      Checkbox({
        items: [
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3', disabled: true },
          { label: 'Option 4', value: '4' },
        ],
        initialValue: ['1', '3'],
        onChange: (vals) => console.log('Selected:', vals),
        showCount: true,
        searchable: false,
      })
    ),
];

/**
 * RadioGroup stories
 */
export const radioStories: Story[] = [
  story('RadioGroup - Basic')
    .category('Molecules')
    .description('Basic radio button group')
    .render(() => 
      RadioGroup({
        options: [
          { value: '1', label: 'Option 1' },
          { value: '2', label: 'Option 2' },
          { value: '3', label: 'Option 3' },
        ],
        initialValue: '1',
        onChange: (val) => console.log('Radio changed:', val),
      })
    ),

  story('RadioGroup - Horizontal')
    .category('Molecules')
    .description('Radio buttons in horizontal layout')
    .render(() => 
      RadioGroup({
        direction: 'horizontal',
        gap: 2,
        options: [
          { value: 'xs', label: 'XS' },
          { value: 'sm', label: 'SM' },
          { value: 'md', label: 'MD' },
          { value: 'lg', label: 'LG' },
          { value: 'xl', label: 'XL' },
        ],
        initialValue: 'md',
      })
    ),
];

/**
 * Select component stories
 */
export const selectStories: Story[] = [
  story('Select - Basic')
    .category('Molecules')
    .description('Basic dropdown selection')
    .render(() => 
      Select({
        items: [
          { label: 'Option 1', value: '1' },
          { label: 'Option 2', value: '2' },
          { label: 'Option 3', value: '3' },
          { label: 'Option 4', value: '4' },
        ],
        searchable: true,
      })
    ),

  story('Select - With Categories')
    .category('Molecules')
    .description('Select with grouped options')
    .render(() => 
      Select({
        items: [
          { label: 'Apple', value: 'apple', group: 'Fruits' },
          { label: 'Banana', value: 'banana', group: 'Fruits' },
          { label: 'Carrot', value: 'carrot', group: 'Vegetables' },
          { label: 'Broccoli', value: 'broccoli', group: 'Vegetables' },
        ],
        initialValue: 'apple',
      })
    ),

  story('Select - Multi-Select')
    .category('Molecules')
    .description('Select multiple items')
    .render(() => 
      Select({
        multiple: true,
        items: [
          { label: 'JavaScript', value: 'js' },
          { label: 'TypeScript', value: 'ts' },
          { label: 'Python', value: 'py' },
          { label: 'Rust', value: 'rs' },
          { label: 'Go', value: 'go' },
        ],
        initialValue: ['js', 'ts', 'go'],
      })
    ),
];

/**
 * ProgressBar stories
 */
export const progressBarStories: Story[] = [
  story('ProgressBar - Basic')
    .category('Molecules')
    .description('Basic progress bar')
    .controls({
      value: defaultControls.range('Progress', 65, 0, 100),
      width: defaultControls.range('Width', 30, 15, 50),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'primary' }, textProgressBar(props.value, 100, props.width)),
        Text({ color: 'primary' }, `${props.value}%`)
      )
    ),

  story('ProgressBar - Colors')
    .category('Molecules')
    .description('Progress bar with custom colors')
    .controls({
      value: defaultControls.range('Progress', 75, 0, 100),
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: props.color }, textProgressBar(props.value, 100, 30)),
        Text({ color: props.color }, `${props.value}%`)
      )
    ),

  story('ProgressBar - With Label')
    .category('Molecules')
    .description('Progress bar with label')
    .controls({
      value: defaultControls.range('Progress', 42, 0, 100),
      showLabel: defaultControls.boolean('Show Label', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'Progress:'),
          Text({ color: 'primary' }, textProgressBar(props.value, 100, 25)),
          props.showLabel ? Text({ color: 'primary' }, `${props.value}%`) : null
        )
      )
    ),

  story('ProgressBar - Multiple')
    .category('Molecules')
    .description('Multiple progress bars')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 12 }, Text({ color: 'mutedForeground' }, 'Downloading:')),
          Text({ color: 'accent' }, textProgressBar(75, 100, 20)),
          Text({ color: 'accent' }, '75%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 12 }, Text({ color: 'mutedForeground' }, 'Installing:')),
          Text({ color: 'success' }, textProgressBar(45, 100, 20)),
          Text({ color: 'success' }, '45%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 12 }, Text({ color: 'mutedForeground' }, 'Configuring:')),
          Text({ color: 'warning' }, textProgressBar(10, 100, 20)),
          Text({ color: 'warning' }, '10%')
        )
      )
    ),

  story('ProgressBar - Indeterminate Styles')
    .category('Molecules')
    .description('Different indeterminate loading styles')
    .controls({
      style: defaultControls.select('Style', ['classic', 'marquee', 'fill-and-clear'], 'marquee'),
      fillStep: defaultControls.range('Fill Step', 1, 1, 5),
      width: defaultControls.range('Width', 30, 10, 50),
    })
    .animated(50)
    .render((props, frame = 0) => {
      // Simulate indeterminate animation logic for story preview
      const { style, fillStep, width } = props;
      let barContent = '';
      
      const t = Math.floor(Date.now() / 50); // Use real time or frame for consistency
      
      if (style === 'marquee') {
        const blockWidth = Math.max(3, Math.floor(width * 0.25));
        const totalWidth = width + blockWidth;
        const pos = Math.floor(frame / 1.5) % totalWidth; // Slow down a bit
        
        const start = Math.max(0, pos - blockWidth);
        const end = Math.min(width, pos);
        const length = Math.max(0, end - start);
        const emptyLeft = Math.max(0, start);
        const emptyRight = Math.max(0, width - end);
        
        barContent = '░'.repeat(emptyLeft) + '█'.repeat(length) + '░'.repeat(emptyRight);
      } else if (style === 'fill-and-clear') {
        const totalSteps = Math.ceil(width / fillStep);
        const rawCycle = Math.floor(frame) % ((totalSteps * 2) + 4);
        const effectiveCycle = rawCycle * fillStep;
        
        if (rawCycle < totalSteps) {
           const filledLen = Math.min(width, effectiveCycle);
           barContent = '█'.repeat(filledLen) + '░'.repeat(width - filledLen);
        } else {
           const emptyLeftLen = Math.min(width, effectiveCycle - width);
           const filledLen = Math.max(0, width - emptyLeftLen);
           barContent = '░'.repeat(emptyLeftLen) + '█'.repeat(filledLen);
        }
      } else {
        // Classic
        const frames = ['[    ]', '[=   ]', '[==  ]', '[=== ]', '[ ===]', '[  ==]', '[   =]', '[    ]'];
        barContent = frames[frame % frames.length].padEnd(width, ' ');
      }

      return Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, barContent),
          Text({ color: 'mutedForeground' }, style)
        ),
        style === 'fill-and-clear' ? Text({ color: 'mutedForeground', dim: true }, `Step: ${fillStep}`) : null
      );
    }),

  story('ProgressBar - Thresholds')
    .category('Molecules')
    .description('Progress bar with color thresholds')
    .controls({
      value: defaultControls.range('Value', 80, 0, 100),
    })
    .render((props) => {
      const color = props.value > 80 ? 'red' : props.value > 60 ? 'yellow' : 'green';
      const status = props.value > 80 ? 'Critical!' : props.value > 60 ? 'Warning' : 'Normal';

      return Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'Memory:'),
          Text({ color }, textProgressBar(props.value, 100, 25)),
          Text({ color }, `${props.value}%`)
        ),
        Text({ color, dim: true }, status)
      );
    }),
];

/**
 * Alert stories
 */
export const alertStories: Story[] = [
  story('Alert - Info')
    .category('Molecules')
    .description('Information alert')
    .controls({
      message: defaultControls.text('Message', 'This is an informational message.'),
    })
    .render((props) =>
      Box(
        {
          borderStyle: 'single',
          borderColor: 'accent',
          padding: 1,
          width: 50,
        },
        Text({ color: 'accent' }, 'ℹ '),
        Text({ color: 'foreground' }, props.message)
      )
    ),

  story('Alert - Success')
    .category('Molecules')
    .description('Success alert')
    .render(() => {
      return Box(
        {
          borderStyle: 'round',
          borderColor: 'success',
          backgroundColor: 'success',
          padding: 1,
          width: 50,
        },
        Text({ color: 'successForeground', bold: true }, '✓ Operation completed successfully!')
      );
    }),

  story('Alert - Warning')
    .category('Molecules')
    .description('Warning alert')
    .render(() =>
      Box(
        {
          borderStyle: 'single',
          borderColor: 'warning',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'warning', bold: true }, '⚠ Warning')
          ),
          Text({ color: 'warning' }, 'This action may have unintended consequences.')
        )
      )
    ),

  story('Alert - Error')
    .category('Molecules')
    .description('Error alert')
    .render(() =>
      Box(
        {
          borderStyle: 'bold',
          borderColor: 'destructive',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'destructive', bold: true }, '✗ Error')
          ),
          Text({ color: 'destructive' }, 'Failed to complete the operation.'),
          Text({ color: 'mutedForeground', dim: true }, 'Error code: E_CONNECTION_TIMEOUT')
        )
      )
    ),

  story('Alert - Dismissible')
    .category('Molecules')
    .description('Alert with dismiss action')
    .render(() =>
      Box(
        {
          borderStyle: 'single',
          borderColor: 'primary',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'row', justifyContent: 'space-between' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'primary' }, 'ℹ'),
            Text({ color: 'foreground' }, 'New updates available.')
          ),
          Text({ color: 'mutedForeground' }, '[x]')
        )
      )
    ),
];

/**
 * Toast notification stories
 */
export const toastStories: Story[] = [
  story('Toast - Stack')
    .category('Molecules')
    .description('Stack of toast notifications')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, alignItems: 'flex-end', width: 50 },
        Box(
          {
            borderStyle: 'round',
            borderColor: 'success',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'success' }, '✓ File saved successfully')
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'accent',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'accent' }, 'ℹ 3 new messages')
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'warning',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'warning' }, '⚠ Low disk space')
        )
      )
    ),

  story('Toast - With Actions')
    .category('Molecules')
    .description('Toast with action buttons')
    .render(() =>
      Box(
        {
          borderStyle: 'single',
          borderColor: 'primary',
          padding: 1,
          width: 45,
        },
        Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'foreground' }, 'New version available (v2.0.0)'),
          Box(
            { flexDirection: 'row', gap: 2 },
            Text({ color: 'primary', inverse: true }, ' Update '),
            Text({ color: 'mutedForeground' }, 'Dismiss')
          )
        )
      )
    ),
];

/**
 * Tabs stories
 */
export const tabsStories: Story[] = [
  story('Tabs - Basic')
    .category('Molecules')
    .description('Basic tabbed interface')
    .controls({
      activeTab: defaultControls.range('Active Tab', 0, 0, 2),
    })
    .render((props) => {
      const tabs = ['Overview', 'Details', 'Settings'];

      return Box(
        { width: 50, flexDirection: 'column' },
        Box(
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'border' },
          ...tabs.map((tab, idx) => {
            const isActive = idx === props.activeTab;
            return Box(
              {
                paddingX: 2,
                backgroundColor: isActive ? 'primary' : undefined,
              },
              Text(
                {
                  color: isActive ? 'white' : 'mutedForeground',
                  bold: isActive,
                },
                tab
              )
            );
          })
        ),
        Box(
          { borderStyle: 'single', borderColor: 'accent', padding: 1, height: 5 },
          Text({}, `${tabs[props.activeTab]} content here...`)
        )
      );
    }),

  story('Tabs - With Icons')
    .category('Molecules')
    .description('Tabs with icons')
    .render(() => {
      return Box(
        { width: 50, flexDirection: 'column' },
        Box(
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'border' },
          Box(
            { paddingX: 2, backgroundColor: 'primary' },
            Text({ color: 'primaryForeground', bold: true }, '🏠 Home')
          ),
          Box({ paddingX: 2 }, Text({ color: 'mutedForeground' }, '📁 Files')),
          Box({ paddingX: 2 }, Text({ color: 'mutedForeground' }, '⚙️ Settings'))
        ),
        Box(
          { borderStyle: 'single', borderColor: 'accent', padding: 1, height: 5 },
          Text({}, 'Home content')
        )
      );
    }),

  story('Tabs - Styled')
    .category('Molecules')
    .description('Tabs with custom styling')
    .controls({
      activeColor: defaultControls.color('Active Color', 'cyan'),
    })
    .render((props) =>
      Box(
        { width: 50, flexDirection: 'column' },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: props.activeColor, inverse: true }, ' Tab 1 '),
          Text({ color: 'mutedForeground' }, 'Tab 2'),
          Text({ color: 'mutedForeground' }, 'Tab 3')
        ),
        Box(
          { borderStyle: 'single', borderColor: props.activeColor, padding: 1, marginTop: 1 },
          Text({}, 'Content 1')
        )
      )
    ),

  story('Tabs - Variants')
    .category('Molecules')
    .description('Tabs with semantic variants from theme')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 2 },
        Text({ bold: true }, 'Primary Variant:'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary', inverse: true }, ' Active '),
          Text({ color: 'mutedForeground' }, 'Inactive'),
        ),
        Text({ bold: true }, 'Secondary Variant:'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'secondary', inverse: true }, ' Active '),
          Text({ color: 'mutedForeground' }, 'Inactive'),
        ),
        Text({ dim: true }, 'Note: Tabs component inherits colors from theme.components.tabs'),
      )
    ),
];

/**
 * Collapsible stories
 */
export const collapsibleStories: Story[] = [
  story('Collapsible - Basic')
    .category('Molecules')
    .description('Basic expandable section')
    .render(() =>
      Collapsible({
        title: 'Advanced Options',
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({}, 'Option 1: Enable auto-save'),
          Text({}, 'Option 2: Show notifications'),
          Text({}, 'Option 3: Dark mode'),
        ),
      })
    ),

  story('Collapsible - Custom Icons')
    .category('Molecules')
    .description('Collapsible with folder icons')
    .render(() =>
      Collapsible({
        title: 'Project Files',
        collapsedIcon: '📁',
        expandedIcon: '📂',
        initialExpanded: true,
        children: Box(
          { flexDirection: 'column' },
          Text({ color: 'primary' }, '  📄 index.ts'),
          Text({ color: 'primary' }, '  📄 package.json'),
          Text({ color: 'primary' }, '  📄 README.md'),
        ),
      })
    ),

  story('Collapsible - Nested')
    .category('Molecules')
    .description('Nested collapsible sections')
    .render(() =>
      Collapsible({
        title: 'Category A',
        initialExpanded: true,
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Collapsible({
            title: 'Subcategory A.1',
            indent: 4,
            children: Text({}, 'Content A.1'),
          }),
          Collapsible({
            title: 'Subcategory A.2',
            indent: 4,
            children: Text({}, 'Content A.2'),
          }),
        ),
      })
    ),

  story('Collapsible - Disabled')
    .category('Molecules')
    .description('Disabled collapsible section')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Collapsible({
          title: 'Available Section',
          children: Text({}, 'This section is interactive'),
        }),
        Collapsible({
          title: 'Locked Section (Premium)',
          disabled: true,
          children: Text({}, 'This content is locked'),
        }),
      )
    ),

  story('Collapsible - Interactive')
    .category('Molecules')
    .description('Collapsible with selectable variant and custom color')
    .controls({
      title: defaultControls.text('Title', 'Settings'),
      variant: defaultControls.select('Variant', ['default', 'primary', 'secondary'], 'default'),
      customColor: defaultControls.color('Custom Color', ''),
      disabled: defaultControls.boolean('Disabled', false),
    })
    .render((props) =>
      Collapsible({
        title: props.title,
        variant: props.customColor ? undefined : props.variant,
        color: props.customColor || undefined,
        disabled: props.disabled,
        children: Box(
          { flexDirection: 'column', gap: 1 },
          Text({}, 'Content line 1'),
          Text({}, 'Content line 2'),
          Text({}, 'Content line 3'),
        ),
      })
    ),

  story('Collapsible - All Variants')
    .category('Molecules')
    .description('Collapsible sections showing all semantic variants')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Collapsible({
          title: 'Default Variant',
          variant: 'default',
          children: Text({}, 'Default styling from theme'),
        }),
        Collapsible({
          title: 'Primary Variant',
          variant: 'primary',
          children: Text({}, 'Primary accent styling'),
        }),
        Collapsible({
          title: 'Secondary Variant',
          variant: 'secondary',
          children: Text({}, 'Secondary/muted styling'),
        }),
      )
    ),

  story('Collapsible - Custom Colors')
    .category('Molecules')
    .description('Collapsible with custom header colors')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Collapsible({
          title: 'Cyan Header',
          color: 'cyan',
          children: Text({}, 'Custom cyan header with auto-contrast text'),
        }),
        Collapsible({
          title: 'Magenta Header',
          color: 'magenta',
          children: Text({}, 'Custom magenta header'),
        }),
        Collapsible({
          title: 'Orange Header',
          color: '#ff6600',
          children: Text({}, 'Custom hex color header'),
        }),
      )
    ),
];

/**
 * Accordion stories
 */
export const accordionStories: Story[] = [
  story('Accordion - Basic')
    .category('Molecules')
    .description('Basic accordion with single open section')
    .render(() =>
      Accordion({
        sections: [
          { key: 'general', title: 'General Settings', content: Text({}, 'General settings content here...') },
          { key: 'appearance', title: 'Appearance', content: Text({}, 'Theme, colors, fonts...') },
          { key: 'advanced', title: 'Advanced', content: Text({}, 'Developer options...') },
        ],
        initialExpanded: 'general',
      })
    ),

  story('Accordion - Multiple Open')
    .category('Molecules')
    .description('Accordion allowing multiple sections open')
    .render(() =>
      Accordion({
        sections: [
          { key: 'frontend', title: '1. Frontend', content: Text({}, 'React, Vue, Angular...') },
          { key: 'backend', title: '2. Backend', content: Text({}, 'Node, Python, Go...') },
          { key: 'database', title: '3. Database', content: Text({}, 'PostgreSQL, MongoDB...') },
        ],
        multiple: true,
        gap: 1,
      })
    ),

  story('Accordion - With Icons')
    .category('Molecules')
    .description('Accordion sections with custom icons')
    .render(() =>
      Accordion({
        sections: [
          { key: 'home', title: 'Home', icon: '🏠', content: Text({}, 'Welcome to the app!') },
          { key: 'settings', title: 'Settings', icon: '⚙️', content: Text({}, 'Configure your preferences') },
          { key: 'help', title: 'Help', icon: '❓', content: Text({}, 'Get support and documentation') },
        ],
      })
    ),

  story('Accordion - FAQ')
    .category('Molecules')
    .description('FAQ-style accordion')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ bold: true, color: 'primary' }, 'Frequently Asked Questions'),
        Divider({}),
        Accordion({
          sections: [
            { key: 'q1', title: 'How do I install?', content: Text({ color: 'mutedForeground' }, 'Run: pnpm add tuiuiu.js') },
            { key: 'q2', title: 'Is it zero-dependency?', content: Text({ color: 'mutedForeground' }, 'Yes! No external dependencies.') },
            { key: 'q3', title: 'Does it support themes?', content: Text({ color: 'mutedForeground' }, '8+ built-in themes available.') },
          ],
          gap: 1,
        }),
      )
    ),

  story('Accordion - Disabled Sections')
    .category('Molecules')
    .description('Accordion with some disabled sections')
    .render(() =>
      Accordion({
        sections: [
          { key: 'free', title: 'Free Plan', content: Text({}, 'Basic features included') },
          { key: 'pro', title: 'Pro Plan (Locked)', disabled: true, content: Text({}, 'Pro features') },
          { key: 'enterprise', title: 'Enterprise (Locked)', disabled: true, content: Text({}, 'Enterprise features') },
        ],
      })
    ),

  story('Accordion - Variants')
    .category('Molecules')
    .description('Accordion with semantic variants')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 2 },
        Text({ bold: true }, 'Primary Variant:'),
        Accordion({
          variant: 'primary',
          sections: [
            { key: 'a', title: 'Section A', content: Text({}, 'Primary variant styling') },
            { key: 'b', title: 'Section B', content: Text({}, 'Consistent accent colors') },
          ],
        }),
        Text({ bold: true }, 'Secondary Variant:'),
        Accordion({
          variant: 'secondary',
          sections: [
            { key: 'a', title: 'Section A', content: Text({}, 'Secondary/muted styling') },
            { key: 'b', title: 'Section B', content: Text({}, 'Subtle appearance') },
          ],
        }),
      )
    ),
];

/**
 * Details stories
 */
export const detailsStories: Story[] = [
  story('Details - Basic')
    .category('Molecules')
    .description('Simple details element like HTML')
    .render(() =>
      Details({
        summary: 'Click to see more',
        children: Text({}, 'Additional information that was hidden.'),
      })
    ),

  story('Details - Error Log')
    .category('Molecules')
    .description('Details for showing error stack')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'destructive', bold: true }, '✗ Build failed'),
        Details({
          summary: 'View error details',
          open: true,
          children: Box(
            { flexDirection: 'column' },
            Text({ color: 'destructive' }, 'Error: Module not found'),
            Text({ color: 'mutedForeground', dim: true }, '  at compile (build.ts:45)'),
            Text({ color: 'mutedForeground', dim: true }, '  at run (main.ts:12)'),
          ),
        }),
      )
    ),
];

/**
 * ExpandableText stories
 */
export const expandableTextStories: Story[] = [
  story('ExpandableText - Basic')
    .category('Molecules')
    .description('Long text with show more/less')
    .render(() =>
      ExpandableText({
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.\nSed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\nUt enim ad minim veniam, quis nostrud exercitation.\nDuis aute irure dolor in reprehenderit.\nExcepteur sint occaecat cupidatat non proident.',
        maxLines: 2,
      })
    ),

  story('ExpandableText - Custom Labels')
    .category('Molecules')
    .description('Expandable text with custom labels')
    .render(() =>
      ExpandableText({
        text: 'This is a very long description that spans multiple lines.\nIt contains important information about the feature.\nUsers can expand it to read the full content.\nOr collapse it to save space.',
        maxLines: 2,
        showMoreLabel: 'Read full description...',
        showLessLabel: 'Collapse',
        color: 'mutedForeground',
      })
    ),
];

/**
 * Sparkline stories
 */
export const sparklineStories: Story[] = [
  story('Sparkline - Basic')
    .category('Molecules')
    .description('Inline sparkline chart using block characters')
    .render(() => {
      const data = [5, 10, 8, 15, 12, 18, 14, 22, 19, 25];
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'mutedForeground' }, 'Trend:'),
        Text({ color: 'primary' }, textSparkline(data))
      );
    }),

  story('Sparkline - Colors')
    .category('Molecules')
    .description('Sparklines with different colors')
    .controls({
      color: defaultControls.color('Color', 'green'),
    })
    .render((props) => {
      const data = [3, 7, 4, 9, 6, 8, 5, 10, 7, 12];
      return Box(
        { flexDirection: 'row', gap: 1 },
        Text({ color: 'mutedForeground' }, 'Data:'),
        Text({ color: props.color }, textSparkline(data))
      );
    }),

  story('Sparkline - Multiple')
    .category('Molecules')
    .description('Multiple sparklines for comparison')
    .render(() => {
      const revenue = [30, 45, 38, 52, 48, 55, 60, 58, 65, 70];
      const costs = [25, 28, 32, 30, 35, 38, 40, 42, 45, 48];
      const profit = [5, 17, 6, 22, 13, 17, 20, 16, 20, 22];

      return Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 10 }, Text({ color: 'mutedForeground' }, 'Revenue:')),
          Text({ color: 'success' }, textSparkline(revenue))
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 10 }, Text({ color: 'mutedForeground' }, 'Costs:')),
          Text({ color: 'destructive' }, textSparkline(costs))
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 10 }, Text({ color: 'mutedForeground' }, 'Profit:')),
          Text({ color: 'primary' }, textSparkline(profit))
        )
      );
    }),
];

/**
 * Gauge stories
 */
export const gaugeStories: Story[] = [
  story('Gauge - Linear')
    .category('Molecules')
    .description('Linear gauge indicator')
    .controls({
      value: defaultControls.range('Value', 65, 0, 100),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: 'mutedForeground' }, 'Progress'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'primary' }, textProgressBar(props.value, 100, 30)),
          Text({ color: 'primary' }, `${props.value}%`)
        )
      )
    ),

  story('Gauge - Thresholds')
    .category('Molecules')
    .description('Gauge with color thresholds')
    .controls({
      value: defaultControls.range('Value', 80, 0, 100),
    })
    .render((props) => {
      const color =
        props.value > 80 ? 'red' :
        props.value > 60 ? 'yellow' :
        'green';

      const status =
        props.value > 80 ? 'Critical!' :
        props.value > 60 ? 'Warning' :
        'Normal';

      return Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'mutedForeground' }, 'Memory:'),
          Text({ color }, textProgressBar(props.value, 100, 25)),
          Text({ color }, `${props.value}%`)
        ),
        Text({ color, dim: true }, status)
      );
    }),

  story('Gauge - Dashboard')
    .category('Molecules')
    .description('Multiple gauges dashboard style')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 8 }, Text({ color: 'mutedForeground' }, 'CPU:')),
          Text({ color: 'success' }, textProgressBar(45, 100, 20)),
          Text({ color: 'success' }, ' 45%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 8 }, Text({ color: 'mutedForeground' }, 'Memory:')),
          Text({ color: 'warning' }, textProgressBar(72, 100, 20)),
          Text({ color: 'warning' }, ' 72%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 8 }, Text({ color: 'mutedForeground' }, 'Disk:')),
          Text({ color: 'primary' }, textProgressBar(28, 100, 20)),
          Text({ color: 'primary' }, ' 28%')
        )
      )
    ),
];

/**
 * Mouse interaction stories
 * Demonstrates useMouse hook capabilities for terminal mouse input
 */
export const mouseStories: Story[] = [
  story('Mouse - Basic Click')
    .category('Molecules')
    .description('Detect mouse clicks with position')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'primary' },
        Text({ bold: true, color: 'primary' }, '🖱️  Mouse Click Detection'),
        Divider({}),
        Text({ color: 'mutedForeground' }, 'Click anywhere in the terminal to see:'),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column', gap: 0 },
          Text({}, '  Position: x=12, y=5'),
          Text({}, '  Button: left'),
          Text({}, '  Action: click')
        ),
        Spacer({ size: 1 }),
        Text({ color: 'mutedForeground', dim: true }, 'useMouse((event) => { ... })')
      )
    ),

  story('Mouse - All Buttons')
    .category('Molecules')
    .description('Detect left, right, and middle clicks')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, 'Mouse Button Detection'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'success' },
            Text({ color: 'success', bold: true }, '  LEFT  '),
            Text({ color: 'mutedForeground', dim: true }, 'Clicks: 3')
          ),
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'warning' },
            Text({ color: 'warning', bold: true }, ' MIDDLE '),
            Text({ color: 'mutedForeground', dim: true }, 'Clicks: 1')
          ),
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'destructive' },
            Text({ color: 'destructive', bold: true }, ' RIGHT  '),
            Text({ color: 'mutedForeground', dim: true }, 'Clicks: 0')
          )
        ),
        Text({ color: 'mutedForeground', dim: true }, "event.button === 'left' | 'middle' | 'right'")
      )
    ),

  story('Mouse - Position Tracker')
    .category('Molecules')
    .description('Real-time mouse position tracking')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'double', borderColor: 'secondary' },
        Text({ bold: true, color: 'accent' }, '📍 Mouse Position Tracker'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 4 },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'mutedForeground' }, 'X Position'),
            Text({ color: 'primary', bold: true }, '   24   ')
          ),
          Box(
            { flexDirection: 'column' },
            Text({ color: 'mutedForeground' }, 'Y Position'),
            Text({ color: 'primary', bold: true }, '   12   ')
          )
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column', backgroundColor: 'muted' },
          Text({ color: 'mutedForeground' }, '                              '),
          Text({ color: 'mutedForeground' }, '     Move mouse here...       '),
          Text({ color: 'mutedForeground' }, '          ●                   '),
          Text({ color: 'mutedForeground' }, '                              ')
        ),
        Text({ color: 'mutedForeground', dim: true }, "action === 'move' for tracking")
      )
    ),

  story('Mouse - Double Click')
    .category('Molecules')
    .description('Detect double-click events')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'warning' },
        Text({ bold: true, color: 'warning' }, '⚡ Double Click Detection'),
        Divider({}),
        Box(
          { padding: 2, borderStyle: 'single', borderColor: 'primary' },
          Text({ color: 'primary' }, '   Double-click this area   ')
        ),
        Spacer({ size: 1 }),
        Text({}, 'Last action: double-click'),
        Text({ color: 'success' }, '✓ Double-click detected!'),
        Spacer({ size: 1 }),
        Text({ color: 'mutedForeground', dim: true }, "event.action === 'double-click'")
      )
    ),

  story('Mouse - Drag Events')
    .category('Molecules')
    .description('Handle mouse drag operations')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'accent' },
        Text({ bold: true, color: 'accent' }, '↔️  Drag Detection'),
        Divider({}),
        Text({ color: 'mutedForeground' }, 'Drag state: dragging'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({}, 'Start: (5, 10)'),
          Text({ color: 'mutedForeground' }, '→'),
          Text({}, 'Current: (25, 10)')
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column' },
          Text({ color: 'mutedForeground' }, '╔══════════════════════════╗'),
          Text({ color: 'mutedForeground' }, '║                          ║'),
          Text({ color: 'mutedForeground' }, '║   ●────────────○         ║'),
          Text({ color: 'mutedForeground' }, '║                          ║'),
          Text({ color: 'mutedForeground' }, '╚══════════════════════════╝')
        ),
        Text({ color: 'mutedForeground', dim: true }, "action === 'drag' | 'release'")
      )
    ),

  story('Mouse - Scroll Wheel')
    .category('Molecules')
    .description('Detect scroll up/down events')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '🔄 Scroll Wheel Events'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'success' }, '▲'),
            Text({ color: 'mutedForeground', dim: true }, 'scroll-up'),
            Text({ color: 'primary' }, '×5')
          ),
          Box(
            { width: 1 },
            Text({ color: 'mutedForeground' }, '│')
          ),
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'destructive' }, '▼'),
            Text({ color: 'mutedForeground', dim: true }, 'scroll-down'),
            Text({ color: 'primary' }, '×12')
          )
        ),
        Spacer({ size: 1 }),
        Text({}, 'Scroll position: 72'),
        Text({ color: 'mutedForeground', dim: true }, "button === 'scroll-up' | 'scroll-down'")
      )
    ),

  story('Mouse - With Modifiers')
    .category('Molecules')
    .description('Detect Ctrl, Shift, Alt + click')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'primary' },
        Text({ bold: true, color: 'primary' }, '⌨️  Mouse + Modifiers'),
        Divider({}),
        Box(
          { flexDirection: 'column', gap: 0 },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'success' }, '✓'),
            Text({}, 'Ctrl + Click'),
            Text({ color: 'mutedForeground', dim: true }, '- Open in new tab')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'mutedForeground' }, '○'),
            Text({}, 'Shift + Click'),
            Text({ color: 'mutedForeground', dim: true }, '- Select range')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'mutedForeground' }, '○'),
            Text({}, 'Alt + Click'),
            Text({ color: 'mutedForeground', dim: true }, '- Quick action')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'mutedForeground' }, '○'),
            Text({}, 'Ctrl + Shift + Click'),
            Text({ color: 'mutedForeground', dim: true }, '- Advanced mode')
          )
        ),
        Spacer({ size: 1 }),
        Text({ color: 'mutedForeground', dim: true }, 'event.modifiers.ctrl | shift | alt')
      )
    ),

  story('Mouse - Click Hitbox')
    .category('Molecules')
    .description('Detect clicks on specific regions')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '🎯 Hitbox Detection'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 1 },
          (() => {
            return Box(
              { padding: 1, borderStyle: 'round', borderColor: 'success', backgroundColor: 'success' },
              Text({ color: 'successForeground', bold: true }, ' Button 1 ')
            );
          })(),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'accent' },
            Text({ color: 'accent' }, ' Button 2 ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'destructive' },
            Text({ color: 'destructive' }, ' Button 3 ')
          )
        ),
        Spacer({ size: 1 }),
        Text({}, 'Clicked: Button 1'),
        Text({ color: 'mutedForeground', dim: true }, 'Check x,y against element bounds')
      )
    ),

  story('Mouse - Interactive Canvas')
    .category('Molecules')
    .description('Draw with mouse clicks')
    .render(() => {
      // Simulated canvas with some "drawn" points
      const canvasLines = [
        '┌────────────────────────────────┐',
        '│                                │',
        '│    ●  ●●●                      │',
        '│   ●●●●●●●●                     │',
        '│    ●●●●●●   ●●●               │',
        '│     ●●●    ●●●●●              │',
        '│            ●●●                │',
        '│                                │',
        '└────────────────────────────────┘',
      ];

      return Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'accent' },
        Text({ bold: true, color: 'accent' }, '🎨 Interactive Canvas'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: isActive('pen') ? 'primary' : 'mutedForeground' }, '[✏️ Pen]'),
          Text({ color: 'mutedForeground' }, '[🧹 Eraser]'),
          Text({ color: 'mutedForeground' }, '[⬜ Clear]')
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column' },
          ...canvasLines.map((line) => Text({ color: 'primary' }, line))
        ),
        Text({ color: 'mutedForeground', dim: true }, 'Click to draw, drag for lines')
      );

      function isActive(tool: string): boolean {
        return tool === 'pen';
      }
    }),

  story('Mouse - Event Log')
    .category('Molecules')
    .description('Log all mouse events')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '📋 Mouse Event Log'),
        Divider({}),
        Box(
          { flexDirection: 'column', height: 8, borderStyle: 'round', borderColor: 'border', padding: 1 },
          Text({ color: 'primary' }, '[12:34:56] click left @ (24, 8)'),
          Text({ color: 'primary' }, '[12:34:57] release @ (24, 8)'),
          Text({ color: 'warning' }, '[12:34:58] scroll-down @ (24, 8)'),
          Text({ color: 'success' }, '[12:34:59] double-click left @ (24, 8)'),
          Text({ color: 'accent' }, '[12:35:00] drag @ (25, 8)'),
          Text({ color: 'accent' }, '[12:35:00] drag @ (26, 8)'),
          Text({ color: 'primary' }, '[12:35:01] release @ (28, 8)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'mutedForeground' }, 'Events: 7'),
          Text({ color: 'mutedForeground' }, '|'),
          Text({ color: 'mutedForeground' }, '[Clear Log]')
        )
      )
    ),

  story('Mouse - Hover State')
    .category('Molecules')
    .description('Track hover state over elements')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '👆 Hover Detection'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          (() => {
            const bg = 'blue';
            const fg = getContrastColor(bg);
            return Box(
              { padding: 1, borderStyle: 'round', borderColor: 'primary', backgroundColor: bg },
              Text({ color: fg, backgroundColor: bg, bold: true }, ' Hovered! ')
            );
          })(),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'border' },
            Text({ color: 'mutedForeground' }, ' Normal ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'border' },
            Text({ color: 'mutedForeground' }, ' Normal ')
          )
        ),
        Spacer({ size: 1 }),
        Text({ color: 'mutedForeground' }, 'Hovering: Item 1'),
        Text({ color: 'mutedForeground', dim: true }, "Track mouse position for hover effects")
      )
    ),

  story('Mouse - Context Menu')
    .category('Molecules')
    .description('Right-click context menu trigger')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '📜 Context Menu'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 0 },
          (() => {
            const selBg = 'blue';
            const selFg = getContrastColor(selBg);
            return Box(
              { flexDirection: 'column', width: 20 },
              Text({}, '  📄 Document.txt'),
              Text({}, '  📁 Folder'),
              Text({ backgroundColor: selBg, color: selFg }, '  📄 Selected.md ')
            );
          })(),
          Box(
            { flexDirection: 'column', borderStyle: 'single', borderColor: 'primary', padding: 1 },
            Text({ color: 'primary' }, '  Open        '),
            Text({}, '  Edit        '),
            Text({}, '  Copy        '),
            Text({ color: 'mutedForeground' }, '  ──────────  '),
            Text({ color: 'destructive' }, '  Delete      ')
          )
        ),
        Text({ color: 'mutedForeground', dim: true }, "if (event.button === 'right') showMenu()")
      )
    ),

  story('Mouse - Drag & Drop')
    .category('Molecules')
    .description('Visual drag and drop interface')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'success' },
        Text({ bold: true, color: 'success' }, '📦 Drag & Drop'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', borderStyle: 'single', borderColor: 'border', padding: 1 },
            Text({ color: 'mutedForeground', dim: true }, 'Source'),
            Text({}, '  📄 File 1'),
            Text({ color: 'warning' }, '  📄 Dragging...'),
            Text({}, '  📄 File 3')
          ),
          Box(
            { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
            Text({ color: 'warning' }, '→→→'),
            Text({ color: 'warning', dim: true }, '📄')
          ),
          Box(
            { flexDirection: 'column', borderStyle: 'double', borderColor: 'success', padding: 1 },
            Text({ color: 'success' }, 'Drop Zone'),
            Text({}, '  📄 Existing'),
            Text({ color: 'success', dim: true }, '  ┄┄┄┄┄┄┄┄')
          )
        ),
        Text({ color: 'mutedForeground', dim: true }, 'Combine drag events with position tracking')
      )
    ),

  story('Mouse - Selection Box')
    .category('Molecules')
    .description('Drag to create selection rectangle')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'single' },
        Text({ bold: true }, '⬜ Selection Box')  ,
        Divider({}),
        Box(
          { flexDirection: 'column' },
          Text({ color: 'mutedForeground' }, '┌──────────────────────────────┐'),
          Text({ color: 'mutedForeground' }, '│  ○       ●       ○       ○   │'),
          Text({ color: 'mutedForeground' }, '│      ┏━━━━━━━━━━━┓           │'),
          Text({ color: 'mutedForeground' }, '│  ○   ┃ ●     ●   ┃   ○       │'),
          Text({ color: 'mutedForeground' }, '│      ┃   ●       ┃           │'),
          Text({ color: 'mutedForeground' }, '│      ┗━━━━━━━━━━━┛   ○       │'),
          Text({ color: 'mutedForeground' }, '│  ○           ○               │'),
          Text({ color: 'mutedForeground' }, '└──────────────────────────────┘')
        ),
        Text({ color: 'primary' }, 'Selected: 4 items'),
        Text({ color: 'mutedForeground', dim: true }, 'Track start & end drag positions')
      )
    ),
];

/**
 * LineChart stories - Multi-series with color coding
 */
export const lineChartStories: Story[] = [
  story('LineChart - Single Series')
    .category('Molecules')
    .description('Single data series line chart')
    .render(() =>
      LineChart({
        series: [
          { name: 'Usage', data: [10, 25, 30, 45, 60, 55, 70], color: 'primary' },
        ],
        width: 50,
        height: 8,
        title: 'System Usage Over Time',
        showLegend: true,
      })
    ),

  story('LineChart - Multi-Series Colors')
    .category('Molecules')
    .description('Multiple series with automatic color assignment')
    .render(() =>
      LineChart({
        series: [
          { name: 'Frontend', data: [10, 25, 30, 45, 60, 55, 70] },
          { name: 'Backend', data: [15, 20, 35, 40, 55, 65, 75] },
          { name: 'Database', data: [5, 15, 25, 35, 45, 50, 60] },
        ],
        width: 50,
        height: 10,
        title: 'Performance Metrics',
        showLegend: true,
      })
    ),

  story('LineChart - Custom Colors')
    .category('Molecules')
    .description('Line chart with custom series colors')
    .controls({
      color1: defaultControls.color('Series 1 Color', 'green'),
      color2: defaultControls.color('Series 2 Color', 'yellow'),
    })
    .render((props) =>
      LineChart({
        series: [
          { name: 'Profit', data: [50, 65, 75, 70, 85, 90, 95], color: props.color1 },
          { name: 'Costs', data: [30, 35, 40, 45, 40, 38, 35], color: props.color2 },
        ],
        width: 50,
        height: 8,
        title: 'Revenue Analysis',
        showLegend: true,
      })
    ),
];

/**
 * ScatterPlot stories - 2D correlation analysis
 */
export const scatterPlotStories: Story[] = [
  story('ScatterPlot - Basic Correlation')
    .category('Molecules')
    .description('2D scatter plot for correlation analysis')
    .render(() =>
      ScatterPlot({
        points: [
          { x: 1, y: 2 },
          { x: 2, y: 4 },
          { x: 3, y: 6 },
          { x: 4, y: 8 },
          { x: 5, y: 10 },
          { x: 6, y: 12 },
        ],
        width: 40,
        height: 10,
        title: 'X vs Y Correlation',
        markerStyle: 'circle',
      })
    ),

  story('ScatterPlot - Multiple Markers')
    .category('Molecules')
    .description('Scatter plot with different marker styles')
    .controls({
      markerStyle: defaultControls.select('Marker Style', ['circle', 'square', 'diamond', 'plus', 'star', 'cross']),
    })
    .render((props) =>
      ScatterPlot({
        points: [
          { x: 1, y: 3 },
          { x: 2, y: 5 },
          { x: 3, y: 4 },
          { x: 4, y: 7 },
          { x: 5, y: 6 },
          { x: 6, y: 9 },
          { x: 7, y: 8 },
        ],
        width: 40,
        height: 10,
        title: 'Data Distribution',
        markerStyle: props.markerStyle as 'circle' | 'square' | 'diamond' | 'plus' | 'star' | 'cross',
      })
    ),

  story('ScatterPlot - Scatter with Color')
    .category('Molecules')
    .description('Scatter plot with color highlighting')
    .render(() =>
      ScatterPlot({
        points: Array.from({ length: 15 }, () => ({
          x: Math.floor(Math.random() * 10) + 1,
          y: Math.floor(Math.random() * 10) + 1,
        })),
        width: 40,
        height: 10,
        title: 'Random Distribution',
        markerStyle: 'circle',
        color: 'success',
      })
    ),
];

/**
 * RadarChart stories - Multi-dimensional comparison
 */
export const radarChartStories: Story[] = [
  story('RadarChart - Product Comparison')
    .category('Molecules')
    .description('Compare multiple products across dimensions')
    .render(() =>
      RadarChart({
        axes: [
          { name: 'Speed', max: 100 },
          { name: 'Power', max: 100 },
          { name: 'Efficiency', max: 100 },
          { name: 'Durability', max: 100 },
          { name: 'Cost', max: 100 },
        ],
        series: [
          { name: 'Model A', values: [80, 75, 70, 85, 60], color: 'primary' },
          { name: 'Model B', values: [70, 85, 80, 75, 80], color: 'success' },
        ],
        showLegend: true,
      })
    ),

  story('RadarChart - Skills Assessment')
    .category('Molecules')
    .description('Compare skill levels across multiple domains')
    .render(() =>
      RadarChart({
        axes: [
          { name: 'Frontend', max: 100 },
          { name: 'Backend', max: 100 },
          { name: 'DevOps', max: 100 },
          { name: 'Security', max: 100 },
          { name: 'Testing', max: 100 },
          { name: 'Documentation', max: 100 },
        ],
        series: [
          { name: 'Developer 1', values: [85, 75, 65, 70, 80, 75], color: 'warning' },
          { name: 'Developer 2', values: [70, 85, 80, 75, 70, 80], color: 'accent' },
        ],
        showLegend: true,
      })
    ),
];

/**
 * GanttChart stories - Project timeline
 */
export const ganttChartStories: Story[] = [
  story('GanttChart - Project Timeline')
    .category('Molecules')
    .description('Project timeline with task dependencies')
    .render(() =>
      GanttChart({
        tasks: [
          {
            id: '1',
            name: 'Design',
            startDate: '2024-01-01',
            endDate: '2024-01-15',
            progress: 100,
            status: 'complete',
          },
          {
            id: '2',
            name: 'Development',
            startDate: '2024-01-15',
            endDate: '2024-02-15',
            progress: 65,
            status: 'in-progress',
          },
          {
            id: '3',
            name: 'Testing',
            startDate: '2024-02-01',
            endDate: '2024-02-20',
            progress: 30,
            status: 'in-progress',
            dependsOn: '2',
          },
          {
            id: '4',
            name: 'Deployment',
            startDate: '2024-02-20',
            endDate: '2024-02-25',
            progress: 0,
            status: 'pending',
            dependsOn: '3',
          },
        ],
        width: 60,
        title: 'Project Timeline Q1 2024',
        showLegend: true,
      })
    ),

  story('GanttChart - Sprint Planning')
    .category('Molecules')
    .description('Sprint timeline with multiple tasks')
    .render(() =>
      GanttChart({
        tasks: [
          {
            id: '1',
            name: 'Epic Planning',
            startDate: '2024-01-01',
            endDate: '2024-01-03',
            progress: 100,
            status: 'complete',
          },
          {
            id: '2',
            name: 'Feature A',
            startDate: '2024-01-03',
            endDate: '2024-01-07',
            progress: 100,
            status: 'complete',
          },
          {
            id: '3',
            name: 'Feature B',
            startDate: '2024-01-05',
            endDate: '2024-01-10',
            progress: 75,
            status: 'in-progress',
          },
          {
            id: '4',
            name: 'QA Review',
            startDate: '2024-01-07',
            endDate: '2024-01-12',
            progress: 50,
            status: 'in-progress',
          },
          {
            id: '5',
            name: 'Release',
            startDate: '2024-01-12',
            endDate: '2024-01-15',
            progress: 0,
            status: 'pending',
          },
        ],
        width: 60,
        title: 'Sprint 2024-01',
        showLegend: true,
      })
    ),
];

/**
 * TimeHeatmap stories - Activity calendar
 */
export const timeHeatmapStories: Story[] = [
  story('TimeHeatmap - Daily Activity')
    .category('Molecules')
    .description('Daily activity heatmap')
    .render(() =>
      TimeHeatmap({
        data: [
          { date: '2024-12-01', value: 5 },
          { date: '2024-12-02', value: 10 },
          { date: '2024-12-03', value: 8 },
          { date: '2024-12-04', value: 15 },
          { date: '2024-12-05', value: 12 },
          { date: '2024-12-06', value: 20 },
          { date: '2024-12-07', value: 18 },
          { date: '2024-12-08', value: 5 },
          { date: '2024-12-09', value: 10 },
          { date: '2024-12-10', value: 25 },
          { date: '2024-12-11', value: 30 },
          { date: '2024-12-12', value: 22 },
        ],
        granularity: 'day',
        colorScale: 'greens',
        title: 'Daily Activity Heatmap',
        showLegend: true,
      })
    ),

  story('TimeHeatmap - Color Scales')
    .category('Molecules')
    .description('Heatmap with different color scales')
    .controls({
      colorScale: defaultControls.select('Color Scale', ['greens', 'blues', 'reds', 'heat']),
    })
    .render((props) =>
      TimeHeatmap({
        data: [
          { date: '2024-12-01', value: 5 },
          { date: '2024-12-02', value: 15 },
          { date: '2024-12-03', value: 8 },
          { date: '2024-12-04', value: 25 },
          { date: '2024-12-05', value: 12 },
          { date: '2024-12-06', value: 30 },
          { date: '2024-12-07', value: 18 },
          { date: '2024-12-08', value: 10 },
          { date: '2024-12-09', value: 20 },
          { date: '2024-12-10', value: 28 },
          { date: '2024-12-11', value: 22 },
          { date: '2024-12-12', value: 15 },
        ],
        granularity: 'day',
        colorScale: props.colorScale as 'greens' | 'blues' | 'reds' | 'heat',
        title: 'Activity Distribution',
        showLegend: true,
      })
    ),
];

/**
 * Legend stories - Reusable legend component
 */
export const legendStories: Story[] = [
  story('Legend - Horizontal Bottom')
    .category('Molecules')
    .description('Legend positioned at bottom')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Box(
          { flexDirection: 'row', height: 5, borderStyle: 'single', borderColor: 'border', padding: 1 },
          Text({ color: 'mutedForeground' }, 'Chart Area')
        ),
        Legend({
          items: [
            { label: 'Series 1', color: 'primary' },
            { label: 'Series 2', color: 'success' },
            { label: 'Series 3', color: 'warning' },
          ],
          position: 'bottom',
          showSymbols: true,
        })
      )
    ),

  story('Legend - Priority Levels')
    .category('Molecules')
    .description('Legend for priority classification')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 2, padding: 1 },
        Text({ bold: true, color: 'primary' }, 'Task Priority Levels'),
        Newline(),
        Legend({
          items: [
            { label: 'Critical', color: 'destructive' },
            { label: 'High', color: 'warning' },
            { label: 'Medium', color: 'accent' },
            { label: 'Low', color: 'success' },
          ],
          position: 'bottom',
          showSymbols: true,
        })
      )
    ),

  story('Legend - Status Indicators')
    .category('Molecules')
    .description('Legend for status tracking')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 2, padding: 1 },
        Text({ bold: true, color: 'accent' }, 'Build Status Legend'),
        Newline(),
        Legend({
          items: [
            { label: 'Passing', color: 'success' },
            { label: 'Failing', color: 'destructive' },
            { label: 'Pending', color: 'warning' },
            { label: 'Skipped', color: 'mutedForeground' },
          ],
          position: 'bottom',
          showSymbols: true,
        })
      )
    ),
];

/**
 * All molecule stories
 */
export const allMoleculeStories: Story[] = [
  ...utilityStories,
  ...textInputStories,
  ...checkboxStories,
  ...radioStories,
  ...selectStories,
  ...progressBarStories,
  ...alertStories,
  ...toastStories,
  ...tabsStories,
  ...collapsibleStories,
  ...accordionStories,
  ...detailsStories,
  ...expandableTextStories,
  ...sparklineStories,
  ...gaugeStories,
  ...lineChartStories,
  ...scatterPlotStories,
  ...radarChartStories,
  ...ganttChartStories,
  ...timeHeatmapStories,
  ...legendStories,
  ...mouseStories,
];

export default allMoleculeStories;
