import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id))
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  const d = (await CategoryModel.findById(id)
    .setOptions({ lean: true })
    .exec()) as {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    parentId: mongoose.Types.ObjectId | null;
  } | null;
  if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const item = {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    parentId: d.parentId ? String(d.parentId) : undefined,
  };
  return NextResponse.json(item);
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
    const body = (await req.json()) as Partial<{
      name: string;
      slug?: string;
      parentId?: string | null;
    }>;
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = String(body.name);
    if (body.slug !== undefined) update.slug = String(body.slug).trim();
    if (body.parentId !== undefined) {
      update.parentId = body.parentId
        ? new mongoose.Types.ObjectId(String(body.parentId))
        : null;
    }
    const d = (await CategoryModel.findByIdAndUpdate(id, update, { new: true })
      .setOptions({ lean: true })
      .exec()) as {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      parentId: mongoose.Types.ObjectId | null;
    } | null;
    if (!d) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const item = {
      id: String(d._id),
      name: d.name,
      slug: d.slug,
      parentId: d.parentId ? String(d.parentId) : undefined,
    };
    return NextResponse.json(item);
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
  const r = (await CategoryModel.findByIdAndDelete(id)
    .setOptions({ lean: true })
    .exec()) as {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    parentId: mongoose.Types.ObjectId | null;
  } | null;
  if (!r) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const payload = {
    id: String(r._id),
    name: r.name,
    slug: r.slug,
    parentId: r.parentId ? String(r.parentId) : undefined,
  };
  return NextResponse.json({ ok: true, removed: payload });
}
