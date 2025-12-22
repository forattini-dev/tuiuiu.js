/**
 * Error Boundary System
 *
 * Provides error handling with detailed error display including:
 * - Error message and stack trace
 * - Source code excerpt around the error location
 * - File path and line number
 *

 */

import type { VNode } from '../utils/types.js';
import { Box, Text } from '../primitives/nodes.js';
import { getContrastColor } from './theme.js';
import * as fs from 'node:fs';
import * as path from 'node:path';

// =============================================================================
// Types
// =============================================================================

export interface ErrorInfo {
  /** The error object */
  error: Error;
  /** Component stack trace */
  componentStack?: string;
}

export interface StackFrame {
  /** Function name */
  function?: string;
  /** File path */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
}

export interface CodeExcerpt {
  /** Line number */
  line: number;
  /** Line content */
  value: string;
  /** Is this the error line? */
  isErrorLine: boolean;
}

// =============================================================================
// Stack Trace Parsing
// =============================================================================

/**
 * Parse a single stack trace line into a StackFrame
 */
export function parseStackLine(line: string): StackFrame | null {
  // Match patterns like:
  // "    at functionName (file:line:column)"
  // "    at file:line:column"
  // "    at functionName (/path/to/file.ts:10:5)"

  const patterns = [
    // Node.js style with function name
    /^\s*at\s+(.+?)\s+\((.+):(\d+):(\d+)\)$/,
    // Node.js style without function name
    /^\s*at\s+(.+):(\d+):(\d+)$/,
    // File URL style
    /^\s*at\s+(.+?)\s+\(file:\/\/(.+):(\d+):(\d+)\)$/,
  ];

  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      if (match.length === 5) {
        // With function name
        return {
          function: match[1],
          file: cleanFilePath(match[2]),
          line: parseInt(match[3], 10),
          column: parseInt(match[4], 10),
        };
      } else if (match.length === 4) {
        // Without function name
        return {
          file: cleanFilePath(match[1]),
          line: parseInt(match[2], 10),
          column: parseInt(match[3], 10),
        };
      }
    }
  }

  return null;
}

/**
 * Parse full stack trace into frames
 */
export function parseStackTrace(stack: string): StackFrame[] {
  const lines = stack.split('\n').slice(1); // Skip first line (error message)
  const frames: StackFrame[] = [];

  for (const line of lines) {
    const frame = parseStackLine(line);
    if (frame) {
      frames.push(frame);
    }
  }

  return frames;
}

/**
 * Clean up file path (remove node_modules, file:// prefix, etc.)
 */
function cleanFilePath(filePath: string): string {
  let cleaned = filePath;

  // Remove file:// prefix
  if (cleaned.startsWith('file://')) {
    cleaned = cleaned.slice(7);
  }

  // Get relative path from cwd
  const cwd = process.cwd();
  if (cleaned.startsWith(cwd)) {
    cleaned = cleaned.slice(cwd.length + 1);
  }

  return cleaned;
}

// =============================================================================
// Source Code Extraction
// =============================================================================

/**
 * Extract source code excerpt around a line number
 */
export function extractCodeExcerpt(
  filePath: string,
  errorLine: number,
  contextLines = 3
): CodeExcerpt[] | null {
  try {
    // Resolve file path
    let resolvedPath = filePath;
    if (!path.isAbsolute(filePath)) {
      resolvedPath = path.join(process.cwd(), filePath);
    }

    // Check if file exists
    if (!fs.existsSync(resolvedPath)) {
      return null;
    }

    // Read file content
    const content = fs.readFileSync(resolvedPath, 'utf-8');
    const lines = content.split('\n');

    // Calculate range
    const startLine = Math.max(1, errorLine - contextLines);
    const endLine = Math.min(lines.length, errorLine + contextLines);

    const excerpt: CodeExcerpt[] = [];
    for (let i = startLine; i <= endLine; i++) {
      excerpt.push({
        line: i,
        value: lines[i - 1] ?? '',
        isErrorLine: i === errorLine,
      });
    }

    return excerpt;
  } catch {
    return null;
  }
}

// =============================================================================
// Error Display Components
// =============================================================================

/**
 * Render an error overview with source code excerpt
 */
