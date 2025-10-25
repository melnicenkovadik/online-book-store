import { type NextRequest, NextResponse } from "next/server";
import { logger } from "@/lib/logger";

/**
 * API endpoint for client-side error logging
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = await req.json();

    // Validate required fields
    if (!body.level || !body.message) {
      return NextResponse.json(
        { error: "Invalid log data. Required fields: level, message" },
        { status: 400 },
      );
    }

    // Extract log data
    const { level, message, context, error } = body;

    // Add client metadata
    const clientContext = {
      ...context,
      userAgent: req.headers.get("user-agent") || "unknown",
      ip: req.ip || "unknown",
      referer: req.headers.get("referer") || "unknown",
      timestamp: new Date().toISOString(),
    };

    // Log based on level
    switch (level.toLowerCase()) {
      case "debug":
        logger.debug(message, clientContext);
        break;
      case "info":
        logger.info(message, clientContext);
        break;
      case "warn":
        logger.warn(message, clientContext);
        break;
      case "error":
        logger.error(
          message,
          error ? new Error(error.message) : undefined,
          clientContext,
        );
        break;
      default:
        logger.info(message, clientContext);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error("Error processing client log", err as Error);
    return NextResponse.json(
      { error: "Failed to process log" },
      { status: 500 },
    );
  }
}

/**
 * Rate limiting for log endpoint
 */
export async function OPTIONS(_req: NextRequest): Promise<NextResponse> {
  return NextResponse.json({}, { status: 200 });
}
