import { cache, createCacheKey } from "@/lib/cache";
import type { Category, Product } from "@/types/catalog";
import type { Paginated } from "@/types/http";
import { apiFetch } from "./http";

export type ProductsQuery = {
  q?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
  sort?: "price-asc" | "price-desc" | "title-asc" | "title-desc" | "newest";
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
  year?: number;
  author?: string;
  publisher?: string;
  language?: string;
  coverType?: string;
};

export type FacetsResponse = {
  categories: Record<string, number>;
  price: { min: number; max: number };
  years: Array<{ year: number; count: number }>;
  authors: Array<{ author: string; count: number }>;
  publishers: Array<{ publisher: string; count: number }>;
  languages: Array<{ language: string; count: number }>;
  coverTypes: Array<{ coverType: string; count: number }>;
};

export const CatalogService = {
  /**
   * Get all categories with caching
   * @returns List of categories
   */
  async getCategories(): Promise<Category[]> {
    // Cache categories for 1 hour
    return cache.getOrSet<Category[]>(
      "catalog:categories",
      () => apiFetch<Category[]>({ path: "/api/catalog/categories" }),
      3600, // 1 hour TTL
    );
  },

  /**
   * Get products with filtering, pagination and caching
   * @param params Query parameters
   * @returns Paginated products
   */
  async getProducts(params: ProductsQuery = {}): Promise<Paginated<Product>> {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.categoryId) usp.set("categoryId", params.categoryId);
    if (params.page) usp.set("page", String(params.page));
    if (params.perPage) usp.set("perPage", String(params.perPage));
    if (params.sort) usp.set("sort", params.sort);
    if (typeof params.priceMin === "number")
      usp.set("priceMin", String(params.priceMin));
    if (typeof params.priceMax === "number")
      usp.set("priceMax", String(params.priceMax));
    if (typeof params.inStock === "boolean")
      usp.set("inStock", String(params.inStock));
    if (typeof params.onSale === "boolean")
      usp.set("onSale", String(params.onSale));
    if (params.year) usp.set("year", String(params.year));
    if (params.author) usp.set("author", params.author);
    if (params.publisher) usp.set("publisher", params.publisher);
    if (params.language) usp.set("language", params.language);
    if (params.coverType) usp.set("coverType", params.coverType);

    const path = `/api/catalog/products${usp.toString() ? `?${usp.toString()}` : ""}`;

    // Cache product listings for 5 minutes
    // Skip cache for search queries (params.q) as they're less likely to be reused
    if (params.q) {
      return apiFetch<Paginated<Product>>({ path });
    }

    const cacheKey = createCacheKey("catalog:products", params);
    return cache.getOrSet<Paginated<Product>>(
      cacheKey,
      () => apiFetch<Paginated<Product>>({ path }),
      300, // 5 minutes TTL
    );
  },

  /**
   * Get category facets with caching
   * @param params Query parameters
   * @returns Facets response
   */
  async getCategoryFacets(
    params: Omit<ProductsQuery, "page" | "perPage"> = {},
  ): Promise<FacetsResponse> {
    const usp = new URLSearchParams();
    if (params.q) usp.set("q", params.q);
    if (params.categoryId) usp.set("categoryId", params.categoryId);
    if (params.sort) usp.set("sort", params.sort);
    if (typeof params.priceMin === "number")
      usp.set("priceMin", String(params.priceMin));
    if (typeof params.priceMax === "number")
      usp.set("priceMax", String(params.priceMax));
    if (typeof params.inStock === "boolean")
      usp.set("inStock", String(params.inStock));
    if (typeof params.onSale === "boolean")
      usp.set("onSale", String(params.onSale));
    if (params.year) usp.set("year", String(params.year));
    if (params.author) usp.set("author", params.author);
    if (params.publisher) usp.set("publisher", params.publisher);
    if (params.language) usp.set("language", params.language);
    if (params.coverType) usp.set("coverType", params.coverType);

    const path = `/api/catalog/facets${usp.toString() ? `?${usp.toString()}` : ""}`;

    // Skip cache for search queries (params.q)
    if (params.q) {
      return apiFetch<FacetsResponse>({ path });
    }

    // Cache facets for 10 minutes
    const cacheKey = createCacheKey("catalog:facets", params);
    return cache.getOrSet<FacetsResponse>(
      cacheKey,
      () => apiFetch<FacetsResponse>({ path }),
      600, // 10 minutes TTL
    );
  },

  /**
   * Get product by slug with caching
   * @param slug Product slug
   * @returns Product details
   */
  async getProductBySlug(slug: string): Promise<Product> {
    // Cache individual products for 10 minutes
    return cache.getOrSet<Product>(
      `catalog:product:${slug}`,
      () =>
        apiFetch<Product>({
          path: `/api/catalog/products/${encodeURIComponent(slug)}`,
        }),
      600, // 10 minutes TTL
    );
  },
};
