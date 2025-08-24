export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type FetcherOptions = {
  method?: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  // relative to site origin, e.g. /api/...
  path: string;
};

export async function apiFetch<T>({ path, method = 'GET', headers = {}, body }: FetcherOptions): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    credentials: 'same-origin',
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  const res = await fetch(path, init);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`);
  }
  return (await res.json()) as T;
}
