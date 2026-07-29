import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const themingPath = fileURLToPath(
  new URL('../../docs/core/theming.md', import.meta.url),
);
const stylesPath = fileURLToPath(
  new URL('../../docs/custom.css', import.meta.url),
);

describe('theming documentation palette', () => {
  it('renders every color sample locally without placeholder image services', () => {
    const content = readFileSync(themingPath, 'utf8');
    const swatches = [
      ...content.matchAll(
        /<span class="color-swatch" style="--swatch:(#[0-9A-F]{6})" aria-label="\1"><\/span>/g,
      ),
    ];

    expect(content).not.toContain('via.placeholder.com');
    expect(swatches).toHaveLength(40);

    for (const [, color] of swatches) {
      expect(content).toContain(`\`${color}\``);
    }
  });

  it('defines the local swatch style used by the palette table', () => {
    const styles = readFileSync(stylesPath, 'utf8');

    expect(styles).toContain('.markdown-section .color-swatch');
    expect(styles).toContain('background-color: var(--swatch)');
  });
});
