#!/usr/bin/env node
/**
 * Inject version into dist/version.js
 *
 * This script is run during prepublishOnly to replace the placeholder
 * '__INJECT_VERSION__' with the actual version from package.json.
 *
 * This ensures that the published package has the version hardcoded,
 * eliminating the need to include package.json in the published files.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Read version from package.json
const packageJson = JSON.parse(readFileSync(join(rootDir, 'package.json'), 'utf-8'));
const version = packageJson.version;

console.log(`Injecting version ${version} into dist/version.js...`);

// Path to the compiled version.js
const versionJsPath = join(rootDir, 'dist', 'version.js');

try {
  let content = readFileSync(versionJsPath, 'utf-8');

  // Replace the placeholder with actual version
  const placeholder = "__INJECT_VERSION__";
  if (!content.includes(placeholder)) {
    console.log('Warning: Placeholder not found in dist/version.js');
    console.log('The version may already be injected or the file structure changed.');
    process.exit(0);
  }

  // Only replace the first occurrence (the const declaration)
  // The comparison strings should remain as the placeholder
  // This makes the runtime check work:
  // - VERSION = '0.1.1'
  // - VERSION !== '__INJECT_VERSION__' -> true -> uses VERSION!
  content = content.replace(
    `const VERSION = '${placeholder}'`,
    `const VERSION = '${version}'`
  );

  writeFileSync(versionJsPath, content, 'utf-8');

  // Verify
  const newContent = readFileSync(versionJsPath, 'utf-8');
  const hasInjectedVersion = newContent.includes(`const VERSION = '${version}'`);
  const hasPlaceholderInComparison = newContent.includes(`!== '${placeholder}'`);

  if (hasInjectedVersion && hasPlaceholderInComparison) {
    console.log(`✅ Successfully injected version ${version}`);
    console.log(`   VERSION constant: '${version}'`);
    console.log(`   Comparison still checks against placeholder`);
  } else if (hasInjectedVersion) {
    console.log(`✅ Injected version ${version}`);
  } else {
    console.log(`⚠️ Injection may have had issues`);
  }
} catch (error) {
  console.error('Error injecting version:', error.message);
  process.exit(1);
}
