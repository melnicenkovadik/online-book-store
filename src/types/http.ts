export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface FetcherOptions {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  path: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

// Lightweight variant without totalPages for endpoints that don't return it
export interface Paginated<T> {
  items: T[];
  page: number;
  perPage: number;
  total: number;
}

export interface ApiError {
  message: string;
  code?: string | number;
  details?: unknown;
}
