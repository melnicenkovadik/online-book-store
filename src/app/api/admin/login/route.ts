import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const { ADMIN_PASSWORD } = getEnv();
    
    if (!password || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true }, { status: 200 });
    // Set httpOnly cookie for 1 day
    res.cookies.set("admin_session", "1", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (err: unknown) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 400 },
    );
  }
}
