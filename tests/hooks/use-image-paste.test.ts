import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const imagePasteMocks = vi.hoisted(() => ({
  createTerminalImageSource: vi.fn(), extractImagePaths: vi.fn(), loadImageFile: vi.fn(), loadTerminalImageSourceFromFile: vi.fn(), readClipboardImage: vi.fn(), scaleImage: vi.fn(), }));

vi.mock('../../src/core/image-file.js', () => ({
  extractImagePaths: imagePasteMocks.extractImagePaths, loadImageFile: imagePasteMocks.loadImageFile, loadTerminalImageSourceFromFile: imagePasteMocks.loadTerminalImageSourceFromFile, }));

vi.mock('../../src/core/graphics.js', () => ({
  createTerminalImageSource: imagePasteMocks.createTerminalImageSource, scaleImage: imagePasteMocks.scaleImage, }));

vi.mock('../../src/core/clipboard-image.js', () => ({
  readClipboardImage: imagePasteMocks.readClipboardImage, }));

import {
  beginRender, endRender, resetHookState } from '../../src/hooks/context.js';
import { resetTestInteractions, dispatchTestPaste } from '../../src/testing/interaction.js';
import { useImagePaste } from '../../src/hooks/use-image-paste.js';

function renderImagePaste(
  handler: Parameters<typeof useImagePaste>[0],
  options?: Parameters<typeof useImagePaste>[1],
): void {
  beginRender();
  useImagePaste(handler, options);
  endRender();
}

describe('useImagePaste', () => {
  beforeEach(() => {
    resetHookState();
    resetTestInteractions();
    imagePasteMocks.extractImagePaths.mockReturnValue([]);
    imagePasteMocks.readClipboardImage.mockResolvedValue(null);
    imagePasteMocks.createTerminalImageSource.mockImplementation((imageData) => ({
      ...imageData,
      cellWidth: imageData.width,
      cellHeight: imageData.height,
    }));
    imagePasteMocks.scaleImage.mockImplementation((imageData, width, height) => ({
      ...imageData,
      width,
      height,
    }));
  });

  afterEach(() => {
    resetHookState();
    resetTestInteractions();
    vi.clearAllMocks();
  });

  it('loads pasted image paths, constrains dimensions, and reports media type', async () => {
    imagePasteMocks.extractImagePaths.mockReturnValue(['C:/tmp/photo.jpg']);
    imagePasteMocks.loadTerminalImageSourceFromFile.mockResolvedValue({
      pixels: new Uint8Array(8 * 4 * 4),
      width: 8,
      height: 4,
    });
    const handler = vi.fn();
    renderImagePaste(handler, { maxWidth: 4, maxHeight: 4 });

    dispatchTestPaste('C:/tmp/photo.jpg', true);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    expect(imagePasteMocks.scaleImage).toHaveBeenCalledWith(
      expect.objectContaining({ width: 8, height: 4 }),
      4,
      2,
    );
    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      sourcePath: 'C:/tmp/photo.jpg',
      mediaType: 'image/jpeg',
      width: 4,
      height: 2,
    }));
  });

  it('lets non-image paste events continue through the handler chain', () => {
    const handler = vi.fn();
    renderImagePaste(handler);

    dispatchTestPaste('ordinary text', true);

    expect(handler).not.toHaveBeenCalled();
    expect(imagePasteMocks.readClipboardImage).not.toHaveBeenCalled();
  });

  it('reads image data from an empty bracketed clipboard paste', async () => {
    imagePasteMocks.readClipboardImage.mockResolvedValue({
      buffer: Buffer.from([1, 2, 3]),
      mediaType: 'image/png',
    });
    imagePasteMocks.loadImageFile.mockResolvedValue({
      pixels: new Uint8Array(2 * 2 * 4),
      width: 2,
      height: 2,
    });
    const handler = vi.fn();
    renderImagePaste(handler);

    dispatchTestPaste('', true);
    await vi.waitFor(() => expect(handler).toHaveBeenCalledTimes(1));

    expect(handler).toHaveBeenCalledWith(expect.objectContaining({
      mediaType: 'image/png',
      width: 2,
      height: 2,
    }));
  });

  it('ignores invalid files and clipboard failures', async () => {
    imagePasteMocks.extractImagePaths.mockReturnValue(['/missing.webp']);
    imagePasteMocks.loadTerminalImageSourceFromFile.mockRejectedValue(new Error('missing'));
    imagePasteMocks.readClipboardImage.mockRejectedValue(new Error('clipboard unavailable'));
    const handler = vi.fn();
    renderImagePaste(handler);

    dispatchTestPaste('/missing.webp', true);
    imagePasteMocks.extractImagePaths.mockReturnValue([]);
    dispatchTestPaste('', true);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(handler).not.toHaveBeenCalled();
  });

  it('does not register work while inactive', () => {
    const handler = vi.fn();
    renderImagePaste(handler, { isActive: false });

    dispatchTestPaste('/tmp/image.png', true);

    expect(imagePasteMocks.extractImagePaths).not.toHaveBeenCalled();
    expect(handler).not.toHaveBeenCalled();
  });
});
