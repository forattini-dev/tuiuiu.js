/**
 * Version information for Tuiuiu
 *
 * This module provides version information that can be used by:
 * - CLI (tuiuiu --version)
 * - Library consumers (tuiuiu.version)
 * - Splash screens, about dialogs, etc.
 *
 * The VERSION constant below is automatically updated during the npm publish
 * process via the prepublishOnly script. During development, it falls back
 * to reading from package.json.
 */

// =============================================================================
// VERSION CONSTANT - Updated automatically during publish
// =============================================================================
// This line is auto-updated by scripts/inject-version.js during prepublishOnly
const VERSION = '__INJECT_VERSION__';

// Cached version after first load
let _version: string | null = null;

/**
 * Get the current Tuiuiu version
 * In production: uses the injected VERSION constant
 * In development: reads from package.json
 */
export async function getVersion(): Promise<string> {
  if (_version) return _version;

  // If VERSION was injected during build, use it
  if (VERSION !== '__INJECT_VERSION__') {
    _version = VERSION;
    return _version;
  }

  // Development fallback: read from package.json
  try {
    const pkg = await import('../package.json', { with: { type: 'json' } }) as { default: { version: string } };
    _version = pkg.default?.version || '0.0.0-dev';
  } catch {
    _version = '0.0.0-dev';
  }

  return _version;
}

/**
 * Synchronous version getter
 * Returns cached version or the injected constant
 * Note: May return placeholder if called before getVersion() in development
 */
export function getVersionSync(): string {
  if (_version) return _version;
  if (VERSION !== '__INJECT_VERSION__') return VERSION;
  return '0.0.0-dev';
}

/**
 * Version info object with additional metadata
 */
export interface VersionInfo {
  version: string;
  name: string;
  nodeVersion: string;
  platform: string;
  arch: string;
}

/**
 * Get detailed version information
 */
export async function getVersionInfo(): Promise<VersionInfo> {
  const version = await getVersion();

  return {
    version,
    name: 'tuiuiu.js',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
}

/**
 * Format version info for CLI output
 */
export async function formatVersionInfo(verbose = false): Promise<string> {
  const info = await getVersionInfo();

  if (verbose) {
    return [
      `tuiuiu/${info.version}`,
      `node/${info.nodeVersion.replace('v', '')}`,
      `${info.platform}/${info.arch}`,
    ].join(' ');
  }

  return info.version;
}
