/**
 * Primitives Stories
 *
 * Primitives are the lowest level render helpers and layout nodes.
 */

import { Box, Text, Spacer, Newline, Fragment, When, Each, Transform, Static, Slot } from '../../../primitives/nodes.js';
import { Divider } from '../../../primitives/divider.js';
import { SplitBox } from '../../../primitives/split-box.js';
import { Scroll } from '../../../primitives/scroll.js';
import { story, defaultControls } from '../../core/registry.js';
import { getTheme } from '../../../core/theme.js';
import type { Story } from '../../types.js';

/**
 * Box component stories
 */
export const boxStories: Story[] = [
  story('Box - Basic')
    .category('Primitives')
    .description('Basic box container with content')
    .controls({
      padding: defaultControls.range('Padding', 1, 0, 5),
      content: defaultControls.text('Content', 'Hello, Box!'),
    })
    .render((props) =>
      Box(
        { padding: props.padding },
        Text({}, props.content)
      )
    ),

  story('Box - Flex Direction')
    .category('Primitives')
    .description('Box with different flex directions')
    .controls({
      direction: defaultControls.select('Direction', ['row', 'column', 'row-reverse', 'column-reverse'], 'column'),
    })
    .render((props) =>
      Box(
        { flexDirection: props.direction, gap: 1 },
        Text({ color: 'primary' }, 'First'),
        Text({ color: 'success' }, 'Second'),
        Text({ color: 'warning' }, 'Third')
      )
    ),

  story('Box - Border Styles')
    .category('Primitives')
    .description('Box with different border styles')
    .controls({
      borderStyle: defaultControls.select('Border Style', ['single', 'double', 'round', 'bold', 'singleDouble', 'doubleSingle', 'classic', 'arrow', 'none'], 'single'),
      borderColor: defaultControls.color('Border Color', 'cyan'),
    })
    .render((props) =>
      Box(
        {
          borderStyle: props.borderStyle,
          borderColor: props.borderColor,
          padding: 1,
        },
        Text({}, 'Bordered box')
      )
    ),

  story('Box - Padding & Margin')
    .category('Primitives')
    .description('Box with padding and margin variations')
    .controls({
      padding: defaultControls.range('Padding', 1, 0, 5),
      paddingX: defaultControls.range('Padding X', 0, 0, 5),
      paddingY: defaultControls.range('Padding Y', 0, 0, 5),
    })
    .render((props) =>
      Box(
        { borderStyle: 'single', borderColor: 'border' },
        Box(
          {
            padding: props.padding,
            paddingX: props.paddingX || undefined,
            paddingY: props.paddingY || undefined,
            backgroundColor: 'primary',
          },
          Text({ color: 'primaryForeground' }, 'Content')
        )
      )
    ),

  story('Box - Alignment')
    .category('Primitives')
    .description('Box with justify and align options')
    .controls({
      justifyContent: defaultControls.select('Justify', ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'], 'flex-start'),
      alignItems: defaultControls.select('Align', ['flex-start', 'flex-end', 'center', 'stretch'], 'flex-start'),
    })
    .render((props) =>
      Box(
        {
          width: 40,
          height: 10,
          justifyContent: props.justifyContent,
          alignItems: props.alignItems,
          borderStyle: 'single',
          borderColor: 'border',
        },
        Box(
          { backgroundColor: 'primary', padding: 1 },
          Text({ color: 'primaryForeground' }, 'A')
        ),
        Box(
          { backgroundColor: 'success', padding: 1 },
          Text({ color: 'successForeground' }, 'B')
        )
      )
    ),

  story('Box - Dimensions')
    .category('Primitives')
    .description('Box with width and height')
    .controls({
      width: defaultControls.range('Width', 30, 10, 60),
      height: defaultControls.range('Height', 5, 3, 15),
    })
    .render((props) =>
      Box(
        {
          width: props.width,
          height: props.height,
          borderStyle: 'single',
          borderColor: 'primary',
          justifyContent: 'center',
          alignItems: 'center',
        },
        Text({}, `${props.width}x${props.height}`)
      )
    ),
];

/**
 * Text component stories
 */
export const textStories: Story[] = [
  story('Text - Basic')
    .category('Primitives')
    .description('Basic text with styling options')
    .controls({
      content: defaultControls.text('Content', 'Hello, Tuiuiu!'),
      color: defaultControls.color('Color', 'white'),
      bold: defaultControls.boolean('Bold', false),
      italic: defaultControls.boolean('Italic', false),
      underline: defaultControls.boolean('Underline', false),
    })
    .render((props) =>
      Text(
        {
          color: props.color,
          bold: props.bold,
          italic: props.italic,
          underline: props.underline,
        },
        props.content
      )
    ),

  story('Text - All Colors')
    .category('Primitives')
    .description('Display all available colors')
    .render(() =>
      Box(
        { flexDirection: 'column' },
        Text({ color: 'foreground' }, 'white'),
        Text({ color: 'mutedForeground' }, 'gray'),
        Text({ color: 'destructive' }, 'red'),
        Text({ color: 'success' }, 'green'),
        Text({ color: 'warning' }, 'yellow'),
        Text({ color: 'accent' }, 'blue'),
        Text({ color: 'accent' }, 'magenta'),
        Text({ color: 'primary' }, 'cyan'),
        Text({ color: 'red-400' }, 'red-400'),
        Text({ color: 'green-400' }, 'green-400'),
        Text({ color: 'yellow-400' }, 'yellow-400'),
        Text({ color: 'blue-400' }, 'blue-400'),
        Text({ color: 'fuchsia-400' }, 'fuchsia-400'),
        Text({ color: 'cyan-400' }, 'cyan-400')
      )
    ),

  story('Text - Dim Effect')
    .category('Primitives')
    .description('Text with dim styling')
    .controls({
      content: defaultControls.text('Content', 'Dim text'),
    })
    .render((props) => Text({ dim: true }, props.content)),

  story('Text - Bold & Color')
    .category('Primitives')
    .description('Bold text with custom color')
    .controls({
      content: defaultControls.text('Content', 'Bold text'),
      color: defaultControls.color('Color', 'cyan'),
    })
    .render((props) => Text({ bold: true, color: props.color }, props.content)),

  story('Text - Background')
    .category('Primitives')
    .description('Text with background color')
    .controls({
      content: defaultControls.text('Content', 'Background text'),
      foreground: defaultControls.color('Foreground', 'white'),
      background: defaultControls.color('Background', 'blue'),
    })
    .render((props) => Text({ color: props.foreground, backgroundColor: props.background }, props.content)),

  story('Text - Theme Colors')
    .category('Primitives')
    .description('Theme-aware color tokens')
    .render(() => {
      const theme = getTheme();
      return Box(
        { flexDirection: 'column', gap: 1 },
        Text({ color: theme.accents.info }, 'Primary accent'),
        Text({ color: theme.accents.success }, 'Success accent'),
        Text({ color: theme.accents.warning }, 'Warning accent'),
        Text({ color: theme.accents.error }, 'Error accent')
      );
    }),
];

/**
 * Spacer component stories
 */
export const spacerStories: Story[] = [
  story('Spacer - Horizontal')
    .category('Primitives')
    .description('Spacer fills horizontal space')
    .render(() =>
      Box(
        { flexDirection: 'row', borderStyle: 'single', borderColor: 'border', padding: 1 },
        Text({ color: 'primary' }, 'Left'),
        Spacer(),
        Text({ color: 'primary' }, 'Right')
      )
    ),

  story('Spacer - Vertical')
    .category('Primitives')
    .description('Spacer fills vertical space')
    .render(() =>
      Box(
        { flexDirection: 'column', height: 8, borderStyle: 'single', borderColor: 'border', padding: 1 },
        Text({ color: 'primary' }, 'Top'),
        Spacer({}),
        Text({ color: 'primary' }, 'Bottom')
      )
    ),
];

/**
 * Divider component stories
 */
export const dividerStories: Story[] = [
  story('Divider - Horizontal')
    .category('Primitives')
    .description('Horizontal divider')
    .controls({
      color: defaultControls.color('Color', 'border'),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', width: 40 },
        Text({}, 'Section 1'),
        Divider({ color: props.color }),
        Text({}, 'Section 2')
      )
    ),

  story('Divider - Vertical')
    .category('Primitives')
    .description('Vertical divider')
    .controls({
      color: defaultControls.color('Color', 'border'),
      height: defaultControls.range('Height', 5, 2, 10),
    })
    .render((props) =>
      Box(
        { flexDirection: 'row', gap: 2, height: props.height },
        Text({}, 'Left'),
        Divider({ direction: 'vertical', color: props.color, height: props.height }),
        Text({}, 'Right')
      )
    ),
];

/**
 * Newline component stories
 */
export const newlineStories: Story[] = [
  story('Newline - Count')
    .category('Primitives')
    .description('Insert explicit line breaks')
    .controls({
      count: defaultControls.range('Count', 2, 1, 5),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Text({}, 'Line A'),
        Newline({ count: props.count }),
        Text({}, 'Line B')
      )
    ),
];

/**
 * Fragment component stories
 */
export const fragmentStories: Story[] = [
  story('Fragment - Grouping')
    .category('Primitives')
    .description('Group multiple nodes without a wrapper')
    .render(() =>
      Box(
        { flexDirection: 'column', gap: 1 },
        Text({}, 'Before'),
        Fragment(
          Text({ color: 'primary' }, 'Inside fragment 1'),
          Text({ color: 'success' }, 'Inside fragment 2'),
          Text({ color: 'warning' }, 'Inside fragment 3')
        ),
        Text({}, 'After')
      )
    ),
];

/**
 * When component stories
 */
export const whenStories: Story[] = [
  story('When - Conditional')
    .category('Primitives')
    .description('Conditional rendering')
    .controls({
      show: defaultControls.boolean('Show Content', true),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Text({}, 'Always visible'),
        When(props.show, Text({ color: 'success' }, 'Conditionally visible'))
      )
    ),
];

/**
 * Each component stories
 */
export const eachStories: Story[] = [
  story('Each - List Rendering')
    .category('Primitives')
    .description('Render lists with a render function')
    .controls({
      count: defaultControls.range('Item Count', 4, 1, 8),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column' },
        Each(
          Array.from({ length: props.count }, (_, i) => `Item ${i + 1}`),
          (item, index) =>
            Text({ color: index % 2 === 0 ? 'primary' : 'mutedForeground' }, `${index + 1}. ${item}`)
        )
      )
    ),
];

/**
 * Transform component stories
 */
export const transformStories: Story[] = [
  story('Transform - Uppercase')
    .category('Primitives')
    .description('Transform text output (transform function not controllable)')
    .render(() =>
      Transform(
        { transform: (text) => text.toUpperCase() },
        Text({}, 'Transform me')
      )
    ),
];

/**
 * Static component stories
 */
export const staticStories: Story[] = [
  story('Static - Fixed Items')
    .category('Primitives')
    .description('Render static items above dynamic content (items not controllable)')
    .render(() =>
      Box(
        { flexDirection: 'column', height: 6, borderStyle: 'single', borderColor: 'border' },
        Static({
          items: ['Task 1', 'Task 2'],
          children: (item) => Text({ color: 'success' }, `✓ ${item}`),
        }),
        Text({}, 'Dynamic area')
      )
    ),
];

/**
 * Slot component stories
 */
export const slotStories: Story[] = [
  story('Slot - Reserve Space')
    .category('Primitives')
    .description('Reserve layout space when content is hidden')
    .controls({
      visible: defaultControls.boolean('Visible', true),
      height: defaultControls.range('Height', 3, 1, 6),
    })
    .render((props) =>
      Box(
        { flexDirection: 'column', gap: 1, borderStyle: 'single', borderColor: 'border', padding: 1 },
        Text({}, 'Above'),
        Slot({ visible: props.visible, height: props.height }, Text({ color: 'primary' }, 'Slot content')),
        Text({}, 'Below')
      )
    ),
];

/**
 * SplitBox component stories
 */
export const splitBoxStories: Story[] = [
  story('SplitBox - Two Columns')
    .category('Primitives')
    .description('SplitBox with fixed and flexible sections')
    .controls({
      width: defaultControls.range('Width', 40, 20, 70),
    })
    .render((props) =>
      SplitBox({
        borderStyle: 'single',
        borderColor: 'border',
        width: props.width,
        sections: [
          { width: 10, content: Text({}, 'Left') },
          { flexGrow: 1, content: Text({}, 'Right') },
        ],
      })
    ),
];

/**
 * Scroll component stories
 */
export const scrollStories: Story[] = [
  story('Scroll - Basic')
    .category('Primitives')
    .description('Scrollable content area')
    .controls({
      height: defaultControls.range('Height', 5, 3, 8),
      showScrollbar: defaultControls.boolean('Show Scrollbar', true),
    })
    .render((props) =>
      Scroll(
        { height: props.height, showScrollbar: props.showScrollbar },
        Box(
          { flexDirection: 'column' },
          ...Array.from({ length: 12 }, (_, i) => Text({}, `Line ${i + 1}`))
        )
      )
    ),
];

/**
 * All primitive stories
 */
export const allPrimitiveStories: Story[] = [
  ...boxStories,
  ...textStories,
  ...spacerStories,
  ...dividerStories,
  ...newlineStories,
  ...fragmentStories,
  ...whenStories,
  ...eachStories,
  ...transformStories,
  ...staticStories,
  ...slotStories,
  ...splitBoxStories,
  ...scrollStories,
];

export default allPrimitiveStories;
