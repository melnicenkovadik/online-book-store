import { NextRequest, NextResponse } from 'next/server';
import { connectToDB } from '@/lib/db';
import { CategoryModel } from '@/lib/models/Category';
import mongoose from 'mongoose';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const doc = await CategoryModel.findById(id).lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string; parentId: mongoose.Types.ObjectId | null }>();
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const item = { id: String(doc._id), name: doc.name, slug: doc.slug, parentId: doc.parentId ? String(doc.parentId) : undefined };
  return NextResponse.json(item);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  try {
    const body = (await req.json()) as Partial<{ name: string; slug?: string; parentId?: string | null }>;
    const update: any = {};
    if (body.name !== undefined) update.name = String(body.name);
    if (body.slug !== undefined) update.slug = String(body.slug).trim();
    if (body.parentId !== undefined) {
      update.parentId = body.parentId ? new mongoose.Types.ObjectId(String(body.parentId)) : null;
    }
    const doc = await CategoryModel.findByIdAndUpdate(id, update, { new: true }).lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string; parentId: mongoose.Types.ObjectId | null }>();
    if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const item = { id: String(doc._id), name: doc.name, slug: doc.slug, parentId: doc.parentId ? String(doc.parentId) : undefined };
    return NextResponse.json(item);
  } catch (e: any) {
    if (e?.code === 11000) return NextResponse.json({ error: 'slug must be unique' }, { status: 400 });
    return NextResponse.json({ error: e?.message || 'Invalid body' }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectToDB();
  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  const removed = await CategoryModel.findByIdAndDelete(id).lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string; parentId: mongoose.Types.ObjectId | null }>();
  if (!removed) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const payload = { id: String(removed._id), name: removed.name, slug: removed.slug, parentId: removed.parentId ? String(removed.parentId) : undefined };
  return NextResponse.json({ ok: true, removed: payload });
}
