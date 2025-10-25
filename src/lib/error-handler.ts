import { logger } from "./logger";

/**
 * Error types for better error handling and monitoring
 */
export enum ErrorType {
  VALIDATION = "validation_error",
  DATABASE = "database_error",
  NETWORK = "network_error",
  AUTHENTICATION = "authentication_error",
  AUTHORIZATION = "authorization_error",
  NOT_FOUND = "not_found_error",
  API = "api_error",
  INTERNAL = "internal_error",
  EXTERNAL = "external_service_error",
}

/**
 * Custom error class with additional context
 */
export class AppError extends Error {
  type: ErrorType;
  statusCode: number;
  context?: Record<string, unknown>;
  originalError?: Error;

  constructor(
    message: string,
    type: ErrorType = ErrorType.INTERNAL,
    statusCode = 500,
    context?: Record<string, unknown>,
    originalError?: Error,
  ) {
    super(message);
    this.name = "AppError";
    this.type = type;
    this.statusCode = statusCode;
    this.context = context;
    this.originalError = originalError;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Global error handler for API routes
 * @param error Error to handle
 * @param requestInfo Additional request context
 * @returns Standardized error response
 */
export function handleApiError(
  error: unknown,
  requestInfo?: {
    url?: string;
    method?: string;
    ip?: string;
    userId?: string;
  },
): { statusCode: number; body: Record<string, unknown> } {
  // Convert unknown error to AppError
  let appError: AppError;

  if (error instanceof AppError) {
    appError = error;
  } else if (error instanceof Error) {
    appError = new AppError(
      error.message,
      ErrorType.INTERNAL,
      500,
      undefined,
      error,
    );
  } else {
    appError = new AppError(
      typeof error === "string" ? error : "An unknown error occurred",
      ErrorType.INTERNAL,
      500,
    );
  }

  // Log error with context
  logger.error(`API Error: ${appError.message}`, appError, {
    ...appError.context,
    errorType: appError.type,
    statusCode: appError.statusCode,
    ...requestInfo,
  });

  // Return standardized error response
  return {
    statusCode: appError.statusCode,
    body: {
      error: {
        message: appError.message,
        type: appError.type,
        ...(process.env.NODE_ENV !== "production" && appError.originalError
          ? { stack: appError.originalError.stack }
          : {}),
      },
    },
  };
}

/**
 * Create a validation error
 * @param message Error message
 * @param context Validation context
 * @returns AppError instance
 */
export function createValidationError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(message, ErrorType.VALIDATION, 400, context);
}

/**
 * Create a not found error
 * @param message Error message
 * @param context Additional context
 * @returns AppError instance
 */
export function createNotFoundError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(message, ErrorType.NOT_FOUND, 404, context);
}

/**
 * Create an authentication error
 * @param message Error message
 * @param context Additional context
 * @returns AppError instance
 */
export function createAuthenticationError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(message, ErrorType.AUTHENTICATION, 401, context);
}

/**
 * Create an authorization error
 * @param message Error message
 * @param context Additional context
 * @returns AppError instance
 */
export function createAuthorizationError(
  message: string,
  context?: Record<string, unknown>,
): AppError {
  return new AppError(message, ErrorType.AUTHORIZATION, 403, context);
}
