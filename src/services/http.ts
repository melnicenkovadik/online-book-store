import type { FetcherOptions } from "@/types/http";

export async function apiFetch<T>({
  path,
  method = "GET",
  headers = {},
  body,
}: FetcherOptions): Promise<T> {
  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "same-origin",
  };

  if (body !== undefined) {
    init.body = JSON.stringify(body);
  }

  console.log(`[apiFetch] ${method} ${path}`, { body });

  const res = await fetch(path, init);

  console.log(`[apiFetch] ${method} ${path} response:`, {
    status: res.status,
    statusText: res.statusText,
    ok: res.ok,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[apiFetch] ${method} ${path} error:`, text);
    throw new Error(
      `API ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = (await res.json()) as T;
  console.log(`[apiFetch] ${method} ${path} data:`, data);

  return data;
}
