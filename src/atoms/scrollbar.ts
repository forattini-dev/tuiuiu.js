/**
 * Scrollbar Atom
 *
 * @layer Atom
 * @description Renders a visual scrollbar for scrollable content
 */

import { Box, Text } from '../primitives/nodes.js';
import type { VNode, ColorValue } from '../utils/types.js';
import { getChars, getRenderMode } from '../core/capabilities.js';
import { themeColor } from '../core/theme.js';

export interface ScrollbarOptions {
    /** Height of the scrollbar area (number of lines) */
    height: number;
    /** Total height of content */
    total: number;
    /** Current scroll position (from 0 to maxScroll) */
    current: number;
    /** Color of the thumb (scroller) */
    color?: ColorValue;
    /** Color of the track */
    trackColor?: ColorValue;
    /** Orientation (currently only vertical supported) */
    orientation?: 'vertical';
    /** Character for the thumb (optional override) */
    thumbChar?: string;
    /** Character for the track (optional override) */
    trackChar?: string;
}

/**
 * Render a scrollbar
 */
export function Scrollbar(options: ScrollbarOptions): VNode {
    const {
        height,
        total,
        current,
        color = 'cyan',
        trackColor = 'gray',
        thumbChar: customThumb,
        trackChar: customTrack,
    } = options;

    if (total <= height) {
        return Box({ width: 1, flexDirection: 'column' });
    }

    const chars = getChars();
    const isAscii = getRenderMode() === 'ascii';
    const maxScroll = Math.max(1, total - height);

    // Calculate thumb size and position
    // Thumb size is proportional to visible area vs total area
    const thumbSize = Math.max(1, Math.floor((height / total) * height));
    const availableTrack = height - thumbSize;

    // Current position relative to max scroll
    // Clamp current between 0 and maxScroll
    const effectiveScroll = Math.max(0, Math.min(current, maxScroll));
    const scrollRatio = effectiveScroll / maxScroll;

    // Thumb position (from top)
    const thumbPos = Math.floor(availableTrack * scrollRatio);

    const finalThumbChar = customThumb || (isAscii ? '#' : chars.scrollbar.thumb);
    const finalTrackChar = customTrack || (isAscii ? '|' : chars.scrollbar.track);

    const scrollbarLines: VNode[] = [];

    for (let i = 0; i < height; i++) {
        const isThumb = i >= thumbPos && i < thumbPos + thumbSize;
        const char = isThumb ? finalThumbChar : finalTrackChar;
        const charColor = isThumb ? color : trackColor;

        // Use muted/dim for track if using default gray
        const isTrackDefault = !isThumb && trackColor === 'gray';

        scrollbarLines.push(
            Text(
                {
                    color: charColor,
                    dim: isTrackDefault
                },
                char
            )
        );
    }

    return Box(
        { flexDirection: 'column', width: 1, marginLeft: 1 },
        ...scrollbarLines
    );
}
