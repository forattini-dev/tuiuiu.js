
import { describe, it, expect, vi } from 'vitest';
import { TextInput, createTextInput, renderTextInput } from '../../src/atoms/text-input';
import { Box, Text } from '../../src/primitives/nodes';
import { getChars, getRenderMode } from '../../src/core/capabilities';
import { stringWidth } from '../../src/utils/text-utils';
import type { Key } from '../../src/hooks';

// Helper to simulate input
const createTestInput = (options: any) => createTextInput(options);

// Helper for keys
const keys = {
    enter: () => ({ return: true }) as Key,
    shiftEnter: () => ({ return: true, shift: true }) as Key,
    end: () => ({ end: true }) as Key,
    up: () => ({ upArrow: true }) as Key,
    down: () => ({ downArrow: true }) as Key,
};

const createClickEvent = (x: number, y: number) => ({
    x,
    y,
    absoluteX: x,
    absoluteY: y,
    button: 'left',
    modifiers: { ctrl: false, shift: false, alt: false },
    target: null,
    stopPropagation: () => {},
});

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

    describe('Auto-grow & Scrollbar', () => {
        it('should default to 5 lines when autoGrow is true without maxLines', () => {
            const lines = Array.from({ length: 6 }, (_, i) => `Line ${i + 1}`).join('\n');
            const ti = createTestInput({
                initialValue: lines,
                multiline: true,
                autoGrow: true
            });

            const vnode = renderTextInput(ti, { multiline: true, autoGrow: true });
            expect(vnode.children.length).toBe(5);
        });

        it('should show a scrollbar by default when content overflows', () => {
            const text = ['Line 1', 'Line 2', 'Line 3'].join('\n');
            const ti = createTestInput({
                initialValue: text,
                multiline: true,
                maxLines: 2
            });

            const vnode = renderTextInput(ti, { multiline: true, maxLines: 2 });
            const lineChildren = (vnode.children[0] as any).children;
            const lastChild = lineChildren[lineChildren.length - 1] as any;
            const chars = getChars();
            const renderMode = getRenderMode();
            const expected = renderMode === 'ascii'
                ? ['|', '#']
                : [chars.scrollbar.track, chars.scrollbar.thumb];

            expect(expected).toContain(lastChild.props.children);
        });

        it('should omit the scrollbar when showScrollbar is false', () => {
            const text = ['Line 1', 'Line 2', 'Line 3'].join('\n');
            const ti = createTestInput({
                initialValue: text,
                multiline: true,
                maxLines: 2
            });

            const vnode = renderTextInput(ti, { multiline: true, maxLines: 2, showScrollbar: false });
            const lineChildren = (vnode.children[0] as any).children;
            const lastChild = lineChildren[lineChildren.length - 1] as any;
            const chars = getChars();
            const renderMode = getRenderMode();
            const trackChar = renderMode === 'ascii' ? '|' : chars.scrollbar.track;
            const thumbChar = renderMode === 'ascii' ? '#' : chars.scrollbar.thumb;

            expect(lastChild.props.children).not.toBe(trackChar);
            expect(lastChild.props.children).not.toBe(thumbChar);
        });
    });

    describe('Mouse Click Caret', () => {
        it('should move cursor on single-line click', () => {
            const ti = createTestInput({ initialValue: 'hello' });
            const vnode = renderTextInput(ti, { borderStyle: 'none', prompt: '>' });
            const promptWidth = stringWidth('> ');
            const onClick = (vnode.props as any).onClick;

            onClick(createClickEvent(promptWidth + 4, 0));
            expect(ti.cursorPosition()).toBe(4);
        });

        it('should move cursor on wrapped multiline click', () => {
            const ti = createTestInput({
                initialValue: 'abcdefghij12',
                multiline: true,
                wordWrap: true,
            });
            const vnode = renderTextInput(ti, { borderStyle: 'none', width: 10, wordWrap: true });
            const chars = getChars();
            const promptWidth = stringWidth(`${chars.border.vertical} `);
            const onClick = (vnode.props as any).onClick;

            onClick(createClickEvent(promptWidth + 2, 1));
            expect(ti.cursorPosition()).toBe(10);
        });
    });

    describe('Visual Up/Down Navigation', () => {
        it('should move cursor up by visual lines before history', () => {
            const ti = createTestInput({
                initialValue: 'abcdefghij',
                multiline: true,
                wordWrap: true,
            });
            renderTextInput(ti, { width: 6, wordWrap: true, multiline: true, borderStyle: 'none' });

            ti.setCursorPosition(5);
            ti.handleInput('', keys.up());

            expect(ti.cursorPosition()).toBe(1);
            expect(ti.value()).toBe('abcdefghij');
        });

        it('should use history only at the first visual line', () => {
            const ti = createTestInput({
                initialValue: 'abcdefghij',
                multiline: true,
                wordWrap: true,
                history: ['prev'],
            });
            renderTextInput(ti, { width: 6, wordWrap: true, multiline: true, borderStyle: 'none' });

            ti.setCursorPosition(5);
            ti.handleInput('', keys.up());
            expect(ti.value()).toBe('abcdefghij');

            ti.setCursorPosition(1);
            ti.handleInput('', keys.up());
            expect(ti.value()).toBe('prev');
        });

        it('should keep preferred column when moving down then up', () => {
            const ti = createTestInput({
                initialValue: '12345\nabc\n12345',
                multiline: true,
            });
            renderTextInput(ti, { multiline: true, borderStyle: 'none' });

            ti.setCursorPosition(4);
            ti.handleInput('', keys.down());
            expect(ti.cursorPosition()).toBe(9);

            ti.handleInput('', keys.up());
            expect(ti.cursorPosition()).toBe(4);
        });

        it('should navigate history only at the last visual line on down', () => {
            const ti = createTestInput({
                initialValue: 'current',
                history: ['older', 'newer'],
            });
            renderTextInput(ti, { borderStyle: 'none' });

            ti.handleInput('', keys.up());
            expect(ti.value()).toBe('newer');

            ti.handleInput('', keys.up());
            expect(ti.value()).toBe('older');

            ti.handleInput('', keys.down());
            expect(ti.value()).toBe('newer');

            ti.handleInput('', keys.down());
            expect(ti.value()).toBe('current');
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

        it('should adjust viewport offset when cursor moves past visible lines', () => {
            const text = ['Line 1', 'Line 2', 'Line 3', 'Line 4'].join('\n');
            const ti = createTestInput({
                initialValue: text,
                multiline: true,
                maxLines: 2
            });
            renderTextInput(ti, { multiline: true, maxLines: 2 });

            ti.setCursorPosition(text.length);
            expect(ti.viewportOffset()).toBe(2);

            ti.setCursorPosition(0);
            expect(ti.viewportOffset()).toBe(0);
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
