import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { OrderModel } from '@/lib/models/Order';
import type { OrderDoc } from '@/lib/models/Order';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ number: string }> }) {
  try {
    await connectToDB();
    const { number } = await ctx.params;
    const order = (await OrderModel.findOne({ number }).lean<OrderDoc>()) as OrderDoc | null;
    if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    // Return minimal public-safe info
    return NextResponse.json({ number: order.number, totals: order.totals, payment: order.payment });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 });
  }
}
