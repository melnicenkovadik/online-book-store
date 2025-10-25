import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Verify admin authentication from cookies
 * @returns Boolean indicating if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token?.value) {
    return false;
  }

  // In production, validate token properly (JWT verification, DB check, etc.)
  // For now, just check if token exists
  return true;
}

/**
 * Middleware to protect admin routes
 * @param request Next.js request
 * @returns Response or undefined to continue
 */
export function adminAuthMiddleware(request: NextRequest) {
  // Check if this is an API route that requires authentication
  if (
    request.nextUrl.pathname.startsWith("/api/admin") &&
    !request.nextUrl.pathname.startsWith("/api/admin/login")
  ) {
    const token = request.cookies.get("admin_token");

    if (!token?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // In production, validate token properly here
  }

  // Check if this is an admin UI route that requires authentication
  if (request.nextUrl.pathname.startsWith("/admin/(protected)")) {
    const token = request.cookies.get("admin_token");

    if (!token?.value) {
      // Redirect to login page
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  // Continue processing request
  return undefined;
}

/**
 * Get current admin user from token
 * @returns Admin user info or null
 */
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");

  if (!token?.value) {
    return null;
  }

  // In production, decode token and return user info
  // For now, return placeholder
  return {
    username: "admin",
    role: "admin",
  };
}
