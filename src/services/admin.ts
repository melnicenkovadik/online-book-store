import useSWR from 'swr';
import { apiFetch } from './http';
import type { Product, Paginated } from '@/types/catalog';

export const AdminApi = {
  listProducts: (params: Record<string, any> = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, String(v));
    });
    return apiFetch<Paginated<Product>>({ path: `/api/admin/products?${sp.toString()}` });
  },
  getProduct: (id: string) => apiFetch<Product>({ path: `/api/admin/products/${id}` }),
  createProduct: (body: Partial<Product>) => apiFetch<Product>({ path: '/api/admin/products', method: 'POST', body }),
  updateProduct: (id: string, body: Partial<Product>) => apiFetch<Product>({ path: `/api/admin/products/${id}`, method: 'PUT', body }),
  deleteProduct: (id: string) => apiFetch<{ ok: boolean }>({ path: `/api/admin/products/${id}`, method: 'DELETE' }),
  // Categories
  listCategories: () => apiFetch<any[]>({ path: '/api/admin/categories' }),
  getCategory: (id: string) => apiFetch<any>({ path: `/api/admin/categories/${id}` }),
  createCategory: (body: any) => apiFetch<any>({ path: '/api/admin/categories', method: 'POST', body }),
  updateCategory: (id: string, body: any) => apiFetch<any>({ path: `/api/admin/categories/${id}`, method: 'PUT', body }),
  deleteCategory: (id: string) => apiFetch<{ ok: boolean }>({ path: `/api/admin/categories/${id}`, method: 'DELETE' }),
  // Orders
  listOrders: (params: Record<string, any> = {}) => {
    const sp = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== '') sp.set(k, String(v));
    });
    return apiFetch<any>({ path: `/api/admin/orders?${sp.toString()}` });
  },
  getOrder: (id: string) => apiFetch<any>({ path: `/api/admin/orders/${id}` }),
  updateOrder: (id: string, body: any) => apiFetch<any>({ path: `/api/admin/orders/${id}`, method: 'PUT', body }),
};

export function useAdminProductsList(params: Record<string, any>) {
  return useSWR(['admin/products', params], () => AdminApi.listProducts(params), { keepPreviousData: true });
}

export function useAdminCategories() {
  return useSWR('admin/categories', () => AdminApi.listCategories());
}

export function useAdminOrdersList(params: Record<string, any>) {
  return useSWR(['admin/orders', params], () => AdminApi.listOrders(params), { keepPreviousData: true });
}
