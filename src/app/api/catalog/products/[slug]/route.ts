import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await ctx.params;
    await connectToDB();
    const d = await ProductModel.findOne({ slug }).exec();
    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
      categoryIds: (d.categoryIds ?? []).map((cid) => cid.toString()),
    };
    return NextResponse.json(product, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
