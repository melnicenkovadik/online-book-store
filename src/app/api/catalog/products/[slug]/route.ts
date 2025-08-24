import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/db';
import { ProductModel, type ProductDoc } from '@/lib/models/Product';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await ctx.params;
    await connectToDB();
    const doc = await ProductModel.findOne({ slug }).lean<ProductDoc & { _id: mongoose.Types.ObjectId }>();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const product = {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      salePrice: doc.salePrice ?? null,
      stock: doc.stock,
      images: doc.images ?? [],
      attributes: (doc as any).attributes ?? {},
      categoryIds: (doc.categoryIds ?? []).map((cid: any) => cid.toString()),
    };
    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
