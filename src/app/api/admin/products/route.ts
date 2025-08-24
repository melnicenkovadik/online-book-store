import { NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { ProductModel } from '@/lib/models/Product';
import mongoose from 'mongoose';
import type { Product } from '@/types/catalog';

function parseBool(val: string | null) {
  if (val == null) return undefined;
  return val === 'true' ? true : val === 'false' ? false : undefined;
}

export async function GET(req: Request) {
  await connectToDB();
  const url = new URL(req.url);
  const q = url.searchParams.get('q') || undefined;
  const categoryId = url.searchParams.get('categoryId') || undefined;
  const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
  const perPage = Math.max(1, Number(url.searchParams.get('perPage') || '20'));
  const priceMin = url.searchParams.get('priceMin');
  const priceMax = url.searchParams.get('priceMax');
  const inStock = parseBool(url.searchParams.get('inStock'));
  const onSale = parseBool(url.searchParams.get('onSale'));
  const sort = (url.searchParams.get('sort') || 'newest') as any;

  const match: any = {};
  if (q) {
    const rx = new RegExp(q, 'i');
    match.$or = [{ title: rx }, { 'attributes.author': rx }, { 'attributes.publisher': rx }];
  }
  if (categoryId && mongoose.isValidObjectId(categoryId)) {
    match.categoryIds = new mongoose.Types.ObjectId(categoryId);
  }
  if (inStock) match.stock = { $gt: 0 };
  if (onSale) match.$expr = { $and: [{ $ne: ['$salePrice', null] }, { $lt: ['$salePrice', '$price'] }] };

  const pipeline: any[] = [{ $match: match }, { $addFields: { effectivePrice: { $ifNull: ['$salePrice', '$price'] } } }];
  if (priceMin != null) pipeline.push({ $match: { effectivePrice: { $gte: Number(priceMin) } } });
  if (priceMax != null) pipeline.push({ $match: { effectivePrice: { $lte: Number(priceMax) } } });

  const sortStage: Record<string, 1 | -1> = {};
  switch (sort) {
    case 'price-asc':
      sortStage.effectivePrice = 1; break;
    case 'price-desc':
      sortStage.effectivePrice = -1; break;
    case 'title-asc':
      sortStage.title = 1; break;
    case 'title-desc':
      sortStage.title = -1; break;
    case 'newest':
    default:
      sortStage._id = -1; break;
  }

  pipeline.push(
    { $sort: sortStage },
    {
      $facet: {
        items: [
          { $skip: (page - 1) * perPage },
          { $limit: perPage },
          {
            $project: {
              _id: 1,
              title: 1,
              slug: 1,
              sku: 1,
              price: 1,
              salePrice: 1,
              stock: 1,
              images: 1,
              attributes: 1,
              categoryIds: 1,
            },
          },
        ],
        total: [{ $count: 'count' }],
      },
    },
  );

  const agg = await ProductModel.aggregate(pipeline);
  const first = agg[0] || { items: [], total: [] };
  const total = first.total[0]?.count || 0;
  const items = first.items.map((d: any) => ({
    id: String(d._id),
    title: d.title,
    slug: d.slug,
    sku: d.sku,
    price: d.price,
    salePrice: d.salePrice ?? undefined,
    stock: d.stock,
    images: d.images || [],
    attributes: d.attributes || {},
    categoryIds: (d.categoryIds || []).map((cid: any) => String(cid)),
  }));

  return NextResponse.json({ items, page, perPage, total });
}

export async function POST(req: Request) {
  await connectToDB();
  try {
    const body = (await req.json()) as Partial<Product>;
    if (!body.title || body.price == null) {
      return NextResponse.json({ error: 'title and price are required' }, { status: 400 });
    }
    // Generate ObjectId and use it as slug
    const _id = new mongoose.Types.ObjectId();
    const slug = _id.toString();
    const catIds = Array.isArray(body.categoryIds)
      ? (body.categoryIds as string[]).filter(Boolean).map((id) => (mongoose.isValidObjectId(id) ? new mongoose.Types.ObjectId(id) : null)).filter(Boolean) as mongoose.Types.ObjectId[]
      : [];
    const saleRaw: any = (body as any).salePrice;
    const saleParsed = saleRaw === '' || saleRaw == null ? null : Number(saleRaw);
    const created = await ProductModel.create({
      _id,
      title: String(body.title),
      slug,
      sku: body.sku ? String(body.sku) : slug,
      price: Number(body.price),
      salePrice: isNaN(saleParsed as number) ? null : (saleParsed as number),
      stock: Number(body.stock ?? 0),
      images: Array.isArray(body.images) ? (body.images as string[]) : [],
      attributes: (body as any).attributes || {},
      categoryIds: catIds,
    });
    const product: Product = {
      id: String(created._id),
      title: created.title,
      slug: created.slug,
      sku: created.sku,
      price: created.price,
      salePrice: created.salePrice ?? undefined,
      stock: created.stock,
      images: created.images || [],
      attributes: created.attributes || {},
      categoryIds: created.categoryIds.map((cid: any) => String(cid)),
    };
    return NextResponse.json(product, { status: 201 });
  } catch (e: any) {
    if (e?.code === 11000) return NextResponse.json({ error: 'slug must be unique' }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Invalid body' }, { status: 400 });
  }
}
