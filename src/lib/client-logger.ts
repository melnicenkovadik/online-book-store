"use client";

import { LogLevel } from "./logger";

/**
 * Client-side logger that sends logs to server
 */
class ClientLogger {
  private readonly endpoint: string;
  private readonly minLevel: LogLevel;
  private readonly batchSize: number;
  private readonly batchInterval: number;
  private logQueue: Record<string, unknown>[] = [];
  private timer: NodeJS.Timeout | null = null;

  constructor(
    endpoint = "/api/log",
    minLevel = LogLevel.INFO,
    batchSize = 10,
    batchInterval = 5000,
  ) {
    this.endpoint = endpoint;
    this.minLevel = minLevel;
    this.batchSize = batchSize;
    this.batchInterval = batchInterval;

    // Setup global error handler
    if (typeof window !== "undefined") {
      window.addEventListener("error", this.handleGlobalError);
      window.addEventListener(
        "unhandledrejection",
        this.handlePromiseRejection,
      );
    }
  }

  /**
   * Log debug message
   */
  public debug(message: string, context?: Record<string, unknown>): void {
    this.log("debug", message, context);
  }

  /**
   * Log info message
   */
  public info(message: string, context?: Record<string, unknown>): void {
    this.log("info", message, context);
  }

  /**
   * Log warning message
   */
  public warn(message: string, context?: Record<string, unknown>): void {
    this.log("warn", message, context);
  }

  /**
   * Log error message
   */
  public error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): void {
    this.log("error", message, context, error);
  }

  /**
   * Internal log method
   */
  private log(
    level: string,
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): void {
    // Skip if below minimum level
    const levelValue = this.getLevelValue(level);
    if (levelValue < this.minLevel) {
      return;
    }

    // Create log entry
    const entry = {
      level,
      message,
      context: {
        ...context,
        url: typeof window !== "undefined" ? window.location.href : undefined,
        userAgent:
          typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      },
      error: error
        ? {
            message: error.message,
            name: error.name,
            stack: error.stack,
          }
        : undefined,
      timestamp: new Date().toISOString(),
    };

    // Add to queue
    this.logQueue.push(entry);

    // Send immediately if error or queue is full
    if (level === "error" || this.logQueue.length >= this.batchSize) {
      this.flushLogs();
    } else if (!this.timer) {
      // Start timer if not already running
      this.timer = setTimeout(() => this.flushLogs(), this.batchInterval);
    }
  }

  /**
   * Send logs to server
   */
  private flushLogs(): void {
    if (this.logQueue.length === 0) return;

    // Clear timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Get logs to send
    const logs = [...this.logQueue];
    this.logQueue = [];

    // Send logs
    fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logs.length === 1 ? logs[0] : logs),
      // Don't wait for response
      keepalive: true,
    }).catch(() => {
      // Silent fail - we don't want logging errors to break the app
    });
  }

  /**
   * Handle global errors
   */
  private handleGlobalError = (event: ErrorEvent): void => {
    this.error(`Uncaught error: ${event.message}`, event.error, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  };

  /**
   * Handle unhandled promise rejections
   */
  private handlePromiseRejection = (event: PromiseRejectionEvent): void => {
    const error =
      event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));
    this.error(`Unhandled promise rejection: ${error.message}`, error);
  };

  /**
   * Convert level string to numeric value
   */
  private getLevelValue(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case "debug":
        return LogLevel.DEBUG;
      case "info":
        return LogLevel.INFO;
      case "warn":
        return LogLevel.WARN;
      case "error":
        return LogLevel.ERROR;
      default:
        return LogLevel.INFO;
    }
  }
}

// Export singleton instance
export const clientLogger = new ClientLogger();
