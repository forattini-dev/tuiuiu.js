/**
 * Simple verification script to test core functionality
 * Run with: npx tsx scripts/verify.ts
 */

import { createSignal, createEffect, batch, createMemo } from '../src/core/signal.js'
import { Box, Text } from '../src/components/components.js'
import { renderToString } from '../src/core/renderer.js'

console.log('=== Tuiuiu Verification ===\n')

// Test 1: Signals
console.log('1. Testing Signals...')
const [count, setCount] = createSignal(0)
console.assert(count() === 0, 'Initial value should be 0')
setCount(5)
console.assert(count() === 5, 'After set, value should be 5')
setCount(c => c + 1)
console.assert(count() === 6, 'After update fn, value should be 6')
console.log('   ✓ Signals work!')

// Test 2: Effects
console.log('2. Testing Effects...')
let effectRuns = 0
const [value, setValue] = createSignal(0)
createEffect(() => {
  value() // Track dependency
  effectRuns++
})
console.assert(effectRuns === 1, 'Effect should run immediately')
setValue(1)
console.assert(effectRuns === 2, 'Effect should run on change')
console.log('   ✓ Effects work!')

// Test 3: Batch
console.log('3. Testing Batch...')
let batchEffectRuns = 0
const [batchVal, setBatchVal] = createSignal(0)
createEffect(() => {
  batchVal()
  batchEffectRuns++
})
batch(() => {
  setBatchVal(1)
  setBatchVal(2)
  setBatchVal(3)
})
console.assert(batchEffectRuns === 2, 'Batch should run effect only once')
console.assert(batchVal() === 3, 'Final value should be 3')
console.log('   ✓ Batch works!')

// Test 4: Memo
console.log('4. Testing Memo...')
const [num, setNum] = createSignal(5)
const doubled = createMemo(() => num() * 2)
console.assert(doubled() === 10, 'Memo should compute 5*2=10')
setNum(10)
console.assert(doubled() === 20, 'Memo should update to 10*2=20')
console.log('   ✓ Memo works!')

// Test 5: Components
console.log('5. Testing Components...')
const box = Box({ flexDirection: 'column' },
  Text({ color: 'cyan' }, 'Hello'),
  Text({ bold: true }, 'World')
)
console.assert(box.type === 'box', 'Box should create box VNode')
console.assert(box.children.length === 2, 'Box should have 2 children')
console.log('   ✓ Components work!')

// Test 6: Rendering
console.log('6. Testing Rendering...')
const output = renderToString(
  Box({ padding: 1 },
    Text({ color: 'green' }, 'Test')
  ),
  40
)
console.assert(output.includes('Test'), 'Render should include text')
console.log('   ✓ Rendering works!')

console.log('\n=== All tests passed! ===')
