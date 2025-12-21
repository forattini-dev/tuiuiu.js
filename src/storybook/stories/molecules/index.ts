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
 */

import { Box, Text, When, Each, Fragment, Spacer, Divider } from '../../../components/components.js';
import { 
  TextInput, 
  Checkbox, 
  Select, 
  RadioGroup, 
  ToggleGroup 
} from '../../../design-system/forms/index.js';
import { ProgressBar } from '../../../design-system/feedback/index.js';
import { story, defaultControls } from '../../core/registry.js';
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
        When(props.show, Text({ color: 'green' }, 'Conditionally visible')),
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
              Text({ color: index % 2 === 0 ? 'cyan' : 'gray' }, `${index + 1}. ${item}`)
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
          Text({ color: 'cyan' }, 'Inside fragment 1'),
          Text({ color: 'green' }, 'Inside fragment 2'),
          Text({ color: 'yellow' }, 'Inside fragment 3')
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
        Text({ color: 'cyan' }, props.label),
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
        Text({ color: 'cyan' }, textProgressBar(props.value, 100, props.width)),
        Text({ color: 'cyan' }, `${props.value}%`)
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
          Text({ color: 'gray' }, 'Progress:'),
          Text({ color: 'cyan' }, textProgressBar(props.value, 100, 25)),
          props.showLabel ? Text({ color: 'cyan' }, `${props.value}%`) : null
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
          Box({ width: 12 }, Text({ color: 'gray' }, 'Downloading:')),
          Text({ color: 'blue' }, textProgressBar(75, 100, 20)),
          Text({ color: 'blue' }, '75%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 12 }, Text({ color: 'gray' }, 'Installing:')),
          Text({ color: 'green' }, textProgressBar(45, 100, 20)),
          Text({ color: 'green' }, '45%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 12 }, Text({ color: 'gray' }, 'Configuring:')),
          Text({ color: 'yellow' }, textProgressBar(10, 100, 20)),
          Text({ color: 'yellow' }, '10%')
        )
      )
    ),

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
          Text({ color: 'gray' }, 'Memory:'),
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
          borderColor: 'blue',
          padding: 1,
          width: 50,
        },
        Text({ color: 'blue' }, 'ℹ '),
        Text({ color: 'white' }, props.message)
      )
    ),

  story('Alert - Success')
    .category('Molecules')
    .description('Success alert')
    .render(() =>
      Box(
        {
          borderStyle: 'round',
          borderColor: 'green',
          backgroundColor: 'green',
          padding: 1,
          width: 50,
        },
        Text({ color: 'white', bold: true }, '✓ Operation completed successfully!')
      )
    ),

  story('Alert - Warning')
    .category('Molecules')
    .description('Warning alert')
    .render(() =>
      Box(
        {
          borderStyle: 'single',
          borderColor: 'yellow',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'yellow', bold: true }, '⚠ Warning')
          ),
          Text({ color: 'yellow' }, 'This action may have unintended consequences.')
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
          borderColor: 'red',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'column' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'red', bold: true }, '✗ Error')
          ),
          Text({ color: 'red' }, 'Failed to complete the operation.'),
          Text({ color: 'gray', dim: true }, 'Error code: E_CONNECTION_TIMEOUT')
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
          borderColor: 'cyan',
          padding: 1,
          width: 50,
        },
        Box(
          { flexDirection: 'row', justifyContent: 'space-between' },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'cyan' }, 'ℹ'),
            Text({ color: 'white' }, 'New updates available.')
          ),
          Text({ color: 'gray' }, '[x]')
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
            borderColor: 'green',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'green' }, '✓ File saved successfully')
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'blue',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'blue' }, 'ℹ 3 new messages')
        ),
        Box(
          {
            borderStyle: 'round',
            borderColor: 'yellow',
            paddingX: 2,
            paddingY: 0,
          },
          Text({ color: 'yellow' }, '⚠ Low disk space')
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
          borderColor: 'cyan',
          padding: 1,
          width: 45,
        },
        Box(
          { flexDirection: 'column', gap: 1 },
          Text({ color: 'white' }, 'New version available (v2.0.0)'),
          Box(
            { flexDirection: 'row', gap: 2 },
            Text({ color: 'cyan', inverse: true }, ' Update '),
            Text({ color: 'gray' }, 'Dismiss')
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
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'gray' },
          ...tabs.map((tab, idx) =>
            Box(
              {
                paddingX: 2,
                backgroundColor: idx === props.activeTab ? 'blue' : undefined,
              },
              Text(
                {
                  color: idx === props.activeTab ? 'white' : 'gray',
                  bold: idx === props.activeTab,
                },
                tab
              )
            )
          )
        ),
        Box(
          { borderStyle: 'single', borderColor: 'blue', padding: 1, height: 5 },
          Text({}, `${tabs[props.activeTab]} content here...`)
        )
      );
    }),

  story('Tabs - With Icons')
    .category('Molecules')
    .description('Tabs with icons')
    .render(() =>
      Box(
        { width: 50, flexDirection: 'column' },
        Box(
          { flexDirection: 'row', borderStyle: 'single', borderColor: 'gray' },
          Box(
            { paddingX: 2, backgroundColor: 'blue' },
            Text({ color: 'white', bold: true }, '🏠 Home')
          ),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, '📁 Files')),
          Box({ paddingX: 2 }, Text({ color: 'gray' }, '⚙️ Settings'))
        ),
        Box(
          { borderStyle: 'single', borderColor: 'blue', padding: 1, height: 5 },
          Text({}, 'Home content')
        )
      )
    ),

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
          Text({ color: 'gray' }, 'Tab 2'),
          Text({ color: 'gray' }, 'Tab 3')
        ),
        Box(
          { borderStyle: 'single', borderColor: props.activeColor, padding: 1, marginTop: 1 },
          Text({}, 'Content 1')
        )
      )
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
        Text({ color: 'gray' }, 'Trend:'),
        Text({ color: 'cyan' }, textSparkline(data))
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
        Text({ color: 'gray' }, 'Data:'),
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
          Box({ width: 10 }, Text({ color: 'gray' }, 'Revenue:')),
          Text({ color: 'green' }, textSparkline(revenue))
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 10 }, Text({ color: 'gray' }, 'Costs:')),
          Text({ color: 'red' }, textSparkline(costs))
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 10 }, Text({ color: 'gray' }, 'Profit:')),
          Text({ color: 'cyan' }, textSparkline(profit))
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
        Text({ color: 'gray' }, 'Progress'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({ color: 'cyan' }, textProgressBar(props.value, 100, 30)),
          Text({ color: 'cyan' }, `${props.value}%`)
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
          Text({ color: 'gray' }, 'Memory:'),
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
          Box({ width: 8 }, Text({ color: 'gray' }, 'CPU:')),
          Text({ color: 'green' }, textProgressBar(45, 100, 20)),
          Text({ color: 'green' }, ' 45%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 8 }, Text({ color: 'gray' }, 'Memory:')),
          Text({ color: 'yellow' }, textProgressBar(72, 100, 20)),
          Text({ color: 'yellow' }, ' 72%')
        ),
        Box(
          { flexDirection: 'row', gap: 1 },
          Box({ width: 8 }, Text({ color: 'gray' }, 'Disk:')),
          Text({ color: 'cyan' }, textProgressBar(28, 100, 20)),
          Text({ color: 'cyan' }, ' 28%')
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
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'cyan' },
        Text({ bold: true, color: 'cyan' }, '🖱️  Mouse Click Detection'),
        Divider({}),
        Text({ color: 'gray' }, 'Click anywhere in the terminal to see:'),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column', gap: 0 },
          Text({}, '  Position: x=12, y=5'),
          Text({}, '  Button: left'),
          Text({}, '  Action: click')
        ),
        Spacer({ size: 1 }),
        Text({ color: 'gray', dim: true }, 'useMouse((event) => { ... })')
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
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'green' },
            Text({ color: 'green', bold: true }, '  LEFT  '),
            Text({ color: 'gray', dim: true }, 'Clicks: 3')
          ),
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'yellow' },
            Text({ color: 'yellow', bold: true }, ' MIDDLE '),
            Text({ color: 'gray', dim: true }, 'Clicks: 1')
          ),
          Box(
            { flexDirection: 'column', padding: 1, borderStyle: 'round', borderColor: 'red' },
            Text({ color: 'red', bold: true }, ' RIGHT  '),
            Text({ color: 'gray', dim: true }, 'Clicks: 0')
          )
        ),
        Text({ color: 'gray', dim: true }, "event.button === 'left' | 'middle' | 'right'")
      )
    ),

  story('Mouse - Position Tracker')
    .category('Molecules')
    .description('Real-time mouse position tracking')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'double', borderColor: 'magenta' },
        Text({ bold: true, color: 'magenta' }, '📍 Mouse Position Tracker'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 4 },
          Box(
            { flexDirection: 'column' },
            Text({ color: 'gray' }, 'X Position'),
            Text({ color: 'cyan', bold: true }, '   24   ')
          ),
          Box(
            { flexDirection: 'column' },
            Text({ color: 'gray' }, 'Y Position'),
            Text({ color: 'cyan', bold: true }, '   12   ')
          )
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column', backgroundColor: 'gray' },
          Text({ color: 'white' }, '                              '),
          Text({ color: 'white' }, '     Move mouse here...       '),
          Text({ color: 'white' }, '          ●                   '),
          Text({ color: 'white' }, '                              ')
        ),
        Text({ color: 'gray', dim: true }, "action === 'move' for tracking")
      )
    ),

  story('Mouse - Double Click')
    .category('Molecules')
    .description('Detect double-click events')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'yellow' },
        Text({ bold: true, color: 'yellow' }, '⚡ Double Click Detection'),
        Divider({}),
        Box(
          { padding: 2, borderStyle: 'single', borderColor: 'cyan' },
          Text({ color: 'cyan' }, '   Double-click this area   ')
        ),
        Spacer({ size: 1 }),
        Text({}, 'Last action: double-click'),
        Text({ color: 'green' }, '✓ Double-click detected!'),
        Spacer({ size: 1 }),
        Text({ color: 'gray', dim: true }, "event.action === 'double-click'")
      )
    ),

  story('Mouse - Drag Events')
    .category('Molecules')
    .description('Handle mouse drag operations')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'blue' },
        Text({ bold: true, color: 'blue' }, '↔️  Drag Detection'),
        Divider({}),
        Text({ color: 'gray' }, 'Drag state: dragging'),
        Box(
          { flexDirection: 'row', gap: 1 },
          Text({}, 'Start: (5, 10)'),
          Text({ color: 'gray' }, '→'),
          Text({}, 'Current: (25, 10)')
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column' },
          Text({ color: 'gray' }, '╔══════════════════════════╗'),
          Text({ color: 'gray' }, '║                          ║'),
          Text({ color: 'gray' }, '║   ●────────────○         ║'),
          Text({ color: 'gray' }, '║                          ║'),
          Text({ color: 'gray' }, '╚══════════════════════════╝')
        ),
        Text({ color: 'gray', dim: true }, "action === 'drag' | 'release'")
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
            Text({ color: 'green' }, '▲'),
            Text({ color: 'gray', dim: true }, 'scroll-up'),
            Text({ color: 'cyan' }, '×5')
          ),
          Box(
            { width: 1 },
            Text({ color: 'gray' }, '│')
          ),
          Box(
            { flexDirection: 'column', alignItems: 'center' },
            Text({ color: 'red' }, '▼'),
            Text({ color: 'gray', dim: true }, 'scroll-down'),
            Text({ color: 'cyan' }, '×12')
          )
        ),
        Spacer({ size: 1 }),
        Text({}, 'Scroll position: 72'),
        Text({ color: 'gray', dim: true }, "button === 'scroll-up' | 'scroll-down'")
      )
    ),

  story('Mouse - With Modifiers')
    .category('Molecules')
    .description('Detect Ctrl, Shift, Alt + click')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'cyan' },
        Text({ bold: true, color: 'cyan' }, '⌨️  Mouse + Modifiers'),
        Divider({}),
        Box(
          { flexDirection: 'column', gap: 0 },
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'green' }, '✓'),
            Text({}, 'Ctrl + Click'),
            Text({ color: 'gray', dim: true }, '- Open in new tab')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'gray' }, '○'),
            Text({}, 'Shift + Click'),
            Text({ color: 'gray', dim: true }, '- Select range')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'gray' }, '○'),
            Text({}, 'Alt + Click'),
            Text({ color: 'gray', dim: true }, '- Quick action')
          ),
          Box(
            { flexDirection: 'row', gap: 1 },
            Text({ color: 'gray' }, '○'),
            Text({}, 'Ctrl + Shift + Click'),
            Text({ color: 'gray', dim: true }, '- Advanced mode')
          )
        ),
        Spacer({ size: 1 }),
        Text({ color: 'gray', dim: true }, 'event.modifiers.ctrl | shift | alt')
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
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'green', backgroundColor: 'green' },
            Text({ color: 'white', bold: true }, ' Button 1 ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'blue' },
            Text({ color: 'blue' }, ' Button 2 ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'red' },
            Text({ color: 'red' }, ' Button 3 ')
          )
        ),
        Spacer({ size: 1 }),
        Text({}, 'Clicked: Button 1'),
        Text({ color: 'gray', dim: true }, 'Check x,y against element bounds')
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
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'magenta' },
        Text({ bold: true, color: 'magenta' }, '🎨 Interactive Canvas'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: isActive('pen') ? 'cyan' : 'gray' }, '[✏️ Pen]'),
          Text({ color: 'gray' }, '[🧹 Eraser]'),
          Text({ color: 'gray' }, '[⬜ Clear]')
        ),
        Spacer({ size: 1 }),
        Box(
          { flexDirection: 'column' },
          ...canvasLines.map((line) => Text({ color: 'cyan' }, line))
        ),
        Text({ color: 'gray', dim: true }, 'Click to draw, drag for lines')
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
          { flexDirection: 'column', height: 8, borderStyle: 'round', borderColor: 'gray', padding: 1 },
          Text({ color: 'cyan' }, '[12:34:56] click left @ (24, 8)'),
          Text({ color: 'cyan' }, '[12:34:57] release @ (24, 8)'),
          Text({ color: 'yellow' }, '[12:34:58] scroll-down @ (24, 8)'),
          Text({ color: 'green' }, '[12:34:59] double-click left @ (24, 8)'),
          Text({ color: 'magenta' }, '[12:35:00] drag @ (25, 8)'),
          Text({ color: 'magenta' }, '[12:35:00] drag @ (26, 8)'),
          Text({ color: 'cyan' }, '[12:35:01] release @ (28, 8)')
        ),
        Box(
          { flexDirection: 'row', gap: 2 },
          Text({ color: 'gray' }, 'Events: 7'),
          Text({ color: 'gray' }, '|'),
          Text({ color: 'gray' }, '[Clear Log]')
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
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'cyan', backgroundColor: 'blue' },
            Text({ color: 'white', bold: true }, ' Hovered! ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'gray' },
            Text({ color: 'gray' }, ' Normal ')
          ),
          Box(
            { padding: 1, borderStyle: 'round', borderColor: 'gray' },
            Text({ color: 'gray' }, ' Normal ')
          )
        ),
        Spacer({ size: 1 }),
        Text({ color: 'gray' }, 'Hovering: Item 1'),
        Text({ color: 'gray', dim: true }, "Track mouse position for hover effects")
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
          Box(
            { flexDirection: 'column', width: 20 },
            Text({}, '  📄 Document.txt'),
            Text({}, '  📁 Folder'),
            Text({ backgroundColor: 'blue', color: 'white' }, '  📄 Selected.md ')
          ),
          Box(
            { flexDirection: 'column', borderStyle: 'single', borderColor: 'cyan', padding: 1 },
            Text({ color: 'cyan' }, '  Open        '),
            Text({}, '  Edit        '),
            Text({}, '  Copy        '),
            Text({ color: 'gray' }, '  ──────────  '),
            Text({ color: 'red' }, '  Delete      ')
          )
        ),
        Text({ color: 'gray', dim: true }, "if (event.button === 'right') showMenu()")
      )
    ),

  story('Mouse - Drag & Drop')
    .category('Molecules')
    .description('Visual drag and drop interface')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1, padding: 1, borderStyle: 'round', borderColor: 'green' },
        Text({ bold: true, color: 'green' }, '📦 Drag & Drop'),
        Divider({}),
        Box(
          { flexDirection: 'row', gap: 2 },
          Box(
            { flexDirection: 'column', borderStyle: 'single', borderColor: 'gray', padding: 1 },
            Text({ color: 'gray', dim: true }, 'Source'),
            Text({}, '  📄 File 1'),
            Text({ color: 'yellow' }, '  📄 Dragging...'),
            Text({}, '  📄 File 3')
          ),
          Box(
            { flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
            Text({ color: 'yellow' }, '→→→'),
            Text({ color: 'yellow', dim: true }, '📄')
          ),
          Box(
            { flexDirection: 'column', borderStyle: 'double', borderColor: 'green', padding: 1 },
            Text({ color: 'green' }, 'Drop Zone'),
            Text({}, '  📄 Existing'),
            Text({ color: 'green', dim: true }, '  ┄┄┄┄┄┄┄┄')
          )
        ),
        Text({ color: 'gray', dim: true }, 'Combine drag events with position tracking')
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
          Text({ color: 'gray' }, '┌──────────────────────────────┐'),
          Text({ color: 'gray' }, '│  ○       ●       ○       ○   │'),
          Text({ color: 'gray' }, '│      ┏━━━━━━━━━━━┓           │'),
          Text({ color: 'gray' }, '│  ○   ┃ ●     ●   ┃   ○       │'),
          Text({ color: 'gray' }, '│      ┃   ●       ┃           │'),
          Text({ color: 'gray' }, '│      ┗━━━━━━━━━━━┛   ○       │'),
          Text({ color: 'gray' }, '│  ○           ○               │'),
          Text({ color: 'gray' }, '└──────────────────────────────┘')
        ),
        Text({ color: 'cyan' }, 'Selected: 4 items'),
        Text({ color: 'gray', dim: true }, 'Track start & end drag positions')
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
  ...sparklineStories,
  ...gaugeStories,
  ...mouseStories,
];

export default allMoleculeStories;
