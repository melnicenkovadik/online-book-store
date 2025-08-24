import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import type { OrderDoc } from "@/lib/models/Order";
import { OrderModel } from "@/lib/models/Order";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ number: string }> },
) {
  try {
    await connectToDB();
    const { number } = await ctx.params;
    // @ts-expect-error
    const order = (await OrderModel.findOne({ number })
      .setOptions({ lean: true })
      .exec()) as OrderDoc | null;
    if (!order)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    // Return minimal public-safe info
    return NextResponse.json({
      number: order.number,
      totals: order.totals,
      payment: order.payment,
    });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Unexpected error" },
      { status: 500 },
    );
  }
}
