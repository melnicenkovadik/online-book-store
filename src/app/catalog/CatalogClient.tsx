"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs";
import React from "react";
import OptimizedImage from "@/components/OptimizedImage";
import {
  Button,
  ModalContent,
  ModalRoot,
  ModalTrigger,
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
  const perPage = 20;

  // Використовуємо nuqs для синхронізації URL state
  const [filters, setFilters] = useQueryStates(
    {
      q: parseAsString.withDefault(""),
      categoryId: parseAsString,
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
      vendor: parseAsString,
      class: parseAsString,
    },
    {
      history: "replace",
      shallow: true,
      scroll: false, // Вимикаємо автоматичний скрол
    },
  );

  const debouncedQ = useDebounce(filters.q, 300);

  // React Query для products з бесконечною підгрузкою
  const productParams = React.useMemo(() => {
    const params: Record<string, unknown> = {
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
    if (filters.vendor) params.vendor = filters.vendor;
    if (filters.class) params.class = filters.class;

    return params;
  }, [
    debouncedQ,
    filters.categoryId,
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
    filters.vendor,
    filters.class,
  ]);

  const {
    data: productsData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending: productsLoading,
  } = useInfiniteQuery({
    queryKey: ["products", productParams],
    queryFn: ({ pageParam = 1 }) => {
      return CatalogService.getProducts({
        ...productParams,
        page: pageParam,
      } as any);
    },
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.total / perPage);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Обєднуємо всі продукти з усіх сторінок
  const products: Product[] = React.useMemo(() => {
    return productsData?.pages.flatMap((page) => page.items) ?? [];
  }, [productsData]);

  const total = productsData?.pages[0]?.total ?? 0;

  // Стабільні ключі для скелетонів
  const skeletonKeys = React.useMemo(
    () =>
      Array.from({ length: perPage }, (_, i) => `skeleton-${i}-${Date.now()}`),
    [],
  );

  // IntersectionObserver для автопідгрузки
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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
    if (filters.vendor) params.vendor = filters.vendor;
    if (filters.class) params.class = filters.class;

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
    filters.vendor,
    filters.class,
  ]);

  const { data: facets } = useQuery<FacetsResponse>({
    queryKey: ["facets", facetParams],
    queryFn: () => CatalogService.getCategoryFacets(facetParams as any),
  });

  // Хелпер для оновлення фільтрів
  const updateFilter = React.useCallback(
    (updates: Partial<typeof filters>) => {
      setFilters(updates);
    },
    [setFilters],
  );

  // Скидання всіх фільтрів
  const resetFilters = React.useCallback(() => {
    setFilters({
      q: "",
      categoryId: null,
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
      vendor: null,
      class: null,
    });
  }, [setFilters]);

  // Підраховуємо активні фільтри
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (filters.categoryId) count++;
    if (filters.priceMin != null || filters.priceMax != null) count++;
    if (filters.inStock === "true") count++;
    if (filters.onSale === "true") count++;
    if (filters.year) count++;
    if (filters.author) count++;
    if (filters.publisher) count++;
    if (filters.language) count++;
    if (filters.coverType) count++;
    if (filters.vendor) count++;
    if (filters.class) count++;
    return count;
  }, [
    filters.categoryId,
    filters.priceMin,
    filters.priceMax,
    filters.inStock,
    filters.onSale,
    filters.year,
    filters.author,
    filters.publisher,
    filters.language,
    filters.coverType,
    filters.vendor,
    filters.class,
  ]);

  const [isFiltersOpen, setIsFiltersOpen] = React.useState(false);

  return (
    <div className={styles.page} id="catalog-page">
      <div className={styles.header}>
        <h1 id="catalog-title">Каталог</h1>
        <div className={styles.headerStats}>
          Знайдено: <strong>{total}</strong> {total === 1 ? "товар" : "товарів"}
        </div>
      </div>

      <div className={styles.toolbar}>
        <input
          id="catalog-search"
          placeholder="Пошук книг..."
          value={filters.q}
          onChange={(e) => updateFilter({ q: e.target.value })}
          className={styles.searchInput}
          aria-label="Пошук товарів"
        />

        <ModalRoot open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <ModalTrigger asChild>
            <Button variant="ghost" className={styles.filterButton}>
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                role="img"
                aria-label="Фільтри"
              >
                <title>Фільтри</title>
                <path
                  d="M2.5 5H17.5M5 10H15M7.5 15H12.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
              Фільтри
              {activeFiltersCount > 0 && (
                <span className={styles.filterBadge}>{activeFiltersCount}</span>
              )}
            </Button>
          </ModalTrigger>
          <ModalContent
            title="Фільтри"
            className={styles.filtersModal ?? ""}
            id="catalog-filters-modal"
          >
            <div className={styles.filtersGrid}>
              {/* Категорія */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Категорія</div>
                <SelectRoot
                  value={filters.categoryId ?? "all"}
                  onValueChange={(v) =>
                    updateFilter({ categoryId: v === "all" ? null : v })
                  }
                >
                  <SelectTrigger
                    id="catalog-category-trigger"
                    className={styles.selectTrigger}
                  >
                    <SelectValue placeholder="Усі категорії" />
                  </SelectTrigger>
                  <SelectContent id="catalog-category-content">
                    <SelectItem id="catalog-category-all" value="all">
                      Усі категорії
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
              </div>

              {/* Ціна */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>
                  Ціна: {filters.priceMin ?? 0} ₴ - {filters.priceMax ?? 1000} ₴
                </div>
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
              </div>

              {/* Рік */}
              {facets?.years && facets.years.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Рік видання</div>
                  <SelectRoot
                    value={filters.year?.toString() ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ year: v === "all" ? null : Number(v) })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
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
                </div>
              )}

              {/* Автор */}
              {facets?.authors && facets.authors.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Автор</div>
                  <SelectRoot
                    value={filters.author ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ author: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
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
                </div>
              )}

              {/* Видавець */}
              {facets?.publishers && facets.publishers.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Видавець</div>
                  <SelectRoot
                    value={filters.publisher ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ publisher: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
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
                </div>
              )}

              {/* Мова */}
              {facets?.languages && facets.languages.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Мова</div>
                  <SelectRoot
                    value={filters.language ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ language: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
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
                </div>
              )}

              {/* Тип обкладинки */}
              {facets?.coverTypes && facets.coverTypes.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Тип обкладинки</div>
                  <SelectRoot
                    value={filters.coverType ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ coverType: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
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
                </div>
              )}

              {/* Постачальник */}
              {facets?.vendors && facets.vendors.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Постачальник</div>
                  <SelectRoot
                    value={filters.vendor ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ vendor: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue placeholder="Всі постачальники" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі постачальники</SelectItem>
                      {facets.vendors.map((v) => (
                        <SelectItem key={v.vendor} value={v.vendor}>
                          {v.vendor} ({v.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </div>
              )}

              {/* Клас */}
              {facets?.classes && facets.classes.length > 0 && (
                <div className={styles.filterGroup}>
                  <div className={styles.filterLabel}>Клас</div>
                  <SelectRoot
                    value={filters.class ?? "all"}
                    onValueChange={(v) =>
                      updateFilter({ class: v === "all" ? null : v })
                    }
                  >
                    <SelectTrigger className={styles.selectTrigger}>
                      <SelectValue placeholder="Всі класи" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Всі класи</SelectItem>
                      {facets.classes.map((c) => (
                        <SelectItem key={c.class} value={c.class}>
                          {c.class} клас ({c.count})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </div>
              )}

              {/* Чекбокси */}
              <div className={styles.filterGroup}>
                <div className={styles.filterLabel}>Додатково</div>
                <div className={styles.checkboxes}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.inStock === "true"}
                      onChange={(e) =>
                        updateFilter({
                          inStock: e.target.checked ? "true" : null,
                        })
                      }
                      className={styles.checkboxInput}
                    />
                    <span>В наявності</span>
                  </label>

                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={filters.onSale === "true"}
                      onChange={(e) =>
                        updateFilter({
                          onSale: e.target.checked ? "true" : null,
                        })
                      }
                      className={styles.checkboxInput}
                    />
                    <span>Зі знижкою</span>
                  </label>
                </div>
              </div>
            </div>

            <div className={styles.filtersActions}>
              <Button variant="ghost" onClick={resetFilters}>
                Скинути все
              </Button>
              <Button variant="primary" onClick={() => setIsFiltersOpen(false)}>
                Застосувати
              </Button>
            </div>
          </ModalContent>
        </ModalRoot>

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
        {filters.vendor && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ vendor: null })}
            aria-label="Видалити фільтр за постачальником"
          >
            постачальник: {filters.vendor} ×
          </button>
        )}
        {filters.class && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => updateFilter({ class: null })}
            aria-label="Видалити фільтр за класом"
          >
            клас: {filters.class} ×
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

      {/* Індикатор завантаження для бесконечного скролу */}
      {!productsLoading && products.length > 0 && (
        <div ref={loadMoreRef} className={styles.loadMore}>
          {isFetchingNextPage && (
            <div className={styles.loadingIndicator}>
              <div className={styles.spinner} />
              <span>Завантаження...</span>
            </div>
          )}
          {!hasNextPage && products.length > 0 && (
            <div className={styles.endMessage}>Ви переглянули всі товари</div>
          )}
        </div>
      )}
    </div>
  );
}
