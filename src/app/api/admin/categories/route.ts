import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";

export async function GET() {
  await connectToDB();
  const docs = await CategoryModel.find({}).lean().exec();
  const items = docs.map(
    (d: { _id: unknown; name: string; slug: string; parentId?: unknown }) => ({
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      parentId: d.parentId ? String(d.parentId) : undefined,
    }),
  );
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  await connectToDB();
  try {
    const body = (await req.json()) as Partial<{
      name: string;
      slug?: string;
      parentId?: string;
    }>;
    if (!body.name)
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    const slug =
      (body.slug && String(body.slug).trim()) ||
      String(body.name)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");
    const parentId = body.parentId
      ? new mongoose.Types.ObjectId(String(body.parentId))
      : undefined;
    const category = new CategoryModel({
      name: String(body.name),
      slug,
      parentId: parentId ?? null,
    });
    const created = await category.save();
    const item = {
      id: String(created._id),
      name: created.name,
      slug: created.slug,
      parentId: created.parentId ? String(created.parentId) : undefined,
    };
    return NextResponse.json(item, { status: 201 });
  } catch (e: unknown) {
    if ((e as { code?: number })?.code === 11000) {
      return NextResponse.json(
        { error: "slug must be unique" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid body" },
      { status: 400 },
    );
  }
}
