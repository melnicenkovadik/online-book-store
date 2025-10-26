"use client";

import { useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import React from "react";
import OptimizedImage from "@/components/OptimizedImage";
import {
  Button,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Slider,
} from "@/components/uikit";
import { useDebounce } from "@/hooks";
import { CatalogService, type FacetsResponse } from "@/services/catalog";
import type { Category, Product } from "@/types/catalog";
import styles from "./Catalog.module.scss";

export default function CatalogClient() {
  const perPage = 12;

  // Використовуємо nuqs для синхронізації URL state
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      categoryId: parseAsString,
      page: parseAsInteger.withDefault(1),
      priceMin: parseAsInteger,
      priceMax: parseAsInteger,
      inStock: parseAsString,
      onSale: parseAsString,
      sort: parseAsString.withDefault("newest"),
      year: parseAsInteger,
      author: parseAsString,
      publisher: parseAsString,
      language: parseAsString,
      coverType: parseAsString,
    },
    {
      history: "replace",
      shallow: true,
      scroll: false, // Вимикаємо автоматичний скрол
    },
  );

  console.log("[CatalogClient] filters:", filters);
  console.log("[CatalogClient] filters.page:", filters.page);
  console.log("[CatalogClient] filters.sort:", filters.sort);

  const debouncedQ = useDebounce(filters.q, 300);

  // React Query для products
  const productParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
      page: filters.page,
      perPage,
      sort: filters.sort,
    };

    if (debouncedQ) params.q = debouncedQ;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.priceMin != null) params.priceMin = filters.priceMin;
    if (filters.priceMax != null) params.priceMax = filters.priceMax;
    if (filters.inStock === "true") params.inStock = true;
    if (filters.onSale === "true") params.onSale = true;
    if (filters.year) params.year = filters.year;
    if (filters.author) params.author = filters.author;
    if (filters.publisher) params.publisher = filters.publisher;
    if (filters.language) params.language = filters.language;
    if (filters.coverType) params.coverType = filters.coverType;

    return params;
  }, [
    debouncedQ,
    filters.categoryId,
    filters.page,
    filters.sort,
    filters.priceMin,
    filters.priceMax,
    filters.inStock,
    filters.onSale,
    filters.year,
    filters.author,
    filters.publisher,
    filters.language,
    filters.coverType,
  ]);

  console.log(
    "[CatalogClient] About to call useQuery with productParams:",
    productParams,
  );

  const { data: productsData, isPending: productsLoading } = useQuery({
    queryKey: ["products", productParams],
    queryFn: () => {
      console.log("[CatalogClient] queryFn CALLED!");
      return CatalogService.getProducts(productParams as any);
    },
  });

  console.log(
    "[CatalogClient] After useQuery - productsLoading:",
    productsLoading,
    "productsData:",
    productsData,
  );

  const products: Product[] = productsData?.items ?? [];
  const total = productsData?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  // Стабільні ключі для скелетонів
  const skeletonKeys = React.useMemo(
    () =>
      Array.from({ length: perPage }, (_, i) => `skeleton-${i}-${Date.now()}`),
    [],
  );

  // React Query для categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => CatalogService.getCategories(),
  });

  // React Query для facets
  const facetParams = React.useMemo(() => {
    const params: Record<string, unknown> = { sort: filters.sort };

    if (debouncedQ) params.q = debouncedQ;
    if (filters.categoryId) params.categoryId = filters.categoryId;
    if (filters.inStock === "true") params.inStock = true;
    if (filters.onSale === "true") params.onSale = true;
    if (filters.year) params.year = filters.year;
    if (filters.author) params.author = filters.author;
    if (filters.publisher) params.publisher = filters.publisher;
    if (filters.language) params.language = filters.language;
    if (filters.coverType) params.coverType = filters.coverType;

    return params;
  }, [
    debouncedQ,
    filters.categoryId,
    filters.sort,
    filters.inStock,
    filters.onSale,
    filters.year,
    filters.author,
    filters.publisher,
    filters.language,
    filters.coverType,
  ]);

  const { data: facets } = useQuery<FacetsResponse>({
    queryKey: ["facets", facetParams],
    queryFn: () => CatalogService.getCategoryFacets(facetParams as any),
  });

  // Хелпер для оновлення фільтрів
  const updateFilter = React.useCallback(
    (updates: Partial<typeof filters>) => {
      // Автоматично скидаємо сторінку на 1, якщо це не зміна сторінки
      if (!("page" in updates)) {
        updates.page = 1;
      }

      setFilters(updates);
    },
    [setFilters],
  );

  // Скидання всіх фільтрів
  const resetFilters = React.useCallback(() => {
    setFilters({
      q: "",
      categoryId: null,
      page: 1,
      priceMin: null,
      priceMax: null,
      inStock: null,
      onSale: null,
      sort: "newest",
      year: null,
      author: null,
      publisher: null,
      language: null,
      coverType: null,
    });
  }, [setFilters]);

  return (
    <div className={styles.page} id="catalog-page">
      <h1 id="catalog-title">Каталог</h1>

      <div className={styles.controls}>
        <input
          id="catalog-search"
          placeholder="Пошук…"
          value={filters.q}
          onChange={(e) => updateFilter({ q: e.target.value })}
          className={styles.searchInput}
          aria-label="Пошук товарів"
        />

        <SelectRoot
          value={filters.categoryId ?? "all"}
          onValueChange={(v) =>
            updateFilter({ categoryId: v === "all" ? null : v })
          }
        >
          <SelectTrigger
            id="catalog-category-trigger"
            className={styles.selectTrigger}
            aria-label="Вибрати категорію"
          >
            <SelectValue placeholder="Усі категорії" />
          </SelectTrigger>
          <SelectContent id="catalog-category-content">
            <SelectItem id="catalog-category-all" value="all">
              Усі
            </SelectItem>
            {categories.map((c) => {
              const count = facets?.categories?.[c.id] ?? 0;
              return (
                <SelectItem
                  id={`catalog-category-${c.id}`}
                  key={c.id}
                  value={c.id}
                >
                  {c.name} {count ? `(${count})` : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </SelectRoot>

        <Slider
          min={0}
          max={1000}
          value={
            [filters.priceMin ?? 0, filters.priceMax ?? 1000] as [
              number,
              number,
            ]
          }
          onChange={([lo, hi]) =>
            updateFilter({ priceMin: lo || null, priceMax: hi || null })
          }
          aria-label="Діапазон ціни"
        />

        {/* Новий фільтр: Рік */}
        {facets?.years && facets.years.length > 0 && (
          <SelectRoot
            value={filters.year?.toString() ?? "all"}
            onValueChange={(v) =>
              updateFilter({ year: v === "all" ? null : Number(v) })
            }
          >
            <SelectTrigger className={styles.selectTrigger} aria-label="Рік">
              <SelectValue placeholder="Всі роки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі роки</SelectItem>
              {facets.years.map((y) => (
                <SelectItem key={y.year} value={y.year.toString()}>
                  {y.year} ({y.count})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}

        {/* Новий фільтр: Автор */}
        {facets?.authors && facets.authors.length > 0 && (
          <SelectRoot
            value={filters.author ?? "all"}
            onValueChange={(v) =>
              updateFilter({ author: v === "all" ? null : v })
            }
          >
            <SelectTrigger className={styles.selectTrigger} aria-label="Автор">
              <SelectValue placeholder="Всі автори" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі автори</SelectItem>
              {facets.authors.slice(0, 20).map((a) => (
                <SelectItem key={a.author} value={a.author}>
                  {a.author} ({a.count})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}

        {/* Новий фільтр: Видавець */}
        {facets?.publishers && facets.publishers.length > 0 && (
          <SelectRoot
            value={filters.publisher ?? "all"}
            onValueChange={(v) =>
              updateFilter({ publisher: v === "all" ? null : v })
            }
          >
            <SelectTrigger
              className={styles.selectTrigger}
              aria-label="Видавець"
            >
              <SelectValue placeholder="Всі видавці" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі видавці</SelectItem>
              {facets.publishers.slice(0, 20).map((p) => (
                <SelectItem key={p.publisher} value={p.publisher}>
                  {p.publisher} ({p.count})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}

        {/* Новий фільтр: Мова */}
        {facets?.languages && facets.languages.length > 0 && (
          <SelectRoot
            value={filters.language ?? "all"}
            onValueChange={(v) =>
              updateFilter({ language: v === "all" ? null : v })
            }
          >
            <SelectTrigger className={styles.selectTrigger} aria-label="Мова">
              <SelectValue placeholder="Всі мови" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі мови</SelectItem>
              {facets.languages.map((l) => (
                <SelectItem key={l.language} value={l.language}>
                  {l.language} ({l.count})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}

        {/* Новий фільтр: Тип обкладинки */}
        {facets?.coverTypes && facets.coverTypes.length > 0 && (
          <SelectRoot
            value={filters.coverType ?? "all"}
            onValueChange={(v) =>
              updateFilter({ coverType: v === "all" ? null : v })
            }
          >
            <SelectTrigger
              className={styles.selectTrigger}
              aria-label="Тип обкладинки"
            >
              <SelectValue placeholder="Всі типи" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі типи</SelectItem>
              {facets.coverTypes.map((ct) => (
                <SelectItem key={ct.coverType} value={ct.coverType}>
                  {ct.coverType} ({ct.count})
                </SelectItem>
              ))}
            </SelectContent>
          </SelectRoot>
        )}

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={filters.inStock === "true"}
            onChange={(e) =>
              updateFilter({ inStock: e.target.checked ? "true" : null })
            }
            aria-label="Показати тільки товари в наявності"
          />{" "}
          В наявності
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={filters.onSale === "true"}
            onChange={(e) =>
              updateFilter({ onSale: e.target.checked ? "true" : null })
            }
            aria-label="Показати тільки товари зі знижкою"
          />{" "}
          Зі знижкою
        </label>

        <SelectRoot
          value={filters.sort}
          onValueChange={(v) => updateFilter({ sort: v })}
        >
          <SelectTrigger
            id="catalog-sort-trigger"
            className={styles.selectTrigger}
            aria-label="Сортування"
          >
            <SelectValue placeholder="Сортування" />
          </SelectTrigger>
          <SelectContent id="catalog-sort-content">
            <SelectItem value="newest">Новинки</SelectItem>
            <SelectItem value="price-asc">
              Ціна: від низької до високої
            </SelectItem>
            <SelectItem value="price-desc">
              Ціна: від високої до низької
            </SelectItem>
            <SelectItem value="title-asc">Назва: A → Я</SelectItem>
            <SelectItem value="title-desc">Назва: Я → A</SelectItem>
          </SelectContent>
        </SelectRoot>

        <Button
          variant="ghost"
          onClick={resetFilters}
          aria-label="Скинути всі фільтри"
        >
          Скинути
        </Button>
      </div>

      {/* Active filter chips */}
      <section className={styles.chips} aria-label="Активні фільтри">
        {filters.q && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ q: "" })}
            aria-label="Видалити пошуковий запит"
          >
            пошук: "{filters.q}" ×
          </button>
        )}
        {filters.categoryId && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ categoryId: null })}
            aria-label="Видалити фільтр за категорією"
          >
            категорія ×
          </button>
        )}
        {filters.priceMin != null && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ priceMin: null })}
            aria-label="Видалити мінімальну ціну"
          >
            мін: {filters.priceMin} ×
          </button>
        )}
        {filters.priceMax != null && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ priceMax: null })}
            aria-label="Видалити максимальну ціну"
          >
            макс: {filters.priceMax} ×
          </button>
        )}
        {filters.year && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ year: null })}
            aria-label="Видалити фільтр за роком"
          >
            рік: {filters.year} ×
          </button>
        )}
        {filters.author && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ author: null })}
            aria-label="Видалити фільтр за автором"
          >
            автор: {filters.author} ×
          </button>
        )}
        {filters.publisher && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ publisher: null })}
            aria-label="Видалити фільтр за видавцем"
          >
            видавець: {filters.publisher} ×
          </button>
        )}
        {filters.language && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ language: null })}
            aria-label="Видалити фільтр за мовою"
          >
            мова: {filters.language} ×
          </button>
        )}
        {filters.coverType && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ coverType: null })}
            aria-label="Видалити фільтр за обкладинкою"
          >
            обкладинка: {filters.coverType} ×
          </button>
        )}
        {filters.inStock === "true" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ inStock: null })}
            aria-label="Видалити фільтр 'в наявності'"
          >
            в наявності ×
          </button>
        )}
        {filters.onSale === "true" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ onSale: null })}
            aria-label="Видалити фільтр 'зі знижкою'"
          >
            зі знижкою ×
          </button>
        )}
        {filters.sort !== "newest" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ sort: "newest" })}
            aria-label="Скинути сортування"
          >
            сортування: {filters.sort} ×
          </button>
        )}
      </section>

      {/* Loading skeleton */}
      {productsLoading && (
        <div className={styles.grid} aria-hidden>
          {skeletonKeys.map((key) => (
            <div key={key} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!productsLoading && products.length === 0 && (
        <output className={styles.empty}>
          <div className={styles.emptyTitle}>Нічого не знайдено</div>
          <div className={styles.emptyText}>
            Спробуйте змінити фільтри або скинути їх
          </div>
          <Button variant="ghost" onClick={resetFilters}>
            Скинути фільтри
          </Button>
        </output>
      )}

      {/* Products grid */}
      {!productsLoading && products.length > 0 && (
        <div className={styles.grid} id="catalog-grid">
          {products.map((p) => (
            <a
              id={`catalog-card-${p.id}`}
              key={p.id}
              href={`/product/${p.slug}`}
              className={styles.card}
            >
              <div className={styles.cardImage}>
                {p.images?.[0] ? (
                  <OptimizedImage
                    src={p.images[0]}
                    alt={p.title}
                    width={200}
                    height={200}
                    style={{ objectFit: "contain" }}
                    loadingComponent={
                      <div className={styles.imagePlaceholder} />
                    }
                  />
                ) : (
                  <div className={styles.noImage}>Немає зображення</div>
                )}
              </div>
              <div className={styles.cardTitle}>{p.title}</div>
              <div className={styles.cardMeta}>Артикул: {p.sku}</div>
              <div className={styles.priceRow}>
                <strong>{p.salePrice ?? p.price} ₴</strong>
                {p.salePrice && <s className={styles.oldPrice}>{p.price} ₴</s>}
              </div>
              <div className={styles.stock}>
                {p.stock > 0 ? (
                  <span className={styles.inStock}>В наявності</span>
                ) : (
                  <span className={styles.outOfStock}>Немає в наявності</span>
                )}
              </div>
              <Button id={`catalog-card-${p.id}-view`} variant="primary">
                Переглянути
              </Button>
            </a>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!productsLoading && products.length > 0 && pages > 1 && (
        <nav
          className={styles.pagination}
          id="catalog-pagination"
          aria-label="Пагінація"
        >
          <Button
            id="catalog-prev"
            variant="ghost"
            disabled={filters.page <= 1}
            onClick={() =>
              updateFilter({ page: Math.max(1, filters.page - 1) })
            }
            aria-label="Попередня сторінка"
          >
            Назад
          </Button>
          <span id="catalog-page-indicator" style={{ opacity: 0.8 }}>
            Сторінка {filters.page} з {pages}
          </span>
          <Button
            id="catalog-next"
            variant="ghost"
            disabled={filters.page >= pages}
            onClick={() =>
              updateFilter({ page: Math.min(pages, filters.page + 1) })
            }
            aria-label="Наступна сторінка"
          >
            Далі
          </Button>
        </nav>
      )}
    </div>
  );
}
