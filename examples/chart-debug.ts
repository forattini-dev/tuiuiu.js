import { render, Box, Text, BarChart } from 'tuiuiu.js';

function App() {
  return Box(
    { flexDirection: 'column', padding: 1 },
    Text({ bold: true }, 'Chart Width Debug'),
    
    // Case 1: Fixed width container, no explicit chart width
    // Expected: Chart might overflow if default maxBarLength (40) + labels > 30
    Box(
      { width: 30, borderStyle: 'single', borderColor: 'red', marginBottom: 1 },
      BarChart({
        data: [{ label: 'A', value: 100 }],
        maxBarLength: 40 // Default
      })
    ),

    // Case 2: Fixed width container, explicit chart width matching container
    // Expected: Chart should fit perfectly
    Box(
      { width: 30, borderStyle: 'single', borderColor: 'green', marginBottom: 1 },
      BarChart({
        data: [{ label: 'B', value: 100 }],
        width: 28 // 30 - 2 for borders
      })
    ),

    // Case 3: Flex container (grow), explicit chart width
    Box(
      { width: 50, borderStyle: 'single', borderColor: 'blue' },
      BarChart({
        data: [{ label: 'C', value: 100 }],
        width: 48
      })
    )
  );
}

const { waitUntilExit } = render(App);
await waitUntilExit();
