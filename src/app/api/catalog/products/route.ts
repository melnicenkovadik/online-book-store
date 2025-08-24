import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDB } from '@/lib/db';
import { ProductModel } from '@/lib/models/Product';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q') ?? undefined;
    const categoryId = searchParams.get('categoryId') ?? undefined;
    const page = searchParams.get('page') ? Number(searchParams.get('page')) : undefined;
    const perPage = searchParams.get('perPage') ? Number(searchParams.get('perPage')) : undefined;
    const priceMin = searchParams.get('priceMin') ? Number(searchParams.get('priceMin')) : undefined;
    const priceMax = searchParams.get('priceMax') ? Number(searchParams.get('priceMax')) : undefined;
    const inStock = searchParams.get('inStock') ? searchParams.get('inStock') === 'true' : undefined;
    const onSale = searchParams.get('onSale') ? searchParams.get('onSale') === 'true' : undefined;
    const sort = (searchParams.get('sort') as any) ?? undefined;

    await connectToDB();

    const match: Record<string, any> = {};
    const andExpr: any[] = [];

    if (q) {
      andExpr.push({ title: { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } });
    }
    if (categoryId) {
      try {
        andExpr.push({ categoryIds: new mongoose.Types.ObjectId(categoryId) });
      } catch {
        // ignore invalid ObjectId filter
      }
    }
    if (typeof inStock === 'boolean') {
      andExpr.push(inStock ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } });
    }
    if (typeof onSale === 'boolean') {
      if (onSale) {
        andExpr.push({ $expr: { $and: [ { $ne: ['$salePrice', null] }, { $lt: ['$salePrice', '$price'] } ] } });
      } else {
        andExpr.push({ $or: [ { salePrice: null }, { $expr: { $gte: ['$salePrice', '$price'] } } ] });
      }
    }
    // Price filters on effectivePrice = salePrice ?? price
    const effectivePrice = { $ifNull: ['$salePrice', '$price'] } as const;
    if (typeof priceMin === 'number') {
      andExpr.push({ $expr: { $gte: [effectivePrice, priceMin] } });
    }
    if (typeof priceMax === 'number') {
      andExpr.push({ $expr: { $lte: [effectivePrice, priceMax] } });
    }
    if (andExpr.length) match.$and = andExpr;

    // Sorting
    const sortStage: Record<string, 1 | -1> = {};
    switch (sort) {
      case 'price-asc': sortStage.effectivePrice = 1; break;
      case 'price-desc': sortStage.effectivePrice = -1; break;
      case 'title-asc': sortStage.title = 1; break;
      case 'title-desc': sortStage.title = -1; break;
      case 'newest':
      default:
        sortStage._id = -1; // newest by ObjectId time
    }

    const pageNum = Math.max(1, page ?? 1);
    const per = Math.max(1, Math.min(100, perPage ?? 12));
    const skip = (pageNum - 1) * per;

    const pipeline: any[] = [
      { $addFields: { effectivePrice } },
      match.$and ? { $match: match } : null,
      { $sort: sortStage },
      { $facet: {
          items: [ { $skip: skip }, { $limit: per } ],
          totalArr: [ { $count: 'count' } ],
        } },
      { $project: { items: 1, total: { $ifNull: [{ $arrayElemAt: ['$totalArr.count', 0] }, 0] } } },
    ].filter(Boolean);

    const result = await ProductModel.aggregate(pipeline);
    const agg = result[0] ?? { items: [], total: 0 };

    const items = (agg.items as any[]).map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice ?? null,
      stock: p.stock,
      images: p.images ?? [],
      attributes: p.attributes ?? {},
      categoryIds: (p.categoryIds ?? []).map((cid: mongoose.Types.ObjectId) => cid.toString()),
    }));

    return NextResponse.json({ items, page: pageNum, perPage: per, total: agg.total }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