export function ErrorOverview(props: { error: Error }): VNode {
  const { error } = props;
  const frames = error.stack ? parseStackTrace(error.stack) : [];
  const origin = frames[0];

  // Extract source code if we have file info
  let excerpt: CodeExcerpt[] | null = null;
  if (origin?.file && origin?.line) {
    excerpt = extractCodeExcerpt(origin.file, origin.line);
  }

  // Calculate line number padding width
  const lineWidth = excerpt
    ? Math.max(...excerpt.map((e) => String(e.line).length))
    : 0;

  return Box(
    { flexDirection: 'column', padding: 1 },

    // Error header
    Box(
      { flexDirection: 'row' },
      Text({ backgroundColor: 'red', color: 'white', bold: true }, ' ERROR '),
      Text({ color: 'white' }, ` ${error.message}`)
    ),

    // File location
    origin?.file && origin?.line
      ? Box(
          { marginTop: 1 },
          Text(
            { color: 'gray' },
            `${origin.file}:${origin.line}${origin.column ? `:${origin.column}` : ''}`
          )
        )
      : null,

    // Source code excerpt
    excerpt
      ? Box(
          { flexDirection: 'column', marginTop: 1 },
          ...excerpt.map((line) =>
            Box(
              { flexDirection: 'row' },
              // Line number
              Text(
                {
                  color: line.isErrorLine ? getContrastColor('red') : 'gray',
                  backgroundColor: line.isErrorLine ? 'red' : undefined,
                },
                ` ${String(line.line).padStart(lineWidth, ' ')} `
              ),
              // Separator
              Text({ color: 'gray' }, '│ '),
              // Code content
              Text(
                {
                  color: line.isErrorLine ? 'white' : 'gray',
                  bold: line.isErrorLine,
                },
                line.value
              )
            )
          )
        )
      : null,

    // Stack trace
    frames.length > 0
      ? Box(
          { flexDirection: 'column', marginTop: 1 },
          Text({ color: 'gray', dim: true }, 'Stack trace:'),
          ...frames.slice(0, 10).map((frame, index) =>
            Box(
              { flexDirection: 'row' },
              Text({ color: 'gray', dim: true }, '  '),
              Text({ color: 'cyan', dim: true }, `${index + 1}. `),
              frame.function
                ? Text({ color: 'yellow', dim: true }, `${frame.function} `)
                : null,
              Text(
                { color: 'gray', dim: true },
                frame.file
                  ? `(${frame.file}:${frame.line ?? '?'}:${frame.column ?? '?'})`
                  : '(unknown)'
              )
            )
          ),
          frames.length > 10
            ? Text(
                { color: 'gray', dim: true },
                `  ... and ${frames.length - 10} more frames`
              )
            : null
        )
      : null
  );
}

// =============================================================================
// Error Boundary State
// =============================================================================

/** Global error state */
let currentError: Error | null = null;
let errorHandlers: ((error: Error) => void)[] = [];

/**
 * Set the current error (triggers error display)
 */
export function setError(error: Error): void {
  currentError = error;
  for (const handler of errorHandlers) {
    handler(error);
  }
}

/**
 * Clear the current error
 */
export function clearError(): void {
  currentError = null;
}

/**
 * Get the current error
 */
export function getError(): Error | null {
  return currentError;
}

/**
 * Register an error handler
 */
export function onError(handler: (error: Error) => void): () => void {
  errorHandlers.push(handler);
  return () => {
    errorHandlers = errorHandlers.filter((h) => h !== handler);
  };
}

/**
 * Wrap a render function with error boundary
 */
export function withErrorBoundary(render: () => VNode): () => VNode {
  return () => {
    try {
      // If there's a current error, show it
      if (currentError) {
        return ErrorOverview({ error: currentError });
      }
      return render();
    } catch (error) {
      // Catch render errors
      const err = error instanceof Error ? error : new Error(String(error));
      setError(err);
      return ErrorOverview({ error: err });
    }
  };
}

/**
 * Try to execute a function and catch errors
 */
export function tryCatch<T>(
  fn: () => T,
  onError?: (error: Error) => void
): T | null {
  try {
    return fn();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      onError(err);
    } else {
      setError(err);
    }
    return null;
  }
}

// =============================================================================
// Reset (for testing)
// =============================================================================

export function resetErrorBoundary(): void {
  currentError = null;
  errorHandlers = [];
}
