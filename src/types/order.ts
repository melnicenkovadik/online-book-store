import type { Product } from '@/types/catalog';

export type OrderItem = {
  productId: string;
  qty: number;
  // Snapshot at purchase time
  title: string;
  sku?: string;
  image?: string;
  basePrice: number;
  salePrice?: number | null;
  price: number; // final unit price (salePrice ?? basePrice)
};

export type OrderCustomer = {
  fullName: string;
  phone: string;
  email?: string;
};

export type DeliveryInfo = {
  carrier: 'nova' | 'ukr';
  cityRef?: string;
  warehouseRef?: string;
  address?: string;
};

export type PaymentInfo = {
  provider: 'fondy' | 'liqpay' | 'cod';
  status: 'pending' | 'paid' | 'failed';
  txId?: string;
};

export type OrderTotals = {
  items: number;
  shipping: number;
  grand: number;
};

export type Order = {
  id: string;
  number: string;
  items: OrderItem[];
  customer: OrderCustomer;
  delivery: DeliveryInfo;
  totals: OrderTotals;
  payment: PaymentInfo;
  ttn?: string;
  status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: string;
};
