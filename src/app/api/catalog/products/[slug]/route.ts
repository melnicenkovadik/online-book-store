import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";

// Set cache control headers for 1 hour
const CACHE_CONTROL_HEADER =
  "public, s-maxage=3600, stale-while-revalidate=7200";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    await connectToDB();

    // Use lean() for better performance when we don't need a full Mongoose document
    const d = await ProductModel.findOne({ slug }).lean().exec();

    if (!d) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const product = {
      id: d._id.toString(),
      title: d.title,
      slug: d.slug,
      sku: d.sku,
      price: d.price,
      salePrice: d.salePrice ?? null,
      stock: d.stock,
      images: d.images ?? [],
      attributes: d.attributes ?? {},
      categoryIds: Array.isArray(d.categoryIds)
        ? d.categoryIds.map((cid) => cid.toString())
        : [],
    };

    // Return response with cache headers
    return NextResponse.json(product, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (err) {
    console.error("Error fetching product:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
