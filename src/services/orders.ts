import type { Order } from '@/types/order';
import { apiFetch } from './http';

export type CreateOrderInput = {
  items: Array<{ productId: string; qty: number }>;
  customer: Order['customer'];
  delivery: Order['delivery'];
  payment: { provider: 'fondy' | 'liqpay' | 'cod' };
};

export const OrdersService = {
  async createOrder(payload: CreateOrderInput): Promise<{ id: string; number: string }> {
    return apiFetch<{ id: string; number: string }>({ path: '/api/orders', method: 'POST', body: payload });
  },
};
