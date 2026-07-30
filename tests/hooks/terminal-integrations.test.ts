import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const integrationMocks = vi.hoisted(() => ({
  getCapabilities: vi.fn(),
  getClipboardWriteSequence: vi.fn(),
  getNotificationSequence: vi.fn(),
}));

vi.mock('../../src/core/capabilities.js', () => ({
  getCapabilities: integrationMocks.getCapabilities,
}));

vi.mock('../../src/core/progressive.js', () => ({
  getClipboardWriteSequence: integrationMocks.getClipboardWriteSequence,
  getNotificationSequence: integrationMocks.getNotificationSequence,
}));

import { setAppContext } from '../../src/hooks/context.js';
import { useClipboard } from '../../src/hooks/use-clipboard.js';
import { useNotification } from '../../src/hooks/use-notification.js';

describe('terminal integration hooks', () => {
  let processWrite: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    integrationMocks.getCapabilities.mockReturnValue({
      clipboard: true,
      notifications: true,
    });
    integrationMocks.getClipboardWriteSequence.mockReturnValue('\u001B]52;c;SGVsbG8=\u0007');
    integrationMocks.getNotificationSequence.mockReturnValue('\u001B]9;Build complete\u0007');
    processWrite = vi.spyOn(process.stdout, 'write').mockImplementation((() => true) as never);
    setAppContext(null);
  });

  afterEach(() => {
    setAppContext(null);
    processWrite.mockRestore();
    vi.clearAllMocks();
  });

  it('writes clipboard sequences to the active app output stream', () => {
    const appWrite = vi.fn(() => true);
    setAppContext({ stdout: { write: appWrite } } as never);

    const clipboard = useClipboard();
    clipboard.copy('Hello');

    expect(clipboard.supported).toBe(true);
    expect(integrationMocks.getClipboardWriteSequence).toHaveBeenCalledWith(
      'Hello',
      expect.objectContaining({ clipboard: true }),
    );
    expect(appWrite).toHaveBeenCalledWith('\u001B]52;c;SGVsbG8=\u0007');
    expect(processWrite).not.toHaveBeenCalled();
  });

  it('falls back to process stdout when no app context exists', () => {
    useClipboard().copy('Hello');
    expect(processWrite).toHaveBeenCalledWith('\u001B]52;c;SGVsbG8=\u0007');
  });

  it('does not write when clipboard support cannot produce a sequence', () => {
    integrationMocks.getCapabilities.mockReturnValue({
      clipboard: false,
      notifications: false,
    });
    integrationMocks.getClipboardWriteSequence.mockReturnValue(null);

    const clipboard = useClipboard();
    clipboard.copy('ignored');

    expect(clipboard.supported).toBe(false);
    expect(processWrite).not.toHaveBeenCalled();
  });

  it('writes notifications to the active app output stream', () => {
    const appWrite = vi.fn(() => true);
    setAppContext({ stdout: { write: appWrite } } as never);

    const notifications = useNotification();
    notifications.notify('Build', 'All tests passed');

    expect(notifications.supported).toBe(true);
    expect(integrationMocks.getNotificationSequence).toHaveBeenCalledWith(
      'Build',
      'All tests passed',
      expect.objectContaining({ notifications: true }),
    );
    expect(appWrite).toHaveBeenCalledWith('\u001B]9;Build complete\u0007');
  });

  it('does not write when notifications are unsupported', () => {
    integrationMocks.getCapabilities.mockReturnValue({
      clipboard: false,
      notifications: false,
    });
    integrationMocks.getNotificationSequence.mockReturnValue('');

    const notifications = useNotification();
    notifications.notify('Ignored');

    expect(notifications.supported).toBe(false);
    expect(processWrite).not.toHaveBeenCalled();
  });
});
