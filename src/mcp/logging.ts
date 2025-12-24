/**
 * Tuiuiu MCP Logging
 *
 * Structured logging system for MCP server that sends log messages
 * to connected clients via notifications.
 */

// =============================================================================
// Types
// =============================================================================

export type MCPLogLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

export interface MCPLogMessage {
  level: MCPLogLevel;
  logger?: string;
  data?: unknown;
}

export interface MCPLogNotification {
  jsonrpc: '2.0';
  method: 'notifications/message';
  params: MCPLogMessage;
}

export type LogSender = (notification: MCPLogNotification) => void;

// =============================================================================
// Logger Implementation
// =============================================================================

/**
 * Create a structured logger for MCP
 */
export function createMCPLogger(
  sender: LogSender | null,
  options: {
    name?: string;
    minLevel?: MCPLogLevel;
    enabled?: boolean;
  } = {}
) {
  const { name = 'tuiuiu', minLevel = 'info', enabled = true } = options;

  const levels: Record<MCPLogLevel, number> = {
    debug: 0,
    info: 1,
    notice: 2,
    warning: 3,
    error: 4,
    critical: 5,
    alert: 6,
    emergency: 7,
  };

  const shouldLog = (level: MCPLogLevel): boolean => {
    if (!enabled || !sender) return false;
    return levels[level] >= levels[minLevel];
  };

  const log = (level: MCPLogLevel, message: string, data?: unknown) => {
    if (!shouldLog(level)) return;

    const logData: Record<string, unknown> = {
      message,
      timestamp: new Date().toISOString(),
    };

    if (data !== undefined) {
      logData.context = data;
    }

    sender!({
      jsonrpc: '2.0',
      method: 'notifications/message',
      params: {
        level,
        logger: name,
        data: logData,
      },
    });
  };

  return {
    debug: (message: string, data?: unknown) => log('debug', message, data),
    info: (message: string, data?: unknown) => log('info', message, data),
    notice: (message: string, data?: unknown) => log('notice', message, data),
    warning: (message: string, data?: unknown) => log('warning', message, data),
    error: (message: string, data?: unknown) => log('error', message, data),
    critical: (message: string, data?: unknown) => log('critical', message, data),
    alert: (message: string, data?: unknown) => log('alert', message, data),
    emergency: (message: string, data?: unknown) => log('emergency', message, data),

    // Convenience methods
    toolCall: (name: string, args?: unknown) => {
      log('info', `Tool called: ${name}`, args ? { arguments: args } : undefined);
    },
    toolResult: (name: string, success: boolean, duration?: number) => {
      log('info', `Tool completed: ${name}`, { success, duration: duration ? `${duration}ms` : undefined });
    },
    promptGet: (name: string, args?: unknown) => {
      log('info', `Prompt retrieved: ${name}`, args ? { arguments: args } : undefined);
    },
    resourceRead: (uri: string) => {
      log('info', `Resource read: ${uri}`);
    },
    sessionStart: () => {
      log('notice', 'MCP session started');
    },
    sessionEnd: () => {
      log('notice', 'MCP session ended');
    },
  };
}

// =============================================================================
// Null Logger (for non-connected mode)
// =============================================================================

export const nullLogger = createMCPLogger(null, { enabled: false });

// =============================================================================
// Progress Notifications
// =============================================================================

export interface MCPProgressToken {
  token: string | number;
}

export interface MCPProgressNotification {
  method: 'notifications/progress';
  params: {
    progressToken: string | number;
    progress: number;
    total?: number;
    message?: string;
  };
}

/**
 * Create a progress reporter for long-running operations
 */
export function createProgressReporter(
  sender: ((notification: MCPProgressNotification) => void) | null,
  token: string | number
) {
  if (!sender) {
    return {
      update: () => {},
      complete: () => {},
    };
  }

  return {
    update: (progress: number, total?: number, message?: string) => {
      sender({
        method: 'notifications/progress',
        params: {
          progressToken: token,
          progress,
          total,
          message,
        },
      });
    },
    complete: (message?: string) => {
      sender({
        method: 'notifications/progress',
        params: {
          progressToken: token,
          progress: 1,
          total: 1,
          message: message || 'Complete',
        },
      });
    },
  };
}

// =============================================================================
// Resource Update Notifications
// =============================================================================

export interface MCPResourceUpdatedNotification {
  method: 'notifications/resources/updated';
  params: {
    uri: string;
  };
}

export interface MCPResourceListChangedNotification {
  method: 'notifications/resources/list_changed';
  params: {};
}

/**
 * Notify clients that resources have been updated
 */
export function createResourceNotifier(
  sender: ((notification: MCPResourceUpdatedNotification | MCPResourceListChangedNotification) => void) | null
) {
  if (!sender) {
    return {
      updated: () => {},
      listChanged: () => {},
    };
  }

  return {
    updated: (uri: string) => {
      sender({
        method: 'notifications/resources/updated',
        params: { uri },
      });
    },
    listChanged: () => {
      sender({
        method: 'notifications/resources/list_changed',
        params: {},
      });
    },
  };
}
