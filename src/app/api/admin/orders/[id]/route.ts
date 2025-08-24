import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import type { OrderDoc } from "@/lib/models/Order";
import { OrderModel } from "@/lib/models/Order";

function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") return unauthorized();
  await connectToDB();
  // @ts-expect-error - mongoose типи складні для TypeScript
  const raw = await OrderModel.findById(id)
    .populate({
      path: "items.productId",
      model: "Product",
      select: "title slug sku price salePrice images",
    })
    .setOptions({ lean: true })
    .exec();
  type PopulatedItem = {
    productId:
      | {
          _id: unknown;
          title: string;
          slug: string;
          sku: string;
          price: number;
          salePrice?: number | null;
          images?: string[];
        }
      | unknown;
    qty: number;
    title: string;
    sku?: string;
    image?: string;
    basePrice: number;
    salePrice?: number | null;
    price: number;
  };
  const doc = raw as (OrderDoc & { items: PopulatedItem[] }) | null;
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const items = (doc.items || []).map((it) => ({
    productId: String(it.productId?._id || it.productId),
    qty: it.qty,
    title: it.title,
    sku: it.sku,
    image: it.image,
    basePrice: it.basePrice,
    salePrice: it.salePrice ?? null,
    price: it.price,
    product:
      it.productId &&
      typeof it.productId === "object" &&
      "title" in it.productId
        ? {
            id: String((it.productId as any)._id),

            title: (it.productId as any).title,

            slug: (it.productId as any).slug,

            sku: (it.productId as any).sku,

            price: (it.productId as any).price,

            salePrice: (it.productId as any).salePrice ?? null,

            images: Array.isArray((it.productId as any).images)
              ? (it.productId as any).images
              : [],
          }
        : null,
  }));
  const order = { ...doc, id: String((doc as { _id: unknown })._id), items };
  return NextResponse.json(order);
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") return unauthorized();
  await connectToDB();
  try {
    const body = (await req.json()) as Partial<{
      status: string;
      ttn: string;
      payment: { status?: string };
    }>;
    const updates: Record<string, unknown> = {};
    if (body.status) updates.status = body.status;
    if (body.ttn !== undefined) updates.ttn = body.ttn;
    if (body.payment?.status) updates["payment.status"] = body.payment.status;
    // @ts-expect-error - mongoose типи складні для TypeScript
    const updated = (await OrderModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    )
      .setOptions({ lean: true })
      .exec()) as OrderDoc | null;
    if (!updated)
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ...updated, id: String(updated._id) });
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid body" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get("admin_session")?.value !== "1") return unauthorized();
  await connectToDB();
  // @ts-expect-error - mongoose типи складні для TypeScript
  const res = await OrderModel.findByIdAndDelete(id)
    .setOptions({ lean: true })
    .exec();
  if (!res) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
