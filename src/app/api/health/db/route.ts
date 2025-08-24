import { NextResponse } from "next/server";
import { connectToDB, dbState } from "@/lib/db";

export async function GET() {
  try {
    await connectToDB();
    return NextResponse.json({ ok: true, state: dbState() });
  } catch (e: unknown) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "DB connect error",
        state: dbState(),
      },
      { status: 500 },
    );
  }
}
