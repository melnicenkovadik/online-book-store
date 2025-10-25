import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";

export async function GET(req: Request) {
  // admin auth by cookie
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;
  if (session !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
  const perPage = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("perPage") || "20")),
  );

  await connectToDB();

  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;
  if (q) {
    // search by number, name, phone (case-insensitive)
    filter.$or = [
      { number: { $regex: q, $options: "i" } },
      { "customer.fullName": { $regex: q, $options: "i" } },
      { "customer.phone": { $regex: q, $options: "i" } },
    ];
  }

  const total = await OrderModel.countDocuments(filter).exec();
  const items = await OrderModel.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * perPage)
    .limit(perPage)
    .setOptions({ lean: true })
    .exec();

  // Map _id to id for client convenience
  const mapped = items.map((o) => ({
    ...o,
    id: String(o._id),
  }));
  return NextResponse.json({ items: mapped, page, perPage, total });
}

export async function POST() {
  return NextResponse.json({ error: "Not allowed" }, { status: 405 });
}
