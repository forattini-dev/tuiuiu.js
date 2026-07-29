import { spawn } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const RUN_REAL_PTY = process.platform === 'linux' && process.env.TUIUIU_RUN_PTY === 'true';

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

describe.skipIf(!RUN_REAL_PTY)('real PTY lifecycle', () => {
  it('restores terminal modes after interactive exit', async () => {
    const fixture = resolve('tests/fixtures/pty-session-child.mjs');
    const command = `${shellQuote(process.execPath)} ${shellQuote(fixture)}`;
    const child = spawn('script', ['-qfec', command, '/dev/null'], {
      cwd: process.cwd(),
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let output = '';
    let sentExitKey = false;
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk: string) => {
      output += chunk;
      if (!sentExitKey && output.includes('PTY_READY')) {
        sentExitKey = true;
        // `script(1)` keeps its input copier alive until stdin reaches EOF.
        // End the stream with the exit key so both the TUI child and the PTY
        // wrapper can terminate deterministically.
        child.stdin.end('q');
      }
    });
    child.stderr.on('data', (chunk: string) => {
      output += chunk;
    });

    const exitCode = await new Promise<number | null>((resolveExit, reject) => {
      child.once('error', reject);
      child.once('exit', resolveExit);
    });

    expect(exitCode).toBe(0);
    expect(sentExitKey).toBe(true);
    expect(output).toContain('\x1b[?1049h');
    expect(output).toContain('\x1b[?2004h');
    expect(output).toContain('\x1b[?2004l');
    expect(output).toContain('\x1b[?1049l');
    expect(output).toContain('\x1b[?25h');
    expect(output).toContain('PTY_CLEAN_EXIT');

    const restoredAlternateScreenAt = output.lastIndexOf('\x1b[?1049l');
    const cleanExitAt = output.lastIndexOf('PTY_CLEAN_EXIT');
    expect(restoredAlternateScreenAt).toBeLessThan(cleanExitAt);
  }, 15_000);
});
