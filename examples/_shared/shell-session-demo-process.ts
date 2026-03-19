import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';

export function spawnShellSessionDemoProcess(
  command: string
): ChildProcessWithoutNullStreams | null {
  if (command === 'demo-stream') {
    return spawn(process.execPath, [
      '-e',
      [
        "console.log('demo:start')",
        "setTimeout(() => console.log('demo:middle'), 20)",
        "setTimeout(() => console.log('demo:end'), 40)",
      ].join(';'),
    ]);
  }

  if (command === 'demo-status') {
    return spawn(process.execPath, [
      '-e',
      [
        "setTimeout(() => console.log('status:end'), 250)",
      ].join(';'),
    ]);
  }

  if (command === 'demo-stdin') {
    return spawn(process.execPath, [
      '-e',
      [
        "process.stdin.setEncoding('utf8')",
        "let buffer = ''",
        'const hold = setInterval(() => {}, 1000)',
        "console.log('stdin:ready')",
        "process.stdin.on('data', (chunk) => { buffer += chunk; const parts = buffer.split(/\\r?\\n/); buffer = parts.pop() ?? ''; for (const line of parts) { console.log('stdin:echo ' + line); } })",
        "process.stdin.on('end', () => { if (buffer) console.log('stdin:echo ' + buffer); console.log('stdin:closed'); clearInterval(hold); process.exit(0); })",
        'process.stdin.resume()',
      ].join(';'),
    ]);
  }

  if (command === 'demo-hang') {
    return spawn(process.execPath, [
      '-e',
      [
        "console.log('hang:start')",
        "setTimeout(() => console.log('hang:still-running'), 200)",
        'setInterval(() => {}, 1000)',
      ].join(';'),
    ]);
  }

  return null;
}
