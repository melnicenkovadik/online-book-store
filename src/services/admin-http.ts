import type { FetcherOptions } from "@/types/http";

// Глобальний callback для обробки 401 помилок
let onUnauthorized: (() => Promise<boolean>) | null = null;

export function setAdminAuthCallback(callback: () => Promise<boolean>) {
  onUnauthorized = callback;
}

export async function adminApiFetch<T>({
  path,
  method = "GET",
  headers = {},
  body,
}: FetcherOptions): Promise<T> {
  const makeRequest = async (): Promise<Response> => {
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

    console.log(`[adminApiFetch] ${method} ${path}`, { body });

    const res = await fetch(path, init);

    console.log(`[adminApiFetch] ${method} ${path} response:`, {
      status: res.status,
      statusText: res.statusText,
      ok: res.ok,
    });

    return res;
  };

  let res = await makeRequest();

  // Якщо отримали 401 та є callback для авторизації
  if (res.status === 401 && onUnauthorized) {
    console.log(`[adminApiFetch] 401 Unauthorized, showing login modal...`);

    const authenticated = await onUnauthorized();

    if (authenticated) {
      console.log(`[adminApiFetch] Re-authenticated, retrying request...`);
      // Повторюємо запит після успішної авторизації
      res = await makeRequest();
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error(`[adminApiFetch] ${method} ${path} error:`, text);
    throw new Error(
      `API ${method} ${path} failed: ${res.status} ${res.statusText} ${text}`,
    );
  }

  const data = (await res.json()) as T;
  console.log(`[adminApiFetch] ${method} ${path} data:`, data);

  return data;
}
