import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { CategoryModel } from "@/lib/models/Category";
import type { Category } from "@/types/catalog";

// Build a tree from flat categories
export type CategoryNode = Category & { children?: CategoryNode[] };

function buildTree(items: Category[]): CategoryNode[] {
  const map = new Map<string, CategoryNode>();
  for (const c of items) {
    map.set(c.id, { ...c, children: [] });
  }
  const roots: CategoryNode[] = [];
  for (const c of map.values()) {
    if (c.parentId) {
      const parent = map.get(c.parentId);
      if (parent) parent.children?.push(c);
      else roots.push(c); // fallback if parent not found
    } else {
      roots.push(c);
    }
  }
  return roots;
}

export async function GET() {
  try {
    await connectToDB();
    const docs = await CategoryModel.find().exec();
    const flat: Category[] = docs.map((d) => ({
      id: d._id.toString(),
      name: d.name,
      slug: d.slug,
      parentId: d.parentId ? d.parentId.toString() : null,
    }));
    const tree = buildTree(flat);
    return NextResponse.json(tree, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
