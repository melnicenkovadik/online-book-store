import type mongoose from "mongoose";

export interface CategoryDoc {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parentId?: mongoose.Types.ObjectId | null;
  order?: number;
  isActive?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProductDoc {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images: string[];
  attributes: Record<string, unknown>;
  categoryIds: mongoose.Types.ObjectId[];
}

export interface OrderDoc {
  _id: mongoose.Types.ObjectId;
  number: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    qty: number;
    title: string;
    sku?: string;
    image?: string;
    basePrice: number;
    salePrice?: number | null;
    price: number;
  }>;
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  delivery: {
    carrier: "nova" | "ukr";
    cityRef?: string;
    warehouseRef?: string;
    address?: string;
  };
  totals: {
    items: number;
    shipping: number;
    grand: number;
  };
  payment: {
    provider: "fondy" | "liqpay" | "cod";
    status: "pending" | "paid" | "failed";
    txId?: string;
  };
  ttn?: string;
  status: "new" | "processing" | "shipped" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}

export interface UserDoc {
  _id: mongoose.Types.ObjectId;
  email: string;
  hash: string;
  role: "admin" | "manager";
  createdAt: Date;
  updatedAt: Date;
}
