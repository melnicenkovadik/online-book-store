import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

// Set secure HttpOnly cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
  maxAge: 24 * 60 * 60, // 24 hours
};

// Simple rate limiting for login attempts
const MAX_LOGIN_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const loginAttempts = new Map<string, { count: number; timestamp: number }>();

export async function POST(req: Request) {
  try {
    // Get client IP for rate limiting
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Check rate limiting
    const now = Date.now();
    const attempts = loginAttempts.get(ip);

    if (attempts && now - attempts.timestamp < RATE_LIMIT_WINDOW) {
      if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
        return NextResponse.json(
          { error: "Too many login attempts. Please try again later." },
          { status: 429 },
        );
      }

      loginAttempts.set(ip, {
        count: attempts.count + 1,
        timestamp: attempts.timestamp,
      });
    } else {
      loginAttempts.set(ip, { count: 1, timestamp: now });
    }

    const body = await req.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: "Password is required" },
        { status: 400 },
      );
    }

    const { ADMIN_PASSWORD } = getEnv();

    // Simple authentication check
    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    // Reset login attempts on successful login
    loginAttempts.delete(ip);

    // Set HttpOnly cookie with simple flag (1 means authenticated)
    const response = NextResponse.json(
      { success: true, message: "Login successful" },
      { status: 200 },
    );

    response.cookies.set("admin_session", "1", COOKIE_OPTIONS);

    return response;
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 },
    );
  }
}
