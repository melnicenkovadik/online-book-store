import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { ProductModel } from '@/lib/models/Product';
import mongoose from 'mongoose';
import type { Product } from '@/types/catalog';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const doc: any = await ProductModel.findById(id).lean();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const item: Product = {
    id: String(doc._id),
    title: doc.title,
    slug: doc.slug,
    sku: doc.sku,
    price: doc.price,
    salePrice: doc.salePrice ?? undefined,
    stock: doc.stock,
    images: doc.images || [],
    attributes: doc.attributes || {},
    categoryIds: (doc.categoryIds || []).map((cid: any) => String(cid)),
  };
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<Product>;
    const update: any = {};
    if (body.title !== undefined) update.title = String(body.title);
    if (body.slug !== undefined) update.slug = String(body.slug).trim();
    if (body.sku !== undefined) update.sku = String(body.sku);
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.salePrice !== undefined) {
      const saleRaw: any = (body as any).salePrice;
      const saleParsed = saleRaw === '' || saleRaw == null ? null : Number(saleRaw);
      update.salePrice = isNaN(saleParsed as number) ? null : (saleParsed as number);
    }
    if (body.stock !== undefined) update.stock = Number(body.stock);
    if (body.images !== undefined) update.images = Array.isArray(body.images) ? body.images : [];
    if ((body as any).attributes !== undefined) update.attributes = (body as any).attributes || {};
    if (body.categoryIds !== undefined) {
      update.categoryIds = Array.isArray(body.categoryIds)
        ? (body.categoryIds as string[])
            .filter(Boolean)
            .map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null))
            .filter(Boolean)
        : [];
    }
    const doc: any = await ProductModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const next: Product = {
      id: String(doc._id),
      title: doc.title,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      salePrice: doc.salePrice ?? undefined,
      stock: doc.stock,
      images: doc.images || [],
      attributes: doc.attributes || {},
      categoryIds: (doc.categoryIds || []).map((cid: any) => String(cid)),
    };
    return NextResponse.json(next);
  } catch (e: any) {
    if (e?.code === 11000) return NextResponse.json({ error: 'slug must be unique' }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Invalid body' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const removed: any = await ProductModel.findByIdAndDelete(id).lean();
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const payload: Product = {
    id: String(removed._id),
    title: removed.title,
    slug: removed.slug,
    sku: removed.sku,
    price: removed.price,
    salePrice: removed.salePrice ?? undefined,
    stock: removed.stock,
    images: removed.images || [],
    attributes: removed.attributes || {},
    categoryIds: (removed.categoryIds || []).map((cid: any) => String(cid)),
  };
  return NextResponse.json({ ok: true, removed: payload });
}
