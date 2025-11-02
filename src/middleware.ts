import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const MAX_REQUESTS_PER_WINDOW = {
  api: 60, // 60 requests per minute for API routes
  auth: 10, // 10 requests per minute for auth routes
  default: 120, // 120 requests per minute for other routes
};

// In-memory store for rate limiting
// In production, use Redis or similar for distributed environments
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Clean up the in-memory store every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(
    () => {
      const now = Date.now();
      for (const [ip, data] of ipRequestCounts.entries()) {
        if (now - data.timestamp > RATE_LIMIT_WINDOW) {
          ipRequestCounts.delete(ip);
        }
      }
    },
    5 * 60 * 1000,
  );
}

export async function middleware(request: NextRequest) {
  // Check admin API authentication
  if (
    request.nextUrl.pathname.startsWith("/api/admin") &&
    !request.nextUrl.pathname.startsWith("/api/admin/login")
  ) {
    const token = request.cookies.get("admin_session");

    if (!token?.value || token.value !== "1") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const response = NextResponse.next();

  // Set security headers
  response.headers.set("X-DNS-Prefetch-Control", "on");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "origin-when-cross-origin");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Set CSP header - разные настройки для dev и production
  const isDev = process.env.NODE_ENV === "development";
  const cspDirectives = [
    "default-src 'self'",
    // В dev режиме нужен unsafe-eval для React Fast Refresh
    isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https://res.cloudinary.com https://picsum.photos https://knigovan.com",
    "font-src 'self' data: https://r2cdn.perplexity.ai",
    // В dev режиме нужен webpack-hmr и localhost
    isDev
      ? "connect-src 'self' ws://localhost:* wss://localhost:* http://localhost:*"
      : "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ];

  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  // Set Permissions Policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );

  // CORS for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set(
      "Access-Control-Allow-Origin",
      request.headers.get("origin") || "*",
    );
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS",
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization",
    );
    response.headers.set("Access-Control-Max-Age", "86400");

    // Handle preflight requests
    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    // Rate limiting for API routes
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const now = Date.now();
    const pathType = request.nextUrl.pathname.startsWith("/api/admin/login")
      ? "auth"
      : "api";
    const maxRequests =
      MAX_REQUESTS_PER_WINDOW[pathType] || MAX_REQUESTS_PER_WINDOW.default;

    const ipData = ipRequestCounts.get(ip);

    if (!ipData || now - ipData.timestamp > RATE_LIMIT_WINDOW) {
      // Reset counter for new window
      ipRequestCounts.set(ip, { count: 1, timestamp: now });
    } else if (ipData.count >= maxRequests) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded" }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
            ...Object.fromEntries(response.headers.entries()),
          },
        },
      );
    } else {
      // Increment counter
      ipRequestCounts.set(ip, {
        count: ipData.count + 1,
        timestamp: ipData.timestamp,
      });
    }
  }

  return response;
}

// Apply middleware to all routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
