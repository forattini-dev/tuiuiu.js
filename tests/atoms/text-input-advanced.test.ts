
import { describe, it, expect, vi } from 'vitest';
import { TextInput, createTextInput, renderTextInput } from '../../src/atoms/text-input';
import { Box, Text } from '../../src/primitives/nodes';
import type { Key } from '../../src/hooks';

// Helper to simulate input
const createTestInput = (options: any) => createTextInput(options);

// Helper for keys
const keys = {
    enter: () => ({ return: true }) as Key,
    shiftEnter: () => ({ return: true, shift: true }) as Key,
    end: () => ({ end: true }) as Key,
};

describe('TextInput Advanced Features', () => {
    describe('Word Wrapping', () => {
        it('should wrap text based on width', () => {
            // Width 12 with default border → contentWidth = 12 - 6 = 6
            // "hello world" should wrap into "hello " (6 chars) and "world" (5 chars)
            const ti = createTestInput({
                initialValue: 'hello world',
                width: 12,
                wordWrap: true
            });

            const vnode = renderTextInput(ti, { width: 12, wordWrap: true });
            // Should wrap into "hello" and "world"
            expect(vnode.children.length).toBe(2);
            expect((vnode.children[0] as any).children[1].props.children).toContain('hello');
            expect((vnode.children[1] as any).children[1].props.children).toContain('world');
        });

        it('should not wrap if wordWrap is false', () => {
            const ti = createTestInput({
                initialValue: 'hello world',
                width: 6,
                wordWrap: false
            });

            const vnode = renderTextInput(ti, { width: 6, wordWrap: false });
            // Should be 1 line (simple implementation just renders rowStyle box)
            expect(vnode.props.flexDirection).toBe('row');
        });
    });

    describe('Max Lines & Scrolling', () => {
        it('should respect maxLines', () => {
            const ti = createTestInput({
                initialValue: 'line1\nline2\nline3\nline4',
                multiline: true,
                maxLines: 2
            });

            const vnode = renderTextInput(ti, { maxLines: 2 });
            // Should show only 2 lines
            expect(vnode.children.length).toBe(2);
        });

        it('should show char count', () => {
            const ti = createTestInput({ initialValue: 'abc' });
            const vnode = renderTextInput(ti, { showCharCount: true });

            // Last child should include char count
            const lastChild = vnode.children[vnode.children.length - 1] as any;
            expect(lastChild.children[0].props.children).toContain('3');
        });
    });

    describe('Enter Key Behavior', () => {
        it('should create newline with plain Enter if enterCreatesNewline is true', () => {
            const ti = createTestInput({
                initialValue: 'test',
                multiline: true,
                enterCreatesNewline: true
            });

            ti.handleInput('', keys.enter());
            expect(ti.value()).toBe('test\n');
        });

        it('should submit with plain Enter if enterCreatesNewline is false', () => {
            const onSubmit = vi.fn();
            const ti = createTestInput({
                initialValue: 'test',
                multiline: true,
                enterCreatesNewline: false,
                onSubmit
            });

            ti.handleInput('', keys.enter());
            expect(ti.value()).toBe('test');
            expect(onSubmit).toHaveBeenCalled();
        });
    });

    describe('Virtual Scroll & TextArea Behavior', () => {
        it('should occupy 100% width when fullWidth is enabled', () => {
            const ti = createTestInput({ initialValue: '', fullWidth: true });
            const vnode = renderTextInput(ti, { fullWidth: true });

            // Should have flexGrow: 1 to occupy available space
            expect(vnode.props.flexGrow).toBe(1);
            // Should be a row container (or column for multiline, but main container is 100%)
            expect(vnode.type).toBe('box');
        });

        it('should implement virtual scrolling (similar to blessed/ink)', () => {
            // Create enough lines to force scrolling
            const lines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
            const text = lines.join('\n');

            const ti = createTestInput({
                initialValue: text,
                multiline: true,
                maxLines: 5
            });

            // Render with maxLines = 5
            // Should show lines 1-5 initially (indices 0-4)
            let vnode = renderTextInput(ti, { maxLines: 5, multiline: true });

            // Verify we only rendered 5 text lines (plus maybe count line? no count here)
            expect(vnode.children.length).toBe(5);

            // Check content of visible lines
            expect((vnode.children[0] as any).children[1].props.children).toContain('Line 1');
            expect((vnode.children[4] as any).children[1].props.children).toContain('Line 5');

            // Move cursor to end (Line 20)
            // Move cursor to end (Line 20)
            ti.handleInput('', keys.end()); // Use helper
            // Manually navigate via setValue if needed, but handleInput ensures state update

            // To be sure we are at end, we can also use:
            // ti.setValue(text); // resets cursor to end

            // Re-render
            vnode = renderTextInput(ti, { maxLines: 5, multiline: true });

            // Should now show Lines 16-20 (to include Line 20)
            // Window size 5. End is Line 20. 
            // Logic: if cursor at line 19 (0-indexed), and maxLines 5.
            // Viewport should show 15, 16, 17, 18, 19.
            expect(vnode.children.length).toBe(5);
            expect((vnode.children[4] as any).children[1].props.children).toContain('Line 20');
            expect((vnode.children[0] as any).children[1].props.children).toContain('Line 16');
        });

        it('should wrap text correctly within strict width (TextArea behavior)', () => {
            // "The user wants to test it filling 100% of width... creating new lines"
            const width = 10;
            const longText = "This is a very long text that should wrap";
            // "This is a " (10)
            // "very long " (10)
            // "text that " (10)
            // "should wr" (9) ?? depends on wrapping logic

            const ti = createTestInput({
                initialValue: longText,
                width,
                wordWrap: true
            });

            const vnode = renderTextInput(ti, { width, wordWrap: true });

            // It should create multiple lines
            expect(vnode.children.length).toBeGreaterThan(1);

            // Check that no line exceeds width (visually)
            vnode.children.forEach((child: any) => {
                // child is a Box row containing [Prompt, Text(before), Cursor?, Text(after)]
                // We need to reconstruct the line text to check length
                // This is a bit complex due to cursor, but let's check the text parts
                // Simplified: basic checking that it tokenized correctly
                const lineContent = child.children
                    .filter((c: any) => c.props.children) // Valid text nodes
                    .map((c: any) => c.props.children)
                    .join('').replace('>', '').trim(); // Remove prompt if naive join

                // Note: children[0] is prompt. children[1] is line content.
                // let's look at the implementation of renderTextInput for multiline wrapped
                // Text({ color: promptColor }, `${linePrompt} `),
                // Text({}, before), ...

                const textPart = child.children[1].props.children;
                expect(textPart.length).toBeLessThanOrEqual(width);
            });
        });
    });
});
