/**
 * Сервіс для роботи з API Нової Пошти
 *
 * ⚠️ ВАЖЛИВО: Потрібен API ключ для роботи!
 *
 * Налаштування API Нової Пошти:
 *
 * 1. Зареєструйтеся на https://my.novaposhta.ua/
 * 2. Отримайте API ключ у розділі "Налаштування" → "Безпека"
 * 3. Додайте API ключ в .env:
 *    NOVA_POSHTA_API_KEY=ваш_ключ
 *
 * 4. Створіть файл src/lib/env.ts з:
 *    export const NOVA_POSHTA_API_KEY = process.env.NOVA_POSHTA_API_KEY || "";
 *
 * 5. Документація API: https://developers.novaposhta.ua/
 *
 * Основні методи API:
 * - searchSettlements: пошук міст
 * - getWarehouses: список відділень
 * - getDocumentPrice: розрахунок вартості доставки
 *
 * Приклад запиту:
 * ```
 * fetch('https://api.novaposhta.ua/v2.0/json/', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     apiKey: API_KEY,
 *     modelName: 'Address',
 *     calledMethod: 'searchSettlements',
 *     methodProperties: { CityName: query }
 *   })
 * });
 * ```
 */

export interface NovaPoshtaCity {
  ref: string;
  name: string;
  area: string;
}

export interface NovaPoshtaWarehouse {
  ref: string;
  description: string;
  cityRef: string;
  number: string;
}

/**
 * Пошук міст за назвою
 * Використовує наш API route: /api/novaposhta/cities
 */
export async function searchCities(query: string): Promise<NovaPoshtaCity[]> {
  console.log("🔍 Searching cities for:", query);

  // Мінімум 2 символи для пошуку
  if (!query || query.length < 2) {
    console.log("⏭️ Query too short, skipping search");
    return [];
  }

  try {
    const response = await fetch(
      `/api/novaposhta/cities?query=${encodeURIComponent(query)}`,
    );

    if (!response.ok) {
      console.error("❌ API request failed:", response.statusText);
      return [];
    }

    const cities = await response.json();
    console.log("✅ Found cities:", cities.length);
    return cities;
  } catch (error) {
    console.error("❌ Nova Poshta API error (searchCities):", error);
    return [];
  }
}

/**
 * Отримання відділень для міста
 * Використовує наш API route: /api/novaposhta/warehouses
 */
export async function getWarehouses(
  cityRef: string,
): Promise<NovaPoshtaWarehouse[]> {
  if (!cityRef) {
    return [];
  }

  try {
    const response = await fetch(
      `/api/novaposhta/warehouses?cityRef=${encodeURIComponent(cityRef)}`,
    );

    if (!response.ok) {
      console.error("❌ API request failed:", response.statusText);
      return [];
    }

    const warehouses = await response.json();
    console.log("✅ Found warehouses:", warehouses.length);
    return warehouses;
  } catch (error) {
    console.error("❌ Nova Poshta API error (getWarehouses):", error);
    return [];
  }
}

/**
 * Розрахунок вартості доставки
 * Використовує наш API route: /api/novaposhta/delivery-cost
 */
export async function calculateDeliveryCost(
  cityRef: string,
  weight: number = 1,
  cost: number = 0,
): Promise<number> {
  try {
    const params = new URLSearchParams({
      cityRef,
      weight: weight.toString(),
      cost: cost.toString(),
    });

    const response = await fetch(`/api/novaposhta/delivery-cost?${params}`);

    if (!response.ok) {
      console.error("❌ API request failed:", response.statusText);
      return 70;
    }

    const data = await response.json();
    console.log("💰 Delivery cost:", data.cost);
    return data.cost;
  } catch (error) {
    console.error("❌ Nova Poshta API error (calculateDeliveryCost):", error);
    return 70; // Fallback до базової ціни
  }
}

/**
 * Пошук відділень за текстовим запитом
 */
export async function searchWarehouses(
  cityRef: string,
  query: string,
): Promise<NovaPoshtaWarehouse[]> {
  const warehouses = await getWarehouses(cityRef);

  if (!query) {
    return warehouses;
  }

  return warehouses.filter(
    (wh) =>
      wh.description.toLowerCase().includes(query.toLowerCase()) ||
      wh.number.includes(query),
  );
}
