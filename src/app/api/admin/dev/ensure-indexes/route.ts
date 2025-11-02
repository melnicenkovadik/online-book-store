import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";
import { OrderModel } from "@/lib/models/Order";
import { ProductModel } from "@/lib/models/Product";

export async function POST() {
  try {
    await connectToDB();

    // Ensure indexes are created for all models
    await Promise.all([
      ProductModel.createIndexes(),
      CategoryModel.createIndexes(),
      OrderModel.createIndexes(),
    ]);

    return NextResponse.json({
      ok: true,
      message: "Indexes created successfully",
    });
  } catch (error) {
    console.error("Error creating indexes:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create indexes",
      },
      { status: 500 },
    );
  }
}
