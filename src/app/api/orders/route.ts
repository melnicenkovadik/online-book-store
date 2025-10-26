import mongoose from "mongoose";
import { type NextRequest, NextResponse } from "next/server";
import { connectToDB } from "@/lib/db";
import { OrderModel } from "@/lib/models/Order";
import { ProductModel } from "@/lib/models/Product";
import type { ProductDoc } from "@/types/database";
import type { Order, OrderItem } from "@/types/order";

function calcTotals(items: OrderItem[]) {
  const itemsTotal = items.reduce((sum, it) => sum + it.price * it.qty, 0);
  const shipping = itemsTotal >= 1500 ? 0 : 80; // mock rule: free shipping from 1500
  const grand = itemsTotal + shipping;
  return { items: itemsTotal, shipping, grand } as Order["totals"];
}

function generateOrderNumber() {
  // Example: ORD-20250824-<short>
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const short = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ORD-${y}${m}${d}-${short}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectToDB();
    const payload = await req.json();
    const { items, customer, delivery, payment, notes } = payload as {
      items: Array<{ productId: string; qty: number }>;
      customer: Order["customer"];
      delivery: Order["delivery"];
      payment: { provider: Order["payment"]["provider"] };
      notes?: string;
    };

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Items are required" },
        { status: 400 },
      );
    }
    if (!customer?.fullName || !customer?.phone) {
      return NextResponse.json(
        { error: "Customer fullName and phone are required" },
        { status: 400 },
      );
    }
    // Normalize and validate products/qty
    const ids = Array.from(new Set(items.map((i) => i.productId))).filter(
      Boolean,
    );
    const objectIds: mongoose.Types.ObjectId[] = [];
    for (const id of ids) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return NextResponse.json(
          { error: `Invalid productId: ${id}` },
          { status: 400 },
        );
      }
      objectIds.push(new mongoose.Types.ObjectId(id));
    }

    const docs = (await ProductModel.find({ _id: { $in: objectIds } })
      .lean()
      .exec()) as ProductDoc[];
    const products = docs as unknown as ProductDoc[];
    const byId = new Map<string, ProductDoc>(
      products.map((p) => [p._id.toString(), p]),
    );

    const normalizedItems: OrderItem[] = [];
    for (const it of items) {
      if (!it || !it.productId || typeof it.qty !== "number" || it.qty <= 0) {
        return NextResponse.json(
          { error: "Each item must have productId and qty > 0" },
          { status: 400 },
        );
      }
      const p = byId.get(it.productId);
      if (!p) {
        return NextResponse.json(
          { error: `Product not found: ${it.productId}` },
          { status: 400 },
        );
      }
      const stock = (p as unknown as { stock?: number }).stock ?? 0;
      if (stock < it.qty) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${p.sku}` },
          { status: 409 },
        );
      }
      const basePrice = Number(p.price);
      const salePrice = p.salePrice ?? null;
      const unitPrice = (salePrice ?? basePrice) as number;
      const item: OrderItem = {
        productId: p._id.toString(),
        qty: it.qty,
        title: p.title,
        sku: p.sku,
        // omit image if not present to satisfy exactOptionalPropertyTypes
        basePrice,
        salePrice,
        price: unitPrice,
      } as OrderItem;
      if (Array.isArray(p.images) && p.images[0]) {
        (item as unknown as { image?: string }).image = p.images[0] as string;
      }
      normalizedItems.push(item);
    }

    const totals = calcTotals(normalizedItems);
    const number = generateOrderNumber();

    const orderData = {
      number,
      items: normalizedItems.map((i) => ({
        productId: new mongoose.Types.ObjectId(i.productId),
        qty: i.qty,
        title: i.title,
        sku: i.sku,
        image: i.image,
        basePrice: i.basePrice,
        salePrice: i.salePrice ?? undefined,
        price: i.price,
      })),
      customer,
      delivery: {
        carrier: delivery.carrier,
        ...(delivery.city && { city: delivery.city }),
        ...(delivery.cityRef && { cityRef: delivery.cityRef }),
        ...(delivery.warehouse && { warehouse: delivery.warehouse }),
        ...(delivery.warehouseRef && { warehouseRef: delivery.warehouseRef }),
        ...(delivery.address && { address: delivery.address }),
      },
      totals,
      payment: { provider: payment.provider, status: "pending" },
      status: "new",
      ...(notes && { notes }),
    };

    const order = new OrderModel(orderData);
    const created = await order.save();

    return NextResponse.json(
      { id: created._id.toString(), number: created.number },
      { status: 201 },
    );
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 },
    );
  }
}
