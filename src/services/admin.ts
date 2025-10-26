import useSWR from "swr";
import type { Category, Product } from "@/types/catalog";
import type { Paginated } from "@/types/http";
import type { Order } from "@/types/order";
import { adminApiFetch } from "./admin-http";

export type AdminOrderListItem = Order;
export type AdminOrderDetail = Order & {
  items: Array<{
    productId: string;
    qty: number;
    title: string;
    sku?: string;
    image?: string;
    basePrice: number;
    salePrice?: number | null;
    price: number;
    product?: {
      id: string;
      title: string;
      slug: string;
      sku: string;
      price: number;
      salePrice?: number | null;
      images: string[];
    } | null;
  }>;
  delivery: Order["delivery"] & {
    city?: string;
    warehouse?: string;
  };
  notes?: string;
  ttn?: string;
};

export const AdminApi = {
  listProducts: (
    params: Record<string, string | number | boolean | undefined> = {},
  ) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    });
    return adminApiFetch<Paginated<Product>>({
      path: `/api/admin/products?${sp.toString()}`,
    });
  },
  getProduct: (id: string) =>
    adminApiFetch<Product>({ path: `/api/admin/products/${id}` }),
  createProduct: (body: Partial<Product>) =>
    adminApiFetch<Product>({
      path: "/api/admin/products",
      method: "POST",
      body,
    }),
  updateProduct: (id: string, body: Partial<Product>) =>
    adminApiFetch<Product>({
      path: `/api/admin/products/${id}`,
      method: "PUT",
      body,
    }),
  deleteProduct: (id: string) =>
    adminApiFetch<{ ok: boolean }>({
      path: `/api/admin/products/${id}`,
      method: "DELETE",
    }),
  // Categories
  listCategories: () =>
    adminApiFetch<Category[]>({ path: "/api/admin/categories" }),
  getCategory: (id: string) =>
    adminApiFetch<Category>({ path: `/api/admin/categories/${id}` }),
  createCategory: (body: Partial<Category>) =>
    adminApiFetch<Category>({
      path: "/api/admin/categories",
      method: "POST",
      body,
    }),
  updateCategory: (id: string, body: Partial<Category>) =>
    adminApiFetch<Category>({
      path: `/api/admin/categories/${id}`,
      method: "PUT",
      body,
    }),
  deleteCategory: (id: string) =>
    adminApiFetch<{ ok: boolean }>({
      path: `/api/admin/categories/${id}`,
      method: "DELETE",
    }),
  // Orders
  listOrders: (
    params: Record<string, string | number | boolean | undefined> = {},
  ) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") sp.set(k, String(v));
    });
    return adminApiFetch<{
      items: AdminOrderListItem[];
      page: number;
      perPage: number;
      total: number;
    }>({ path: `/api/admin/orders?${sp.toString()}` });
  },
  getOrder: (id: string) =>
    adminApiFetch<AdminOrderDetail>({ path: `/api/admin/orders/${id}` }),
  updateOrder: (
    id: string,
    body: Partial<
      Pick<AdminOrderDetail, "status" | "ttn"> & {
        payment: { status?: "pending" | "paid" | "failed" };
      }
    >,
  ) =>
    adminApiFetch<AdminOrderDetail>({
      path: `/api/admin/orders/${id}`,
      method: "PUT",
      body,
    }),
};

export function useAdminProductsList(
  params: Record<string, string | number | boolean | undefined>,
) {
  return useSWR(
    ["admin/products", params],
    () => AdminApi.listProducts(params),
    { keepPreviousData: true },
  );
}

export function useAdminCategories() {
  return useSWR("admin/categories", () => AdminApi.listCategories());
}

export function useAdminOrdersList(
  params: Record<string, string | number | boolean | undefined>,
) {
  return useSWR(["admin/orders", params], () => AdminApi.listOrders(params), {
    keepPreviousData: true,
  });
}
