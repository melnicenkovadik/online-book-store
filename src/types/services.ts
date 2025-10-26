import type { Order } from "./order";

export interface CreateOrderInput {
  items: Array<{ productId: string; qty: number }>;
  customer: Order["customer"];
  delivery: Order["delivery"];
  payment: { provider: "fondy" | "liqpay" | "cod" | "card" | "requisites" };
  notes?: string;
}

export interface CreateOrderResponse {
  id: string;
  number: string;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminLoginResponse {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export interface UploadResponse {
  url: string;
  publicId: string;
}

// Admin-side order shapes
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
};
