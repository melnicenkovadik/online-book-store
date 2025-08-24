import type { Category, Paginated, Product } from '@/types/catalog';
import { apiFetch } from './http';

export type ProductsQuery = {
  q?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
  sort?: 'price-asc' | 'price-desc' | 'title-asc' | 'title-desc' | 'newest';
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
};

export type FacetsResponse = {
  categories: Record<string, number>;
  price: { min: number; max: number };
};

export const CatalogService = {
  async getCategories(): Promise<Category[]> {
    return apiFetch<Category[]>({ path: '/api/catalog/categories' });
  },
  async getProducts(params: ProductsQuery = {}): Promise<Paginated<Product>> {
    const usp = new URLSearchParams();
    if (params.q) usp.set('q', params.q);
    if (params.categoryId) usp.set('categoryId', params.categoryId);
    if (params.page) usp.set('page', String(params.page));
    if (params.perPage) usp.set('perPage', String(params.perPage));
    if (params.sort) usp.set('sort', params.sort);
    if (typeof params.priceMin === 'number') usp.set('priceMin', String(params.priceMin));
    if (typeof params.priceMax === 'number') usp.set('priceMax', String(params.priceMax));
    if (typeof params.inStock === 'boolean') usp.set('inStock', String(params.inStock));
    if (typeof params.onSale === 'boolean') usp.set('onSale', String(params.onSale));
    const path = `/api/catalog/products${usp.toString() ? `?${usp.toString()}` : ''}`;
    return apiFetch<Paginated<Product>>({ path });
  },
  async getCategoryFacets(params: Omit<ProductsQuery, 'page' | 'perPage'> = {}): Promise<FacetsResponse> {
    const usp = new URLSearchParams();
    if (params.q) usp.set('q', params.q);
    if (params.categoryId) usp.set('categoryId', params.categoryId);
    if (params.sort) usp.set('sort', params.sort);
    if (typeof params.priceMin === 'number') usp.set('priceMin', String(params.priceMin));
    if (typeof params.priceMax === 'number') usp.set('priceMax', String(params.priceMax));
    if (typeof params.inStock === 'boolean') usp.set('inStock', String(params.inStock));
    if (typeof params.onSale === 'boolean') usp.set('onSale', String(params.onSale));
    const path = `/api/catalog/facets${usp.toString() ? `?${usp.toString()}` : ''}`;
    return apiFetch<FacetsResponse>({ path });
  },
  async getProductBySlug(slug: string): Promise<Product> {
    return apiFetch<Product>({ path: `/api/catalog/products/${encodeURIComponent(slug)}` });
  },
};
