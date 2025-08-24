import type { Order } from "@/types/order";

export const orders: Order[] = [];

// Seed some mock orders
(() => {
  const now = Date.now();
  for (let i = 1; i <= 24; i++) {
    const id = `o${i}`;
    const createdAt = new Date(now - i * 3600 * 1000).toISOString();
    const status: Order["status"] =
      i % 5 === 0
        ? "completed"
        : i % 4 === 0
          ? "shipped"
          : i % 3 === 0
            ? "processing"
            : "new";
    orders.push({
      id,
      number: String(100000 + i),
      items: [
        {
          productId: "p1",
          qty: (i % 2) + 1,
          title: "Книга 1",
          sku: "SKU-P1",
          image: "https://picsum.photos/seed/p1/200/200",
          basePrice: 300,
          salePrice: 250,
          price: 250,
        },
        {
          productId: "p2",
          qty: 1,
          title: "Книга 2",
          sku: "SKU-P2",
          image: "https://picsum.photos/seed/p2/200/200",
          basePrice: 230,
          salePrice: null,
          price: 230,
        },
      ],
      customer: {
        fullName: `Customer ${i}`,
        phone: `+3805000${String(i).padStart(4, "0")}`,
        email: `c${i}@mail.com`,
      },
      delivery: {
        carrier: i % 2 ? "nova" : "ukr",
        cityRef: "city",
        warehouseRef: "wh",
      },
      totals: {
        items: 250 * ((i % 2) + 1) + 230,
        shipping: 60,
        grand: 250 * ((i % 2) + 1) + 230 + 60,
      },
      payment: {
        provider: i % 2 ? "cod" : "fondy",
        status: i % 5 === 0 ? "paid" : "pending",
      },
      ...(i % 4 === 0 ? { ttn: `2040${i}` } : {}),
      status,
      createdAt,
    });
  }
})();

export type OrderFilters = {
  q?: string; // number or phone or name
  status?: Order["status"];
  page?: number;
  perPage?: number;
};

export function listOrders({
  q,
  status,
  page = 1,
  perPage = 20,
}: OrderFilters = {}) {
  let list = orders.slice();
  if (q) {
    const s = q.toLowerCase();
    list = list.filter(
      (o) =>
        o.number.toLowerCase().includes(s) ||
        o.customer.fullName.toLowerCase().includes(s) ||
        o.customer.phone.toLowerCase().includes(s),
    );
  }
  if (status) list = list.filter((o) => o.status === status);
  list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const total = list.length;
  const start = (page - 1) * perPage;
  const items = list.slice(start, start + perPage);
  return { items, total, page, perPage };
}
