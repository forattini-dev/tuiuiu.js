import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');

// Keep declaration maps and JavaScript source maps for editor/debugger quality,
// but prevent accidental package growth from silently reaching users.
const MAX_DIST_BYTES = 8_500_000;
const MAX_DIST_FILES = 1_150;

function measureDirectory(directory: string): { bytes: number; files: number } {
  let bytes = 0;
  let files = 0;

  for (const entry of readdirSync(directory)) {
    const absolute = path.join(directory, entry);
    const stats = statSync(absolute);
    if (stats.isDirectory()) {
      const nested = measureDirectory(absolute);
      bytes += nested.bytes;
      files += nested.files;
    } else {
      bytes += stats.size;
      files += 1;
    }
  }

  return { bytes, files };
}

const measured = measureDirectory(distDir);
const sizeMiB = (measured.bytes / 1024 / 1024).toFixed(2);
console.log(
  `[check:package-budget] dist contains ${measured.files} files / ${sizeMiB} MiB`,
);

const violations: string[] = [];
if (measured.bytes > MAX_DIST_BYTES) {
  violations.push(
    `${measured.bytes} bytes exceeds the ${MAX_DIST_BYTES}-byte budget`,
  );
}
if (measured.files > MAX_DIST_FILES) {
  violations.push(
    `${measured.files} files exceeds the ${MAX_DIST_FILES}-file budget`,
  );
}

if (violations.length > 0) {
  console.error('[check:package-budget] Package budget exceeded:');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exitCode = 1;
}
