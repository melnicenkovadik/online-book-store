import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import type { Product } from "@/types/catalog";
import type { ProductDoc } from "@/types/database";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await connectToDB();
    const { id } = await ctx.params;
    console.log("[GET /api/admin/products/:id] Fetching product:", id);

    if (!mongoose.isValidObjectId(id)) {
      console.log("[GET /api/admin/products/:id] Invalid ObjectId:", id);
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const doc = (await ProductModel.findById(id).lean().exec()) as
      | (ProductDoc & { _id: mongoose.Types.ObjectId })
      | null;

    if (!doc) {
      console.log("[GET /api/admin/products/:id] Product not found:", id);
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    console.log("[GET /api/admin/products/:id] Found product:", doc.title);
    console.log(
      "[GET /api/admin/products/:id] Raw attributes:",
      JSON.stringify(doc.attributes, null, 2),
    );

    const item: Product = {
      id: String(doc._id),
      title: doc.title,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      salePrice: doc.salePrice ?? null,
      stock: doc.stock,
      images: doc.images || [],
      attributes: doc.attributes || {},
      categoryIds: Array.isArray(doc.categoryIds)
        ? doc.categoryIds.map((cid) => String(cid))
        : [],
    };

    console.log(
      "[GET /api/admin/products/:id] Sending attributes:",
      JSON.stringify(item.attributes, null, 2),
    );
    return NextResponse.json(item);
  } catch (error: unknown) {
    console.error("[GET /api/admin/products/:id] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Internal server error",
        details: error instanceof Error ? error.stack : String(error),
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<Product>;
    const update: Record<string, unknown> = {};
    if (body.title !== undefined) update.title = String(body.title);
    if (body.slug !== undefined) update.slug = String(body.slug).trim();
    if (body.sku !== undefined) update.sku = String(body.sku);
    if (body.price !== undefined) update.price = Number(body.price);
    if (body.salePrice !== undefined) {
      const saleRaw: unknown = (body as { salePrice?: unknown }).salePrice;
      const saleParsed =
        saleRaw === "" || saleRaw == null ? null : Number(saleRaw);
      update.salePrice = Number.isNaN(saleParsed as number)
        ? null
        : (saleParsed as number);
    }
    if (body.stock !== undefined) update.stock = Number(body.stock);
    if (body.images !== undefined)
      update.images = Array.isArray(body.images) ? body.images : [];
    if (
      (body as { attributes?: Record<string, unknown> }).attributes !==
      undefined
    )
      update.attributes =
        (body as { attributes?: Record<string, unknown> }).attributes || {};
    if (body.categoryIds !== undefined) {
      update.categoryIds = Array.isArray(body.categoryIds)
        ? (body.categoryIds as string[])
            .filter(Boolean)
            .map((id) =>
              mongoose.isValidObjectId(id)
                ? new mongoose.Types.ObjectId(id)
                : null,
            )
            .filter(Boolean)
        : [];
    }
    const doc = (await ProductModel.findByIdAndUpdate(id, update, {
      new: true,
    })
      .lean()
      .exec()) as (ProductDoc & { _id: mongoose.Types.ObjectId }) | null;
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const next: Product = {
      id: String(doc._id),
      title: doc.title,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      salePrice: doc.salePrice ?? null,
      stock: doc.stock,
      images: doc.images || [],
      attributes: doc.attributes || {},
      categoryIds: Array.isArray(doc.categoryIds)
        ? doc.categoryIds.map((cid) => String(cid))
        : [],
    };
    return NextResponse.json(next);
  } catch (e: unknown) {
    if ((e as { code?: number })?.code === 11000)
      return NextResponse.json(
        { error: "slug must be unique" },
        { status: 400 },
      );
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
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const removed = (await ProductModel.findByIdAndDelete(id).lean().exec()) as
    | (ProductDoc & { _id: mongoose.Types.ObjectId })
    | null;
  if (!removed)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  const payload: Product = {
    id: String(removed._id),
    title: removed.title,
    slug: removed.slug,
    sku: removed.sku,
    price: removed.price,
    salePrice: removed.salePrice ?? null,
    stock: removed.stock,
    images: removed.images || [],
    attributes: removed.attributes || {},
    categoryIds: Array.isArray(removed.categoryIds)
      ? removed.categoryIds.map((cid) => String(cid))
      : [],
  };
  return NextResponse.json({ ok: true, removed: payload });
}
