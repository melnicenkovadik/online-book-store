import type { PipelineStage } from "mongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";

// Set cache control headers for 5 minutes
const CACHE_CONTROL_HEADER = "public, s-maxage=300, stale-while-revalidate=600";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
    const page = searchParams.get("page")
      ? Number(searchParams.get("page"))
      : undefined;
    const perPage = searchParams.get("perPage")
      ? Number(searchParams.get("perPage"))
      : undefined;
    const priceMin = searchParams.get("priceMin")
      ? Number(searchParams.get("priceMin"))
      : undefined;
    const priceMax = searchParams.get("priceMax")
      ? Number(searchParams.get("priceMax"))
      : undefined;
    const inStock = searchParams.get("inStock")
      ? searchParams.get("inStock") === "true"
      : undefined;
    const onSale = searchParams.get("onSale")
      ? searchParams.get("onSale") === "true"
      : undefined;
    const sort = (searchParams.get("sort") ?? undefined) as
      | "price-asc"
      | "price-desc"
      | "title-asc"
      | "title-desc"
      | "newest"
      | undefined;

    await connectToDB();

    const match: Record<string, unknown> = {};
    const andExpr: Record<string, unknown>[] = [];

    // Use text index for search when available
    if (q) {
      if (q.length >= 3) {
        // Use text search for longer queries
        andExpr.push({ $text: { $search: q } });
      } else {
        // Use regex for shorter queries
        andExpr.push({
          title: {
            $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
            $options: "i",
          },
        });
      }
    }

    if (categoryId) {
      try {
        andExpr.push({ categoryIds: new mongoose.Types.ObjectId(categoryId) });
      } catch {
        // ignore invalid ObjectId filter
      }
    }

    if (typeof inStock === "boolean") {
      andExpr.push(inStock ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } });
    }

    if (typeof onSale === "boolean") {
      if (onSale) {
        andExpr.push({
          $expr: {
            $and: [
              { $ne: ["$salePrice", null] },
              { $lt: ["$salePrice", "$price"] },
            ],
          },
        });
      } else {
        andExpr.push({
          $or: [
            { salePrice: null },
            { $expr: { $gte: ["$salePrice", "$price"] } },
          ],
        });
      }
    }

    // Price filters on effectivePrice = salePrice ?? price
    const effectivePrice = { $ifNull: ["$salePrice", "$price"] } as const;
    if (typeof priceMin === "number") {
      andExpr.push({ $expr: { $gte: [effectivePrice, priceMin] } });
    }

    if (typeof priceMax === "number") {
      andExpr.push({ $expr: { $lte: [effectivePrice, priceMax] } });
    }

    if (andExpr.length) match.$and = andExpr;

    // Sorting
    const sortStage: Record<string, 1 | -1> = {};

    // Add text score sorting if using text search
    if (q && q.length >= 3) {
      sortStage.score = { $meta: "textScore" };
    }

    switch (sort) {
      case "price-asc":
        sortStage.effectivePrice = 1;
        break;
      case "price-desc":
        sortStage.effectivePrice = -1;
        break;
      case "title-asc":
        sortStage.title = 1;
        break;
      case "title-desc":
        sortStage.title = -1;
        break;
      default:
        sortStage._id = -1; // newest by ObjectId time
    }

    const pageNum = Math.max(1, page ?? 1);
    const per = Math.max(1, Math.min(100, perPage ?? 12));
    const skip = (pageNum - 1) * per;

    // Optimize pipeline for better performance
    const pipeline: PipelineStage[] = [
      // Add text score if using text search
      ...(q && q.length >= 3 ? [{ $match: { $text: { $search: q } } }] : []),
      { $addFields: { effectivePrice } },
      ...(match.$and ? [{ $match: match }] : []),
      { $sort: sortStage },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: per }],
          totalArr: [{ $count: "count" }],
        },
      },
      {
        $project: {
          items: 1,
          total: { $ifNull: [{ $arrayElemAt: ["$totalArr.count", 0] }, 0] },
        },
      },
    ];

    const result = await ProductModel.aggregate(pipeline);
    const agg = result[0] ?? { items: [], total: 0 };

    const items = (
      agg.items as Array<Record<string, unknown> & { _id: unknown }>
    ).map((p) => ({
      id: String(p._id),
      title: p.title,
      slug: p.slug,
      sku: p.sku,
      price: p.price,
      salePrice: p.salePrice ?? null,
      stock: p.stock,
      images: p.images ?? [],
      attributes: p.attributes ?? {},
      categoryIds: Array.isArray(p.categoryIds)
        ? p.categoryIds.map((cid) => String(cid))
        : [],
    }));

    // Return response with cache headers
    return NextResponse.json(
      { items, page: pageNum, perPage: per, total: agg.total },
      {
        status: 200,
        headers: {
          "Cache-Control": CACHE_CONTROL_HEADER,
        },
      },
    );
  } catch (err) {
    console.error("Error fetching products:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
