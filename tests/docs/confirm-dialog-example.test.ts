import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { examplesManifest } from '../../examples/manifest.js';

const modalDocsPath = fileURLToPath(
  new URL('../../docs/components/organisms/modal.md', import.meta.url),
);
const examplePath = fileURLToPath(
  new URL('../../examples/confirm-dialog-overlay.ts', import.meta.url),
);

describe('ConfirmDialog overlay documentation', () => {
  it('keeps the complete example in the validated examples manifest', () => {
    const entry = examplesManifest.find(
      example => example.name === 'confirm-dialog-overlay',
    );

    expect(entry).toMatchObject({
      file: 'confirm-dialog-overlay.ts',
      validate: true,
    });
  });

  it('documents the real props and a portable run command', () => {
    const docs = readFileSync(modalDocsPath, 'utf8');

    expect(docs).toContain('`confirmText`');
    expect(docs).toContain('`cancelText`');
    expect(docs).not.toContain('`confirmLabel`');
    expect(docs).not.toContain('`cancelLabel`');
    expect(docs).not.toContain('OverlayStack({ stack: overlays })');
    expect(docs).toContain('pnpm example confirm-dialog-overlay');
    expect(docs).toMatch(/Windows\s+Terminal/);
    expect(docs).toContain('PowerShell');
  });

  it('wires callbacks, input ownership, and the overlay container', () => {
    const example = readFileSync(examplePath, 'utf8');

    expect(example).toContain('component: () => ConfirmDialog(dialog.props)');
    expect(example).toContain('if (overlays.hasOverlay())');
    expect(example).toContain('dialog.confirm()');
    expect(example).toContain('dialog.cancel()');
    expect(example).toContain("priority: 'modal'");
    expect(example).toContain('stopPropagation: true');
    expect(example).toContain('OverlayContainer({ stack: overlays })');
  });
});
