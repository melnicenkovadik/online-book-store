import { NextResponse } from 'next/server';
import { connectToDB, dbState } from '@/lib/db';

export async function GET() {
  try {
    await connectToDB();
    const state = dbState();
    return NextResponse.json({ ok: true, dbState: state }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
