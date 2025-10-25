import type { PipelineStage } from "mongoose";
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";

// Set cache control headers for 10 minutes
const CACHE_CONTROL_HEADER =
  "public, s-maxage=600, stale-while-revalidate=1200";

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

    // New attribute filters
    const year = searchParams.get("year")
      ? Number(searchParams.get("year"))
      : undefined;
    const author = searchParams.get("author") ?? undefined;
    const publisher = searchParams.get("publisher") ?? undefined;
    const language = searchParams.get("language") ?? undefined;
    const coverType = searchParams.get("coverType") ?? undefined;

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

    // Filter by attributes
    if (year) {
      andExpr.push({ "attributes.year": year });
    }
    if (author) {
      andExpr.push({
        "attributes.author": {
          $regex: author.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      });
    }
    if (publisher) {
      andExpr.push({
        "attributes.publisher": {
          $regex: publisher.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
          $options: "i",
        },
      });
    }
    if (language) {
      andExpr.push({ "attributes.language": language });
    }
    if (coverType) {
      andExpr.push({ "attributes.coverType": coverType });
    }

    if (andExpr.length) match.$and = andExpr;

    // Optimize pipeline for facets
    const pipeline: PipelineStage[] = [
      { $addFields: { effectivePrice } },
      ...(match.$and ? [{ $match: match }] : []),
      {
        $facet: {
          categories: [
            { $unwind: "$categoryIds" },
            { $group: { _id: "$categoryIds", count: { $sum: 1 } } },
            { $project: { _id: 0, id: { $toString: "$_id" }, count: 1 } },
          ],
          price: [
            {
              $group: {
                _id: null,
                min: { $min: "$effectivePrice" },
                max: { $max: "$effectivePrice" },
              },
            },
            { $project: { _id: 0, min: 1, max: 1 } },
          ],
          years: [
            { $group: { _id: "$attributes.year", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { _id: -1 } },
            { $project: { _id: 0, year: "$_id", count: 1 } },
          ],
          authors: [
            { $group: { _id: "$attributes.author", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
            { $project: { _id: 0, author: "$_id", count: 1 } },
          ],
          publishers: [
            { $group: { _id: "$attributes.publisher", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $limit: 50 },
            { $project: { _id: 0, publisher: "$_id", count: 1 } },
          ],
          languages: [
            { $group: { _id: "$attributes.language", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, language: "$_id", count: 1 } },
          ],
          coverTypes: [
            { $group: { _id: "$attributes.coverType", count: { $sum: 1 } } },
            { $match: { _id: { $ne: null } } },
            { $sort: { count: -1 } },
            { $project: { _id: 0, coverType: "$_id", count: 1 } },
          ],
        },
      },
    ];

    const result = await ProductModel.aggregate(pipeline);
    const facets = result[0] ?? {
      categories: [],
      price: [],
      years: [],
      authors: [],
      publishers: [],
      languages: [],
      coverTypes: [],
    };

    // Transform categories array to object
    const categoriesObj: Record<string, number> = {};
    (facets.categories as Array<{ id: string; count: number }>).forEach((c) => {
      categoriesObj[c.id] = c.count;
    });

    // Get price range
    const priceRange = (
      facets.price as Array<{
        min: number;
        max: number;
      }>
    )[0] ?? { min: 0, max: 1000 };

    // Return response with cache headers
    return NextResponse.json(
      {
        categories: categoriesObj,
        price: priceRange,
        years: facets.years as Array<{ year: number; count: number }>,
        authors: facets.authors as Array<{ author: string; count: number }>,
        publishers: facets.publishers as Array<{
          publisher: string;
          count: number;
        }>,
        languages: facets.languages as Array<{
          language: string;
          count: number;
        }>,
        coverTypes: facets.coverTypes as Array<{
          coverType: string;
          count: number;
        }>,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": CACHE_CONTROL_HEADER,
        },
      },
    );
  } catch (err) {
    console.error("Error fetching facets:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
