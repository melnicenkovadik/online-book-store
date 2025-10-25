import { type NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/error-handler";
import { logger } from "@/lib/logger";

/**
 * Wrapper for API route handlers to catch and process errors
 * @param handler API route handler function
 * @returns Wrapped handler function
 */
export function withErrorHandling(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      // Get request info for logging
      const requestInfo = {
        url: req.url,
        method: req.method,
        ip: req.ip || "unknown",
      };

      // Handle error and get standardized response
      const { statusCode, body } = handleApiError(error, requestInfo);

      // Return error response
      return NextResponse.json(body, { status: statusCode });
    }
  };
}

/**
 * Global error logger for client-side errors
 * @param req Request object
 * @returns Response
 */
export async function clientErrorLogger(
  req: NextRequest,
): Promise<NextResponse> {
  try {
    const body = await req.json();
    const { message, stack, url, userAgent } = body;

    logger.error(`Client Error: ${message}`, new Error(stack), {
      url,
      userAgent,
      clientError: true,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Error logging client error", error as Error);
    return NextResponse.json({ error: "Failed to log error" }, { status: 500 });
  }
}
