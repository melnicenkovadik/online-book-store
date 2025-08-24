import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectToDB } from '@/lib/db';
import { OrderModel } from '@/lib/models/Order';
import type { OrderDoc } from '@/lib/models/Order';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get('admin_session')?.value !== '1') return unauthorized();
  await connectToDB();
  const doc = await OrderModel.findById(id)
    .populate({ path: 'items.productId', model: 'Product', select: 'title slug sku price salePrice images' })
    .lean<OrderDoc & { items: any[] }>();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  // Shape items to include product details under `product`
  const items = (doc.items || []).map((it: any) => ({
    productId: String(it.productId?._id || it.productId),
    qty: it.qty,
    // snapshot fields
    title: it.title,
    sku: it.sku,
    image: it.image,
    basePrice: it.basePrice,
    salePrice: it.salePrice ?? null,
    price: it.price,
    product: it.productId && typeof it.productId === 'object' ? {
      id: String(it.productId._id),
      title: it.productId.title,
      slug: it.productId.slug,
      sku: it.productId.sku,
      price: it.productId.price,
      salePrice: it.productId.salePrice ?? null,
      images: Array.isArray(it.productId.images) ? it.productId.images : [],
    } : null,
  }));
  const order: any = { ...doc, id: String((doc as any)._id), items };
  return NextResponse.json(order);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get('admin_session')?.value !== '1') return unauthorized();
  await connectToDB();
  try {
    const body = (await req.json()) as Partial<{ status: string; ttn: string; payment: { status?: string } }>;
    const updates: any = {};
    if (body.status) updates.status = body.status;
    if (body.ttn !== undefined) updates.ttn = body.ttn;
    if (body.payment?.status) updates['payment.status'] = body.payment.status;
    const updated = (await OrderModel.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean<OrderDoc>()) as OrderDoc | null;
    if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ ...updated, id: String(updated._id) });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Invalid body' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const cookieStore = await cookies();
  if (cookieStore.get('admin_session')?.value !== '1') return unauthorized();
  await connectToDB();
  const res = await OrderModel.findByIdAndDelete(id).lean();
  if (!res) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
