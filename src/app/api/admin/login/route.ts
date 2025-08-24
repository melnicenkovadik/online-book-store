import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { password } = await req.json();
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD is not set' }, { status: 500 });
    }
    if (!password || password !== expected) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }
    const res = NextResponse.json({ ok: true }, { status: 200 });
    // Set httpOnly cookie for 1 day
    res.cookies.set('admin_session', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24,
    });
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Unexpected error' }, { status: 400 });
  }
}
