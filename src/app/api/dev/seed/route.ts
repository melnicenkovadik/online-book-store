import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";
import { ProductModel } from "@/lib/models/Product";
import {
  categories as mockCategories,
  products as mockProducts,
} from "@/mocks/catalog";

export async function POST(req: Request) {
  const token = process.env.SEED_TOKEN;
  const auth = req.headers.get("authorization") || "";
  if (!token || auth !== `Bearer ${token}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectToDB();

    // Upsert categories by slug
    const catIdToMongoId = new Map<string, string>();
    for (const c of mockCategories) {
      const updated = await CategoryModel.findOneAndUpdate(
        { slug: c.slug },
        { $set: { name: c.name, slug: c.slug, parentId: null } },
        { upsert: true, new: true },
      )
        .setOptions({ lean: true })
        .exec();
      if (updated && (updated as { _id?: unknown })._id) {
        catIdToMongoId.set(c.id, String((updated as { _id: unknown })._id));
      }
    }

    // Build category relations (parentId) after all exist
    for (const c of mockCategories) {
      if (c.parentId) {
        const _id = catIdToMongoId.get(c.id);
        const parentMongoId = catIdToMongoId.get(c.parentId);
        if (_id && parentMongoId) {
          await CategoryModel.updateOne(
            { _id },
            { $set: { parentId: parentMongoId } },
          );
        }
      }
    }

    // Upsert products by slug
    let upserts = 0;
    for (const p of mockProducts) {
      const categoryIds = (p.categoryIds || [])
        .map((cid) => catIdToMongoId.get(cid))
        .filter(Boolean);

      const update = {
        title: p.title,
        slug: p.slug,
        sku: p.sku,
        price: p.price,
        salePrice: p.salePrice ?? null,
        stock: p.stock ?? 0,
        images: p.images ?? [],
        attributes: p.attributes ?? {},
        categoryIds,
      };

      const res = await ProductModel.updateOne(
        { slug: p.slug },
        { $set: update },
        { upsert: true },
      );
      if (res.upsertedCount || res.modifiedCount) upserts++;
    }

    return NextResponse.json({
      ok: true,
      categories: mockCategories.length,
      products: mockProducts.length,
      upserts,
    });
  } catch (err) {
    console.error("[seed] error", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
