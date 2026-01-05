/**
 * Typography preset tests
 */

import { describe, it, expect } from 'vitest';
import { Title, Subtitle, Caption, Label } from '../../src/primitives/typography.js';

describe('Typography presets', () => {
  it('creates a title with bold and primary color', () => {
    const node = Title('Dashboard');
    expect(node.props.bold).toBe(true);
    expect(node.props.color).toBe('primary');
  });

  it('creates a subtitle with secondary color', () => {
    const node = Subtitle('Overview');
    expect(node.props.color).toBe('secondary');
  });

  it('creates a caption with dim muted color', () => {
    const node = Caption('Last updated');
    expect(node.props.color).toBe('mutedForeground');
    expect(node.props.dim).toBe(true);
  });

  it('creates a label with default foreground color', () => {
    const node = Label('Username');
    expect(node.props.color).toBe('foreground');
  });
});
