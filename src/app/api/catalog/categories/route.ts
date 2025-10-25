import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";

// Set cache control headers for 1 hour
const CACHE_CONTROL_HEADER =
  "public, s-maxage=3600, stale-while-revalidate=7200";

export async function GET() {
  try {
    await connectToDB();

    // Use lean() for better performance
    // Only fetch active categories and sort by order
    const categories = await CategoryModel.find({ isActive: true })
      .sort({ order: 1 })
      .lean()
      .exec();

    const result = categories.map((c) => ({
      id: c._id.toString(),
      name: c.name,
      slug: c.slug,
      parentId: c.parentId ? c.parentId.toString() : null,
    }));

    // Return response with cache headers
    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (err) {
    console.error("Error fetching categories:", err);
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
