/**
 * Simple logging system with different log levels and formatting
 */

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

// Logger configuration
interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteUrl?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  minLevel:
    process.env.NODE_ENV === "production" ? LogLevel.INFO : LogLevel.DEBUG,
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === "production",
  remoteUrl: process.env.LOG_ENDPOINT,
};

// In-memory log storage for development
const logHistory: LogEntry[] = [];
const MAX_LOG_HISTORY = 1000;

// Logger class
export class Logger {
  private config: LoggerConfig;
  private static instance: Logger;

  private constructor(config: LoggerConfig = defaultConfig) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Get singleton logger instance
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Update logger configuration
   */
  public configure(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Log a debug message
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log an info message
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log a warning message
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log an error message
   */
  public error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  /**
   * Get recent log history (development only)
   */
  public getHistory(): LogEntry[] {
    return [...logHistory];
  }

  /**
   * Clear log history
   */
  public clearHistory(): void {
    logHistory.length = 0;
  }

  /**
   * Internal log method
   */
  private log(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    // Skip if below minimum level
    if (level < this.config.minLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const entry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      error,
    };

    // Store in memory (limited size)
    if (logHistory.length >= MAX_LOG_HISTORY) {
      logHistory.shift();
    }
    logHistory.push(entry);

    // Console output
    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    // Remote logging
    if (this.config.enableRemote && this.config.remoteUrl) {
      this.logToRemote(entry).catch((e) => {
        // Fallback to console if remote logging fails
        console.error("Remote logging failed:", e);
      });
    }
  }

  /**
   * Format and log to console
   */
  private logToConsole(entry: LogEntry): void {
    const { timestamp, level, message, context, error } = entry;

    let levelStr: string;
    let consoleMethod: "log" | "info" | "warn" | "error";

    switch (level) {
      case LogLevel.DEBUG:
        levelStr = "[DEBUG]";
        consoleMethod = "log";
        break;
      case LogLevel.INFO:
        levelStr = "[INFO]";
        consoleMethod = "info";
        break;
      case LogLevel.WARN:
        levelStr = "[WARN]";
        consoleMethod = "warn";
        break;
      case LogLevel.ERROR:
        levelStr = "[ERROR]";
        consoleMethod = "error";
        break;
      default:
        levelStr = "[UNKNOWN]";
        consoleMethod = "log";
    }

    // Format: [LEVEL] TIMESTAMP - MESSAGE
    const logMessage = `${levelStr} ${timestamp} - ${message}`;

    if (context || error) {
      console[consoleMethod](logMessage, {
        ...(context ? { context } : {}),
        ...(error ? { error } : {}),
      });
    } else {
      console[consoleMethod](logMessage);
    }
  }

  /**
   * Send log to remote endpoint
   */
  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteUrl) return;

    try {
      // Don't send sensitive data to remote logging
      const safeEntry = {
        ...entry,
        context: entry.context ? this.sanitizeData(entry.context) : undefined,
        error: entry.error
          ? {
              message: entry.error.message,
              name: entry.error.name,
              stack: entry.error.stack,
            }
          : undefined,
      };

      await fetch(this.config.remoteUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(safeEntry),
        // Don't wait for response
        keepalive: true,
      });
    } catch (_error) {
      // Silent fail - we don't want logging errors to break the app
    }
  }

  /**
   * Remove sensitive data from logs
   */
  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "key",
      "auth",
      "cookie",
    ];
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
        result[key] = "[REDACTED]";
      } else if (typeof value === "object" && value !== null) {
        result[key] = this.sanitizeData(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
