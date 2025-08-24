import type { PipelineStage } from "mongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";
import { ProductModel } from "@/lib/models/Product";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") ?? undefined;
    const categoryId = searchParams.get("categoryId") ?? undefined;
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
    const _sort = (searchParams.get("sort") ?? undefined) as
      | "price-asc"
      | "price-desc"
      | "title-asc"
      | "title-desc"
      | "newest"
      | undefined;

    await connectToDB();

    // Base match for filters applied to category counts (includes priceMin/Max)
    const baseAnd: Record<string, unknown>[] = [];
    if (q)
      baseAnd.push({
        title: {
          $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      });
    if (categoryId) {
      try {
        baseAnd.push({ categoryIds: new mongoose.Types.ObjectId(categoryId) });
      } catch {}
    }
    if (typeof inStock === "boolean")
      baseAnd.push(inStock ? { stock: { $gt: 0 } } : { stock: { $lte: 0 } });
    if (typeof onSale === "boolean") {
      if (onSale)
        baseAnd.push({
          $expr: {
            $and: [
              { $ne: ["$salePrice", null] },
              { $lt: ["$salePrice", "$price"] },
            ],
          },
        });
      else
        baseAnd.push({
          $or: [
            { salePrice: null },
            { $expr: { $gte: ["$salePrice", "$price"] } },
          ],
        });
    }
    const eff = { $ifNull: ["$salePrice", "$price"] } as const;
    const withPriceAnd = [...baseAnd];
    if (typeof priceMin === "number")
      withPriceAnd.push({ $expr: { $gte: [eff, priceMin] } });
    if (typeof priceMax === "number")
      withPriceAnd.push({ $expr: { $lte: [eff, priceMax] } });

    // Build facet with two branches: counts (with price filters) and price range (without price filters)
    const pipeline: PipelineStage[] = [
      { $addFields: { effectivePrice: eff } },
      {
        $facet: {
          counts: [
            ...(withPriceAnd.length
              ? [{ $match: { $and: withPriceAnd } }]
              : []),
            {
              $unwind: {
                path: "$categoryIds",
                preserveNullAndEmptyArrays: true,
              },
            },
            { $group: { _id: "$categoryIds", count: { $sum: 1 } } },
          ],
          price: [
            ...(baseAnd.length ? [{ $match: { $and: baseAnd } }] : []),
            {
              $group: {
                _id: null,
                min: { $min: "$effectivePrice" },
                max: { $max: "$effectivePrice" },
              },
            },
          ],
        },
      },
    ];

    const [agg] = await ProductModel.aggregate(pipeline);
    const countsArr: Array<{
      _id: mongoose.Types.ObjectId | null;
      count: number;
    }> = agg?.counts ?? [];
    const priceObj =
      (agg?.price?.[0] as { min?: number; max?: number } | undefined) ?? {};

    // Ensure all categories are present in response map
    const cats = (await CategoryModel.find({}, { _id: 1 }).lean().exec()) as {
      _id: mongoose.Types.ObjectId;
    }[];
    const countsMap = new Map<string, number>();
    for (const rec of countsArr) {
      if (rec._id) countsMap.set(rec._id.toString(), rec.count);
    }
    const categoryCounts = Object.fromEntries(
      cats.map((c) => [c._id.toString(), countsMap.get(c._id.toString()) ?? 0]),
    );

    const min = Number.isFinite(priceObj.min as number)
      ? (priceObj.min as number)
      : 0;
    const max = Number.isFinite(priceObj.max as number)
      ? (priceObj.max as number)
      : 0;

    return NextResponse.json(
      { categories: categoryCounts, price: { min, max } },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
