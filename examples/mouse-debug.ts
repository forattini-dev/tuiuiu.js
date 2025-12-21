import { enableMouseTracking, disableMouseTracking, parseMouseEvent } from '../src/hooks/use-mouse.js';
import { emitInput } from '../src/hooks/context.js';

console.log('Mouse Debugger - Press Ctrl+C to exit');
console.log('Enabling SGR mouse tracking...');

// Helper to print raw buffer as hex
function debugBuffer(data: Buffer) {
  const parts = [];
  for (const byte of data) {
    if (byte < 32 || byte > 126) {
      parts.push(`\\x${byte.toString(16).padStart(2, '0')}`);
    } else {
      parts.push(String.fromCharCode(byte));
    }
  }
  return parts.join('');
}

// Enable tracking
enableMouseTracking();

// Raw mode
process.stdin.setRawMode(true);
process.stdin.resume();

process.stdin.on('data', (data) => {
  const raw = data.toString();
  const hex = debugBuffer(data);
  
  // Check for Ctrl+C
  if (data.length === 1 && data[0] === 3) {
    console.log('Exiting...');
    disableMouseTracking();
    process.exit(0);
  }

  console.log('--- Input Received ---');
  console.log(`Raw: "${JSON.stringify(raw)}"`);
  console.log(`Hex: ${hex}`);

  // Try parsing
  const result = parseMouseEvent(raw);
  if (result) {
    console.log('✅ Parsed Mouse Event:', result.event);
    console.log(`   Consumed Length: ${result.length}`);
  } else {
    console.log('❌ Failed to parse as mouse event');
  }
});

// Cleanup on exit
process.on('exit', () => disableMouseTracking());
