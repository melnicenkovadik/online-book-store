"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
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
import { CatalogService } from "@/services/catalog";
import type { Category, Product } from "@/types/catalog";
import styles from "./Catalog.module.scss";

export default function CatalogClient() {
  const _router = useRouter();
  const sp = useSearchParams();

  // Filters & sort state
  const [q, setQ] = React.useState("");
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [page, setPage] = React.useState(1);
  const [priceMin, setPriceMin] = React.useState<number | "">("");
  const [priceMax, setPriceMax] = React.useState<number | "">("");
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [onSaleOnly, setOnSaleOnly] = React.useState(false);
  const [sort, setSort] = React.useState<
    "price-asc" | "price-desc" | "title-asc" | "title-desc" | "newest"
  >("newest");

  const perPage = 12;
  const debouncedQ = useDebounce(q, 300);
  const lastUrlRef = React.useRef<string>("");
  const rafRef = React.useRef<number | null>(null);

  // Initialize from URL once
  React.useEffect(() => {
    const qp = sp;
    const getBool = (key: string) => {
      const v = qp.get(key);
      return v === "true" ? true : v === "false" ? false : undefined;
    };
    const getNum = (key: string) =>
      qp.get(key) ? Number(qp.get(key)) : undefined;

    setQ(qp.get("q") ?? "");
    setCategoryId(qp.get("categoryId") ?? undefined);
    setPage(getNum("page") ?? 1);

    const pmin0 = getNum("priceMin");
    const pmax0 = getNum("priceMax");
    if (pmin0 != null) setPriceMin(pmin0);
    if (pmax0 != null) setPriceMax(pmax0);

    const in0 = getBool("inStock");
    const sale0 = getBool("onSale");
    if (in0 != null) setInStockOnly(in0);
    if (sale0 != null) setOnSaleOnly(sale0);

    const s0 = qp.get("sort") as typeof sort | null;
    if (s0) setSort(s0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]); // Run only once on mount

  // Update URL helper - only via History API to avoid navigation/scroll reset
  const updateUrl = React.useCallback(
    (
      overrides: Partial<{
        q: string;
        categoryId: string | undefined;
        page: number;
        priceMin: number | "";
        priceMax: number | "";
        inStockOnly: boolean;
        onSaleOnly: boolean;
        sort:
          | "price-asc"
          | "price-desc"
          | "title-asc"
          | "title-desc"
          | "newest";
      }> = {},
    ) => {
      if (typeof window === "undefined") return;

      const usp = new URLSearchParams();

      const qVal = overrides.q ?? debouncedQ;
      const catVal = overrides.categoryId ?? categoryId;
      const pageVal = overrides.page ?? page;
      const minVal = overrides.priceMin ?? priceMin;
      const maxVal = overrides.priceMax ?? priceMax;
      const inVal = overrides.inStockOnly ?? inStockOnly;
      const saleVal = overrides.onSaleOnly ?? onSaleOnly;
      const sortVal = overrides.sort ?? sort;

      if (qVal) usp.set("q", qVal);
      if (catVal) usp.set("categoryId", catVal);
      if (pageVal !== 1) usp.set("page", String(pageVal));
      if (minVal !== "") usp.set("priceMin", String(minVal));
      if (maxVal !== "") usp.set("priceMax", String(maxVal));
      if (inVal) usp.set("inStock", "true");
      if (saleVal) usp.set("onSale", "true");
      if (sortVal !== "newest") usp.set("sort", sortVal);

      const newUrl = `/catalog${usp.toString() ? `?${usp.toString()}` : ""}`;
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (newUrl !== currentUrl && newUrl !== lastUrlRef.current) {
        if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
        rafRef.current = requestAnimationFrame(() => {
          window.history.replaceState(null, "", newUrl);
          lastUrlRef.current = newUrl;
          rafRef.current = null;
        });
      }
    },
    [
      debouncedQ,
      categoryId,
      page,
      priceMin,
      priceMax,
      inStockOnly,
      onSaleOnly,
      sort,
    ],
  );

  // React Query for products
  const productParams = React.useMemo(
    () => ({
      q: debouncedQ || undefined,
      categoryId,
      page,
      perPage,
      sort,
      priceMin: priceMin !== "" ? priceMin : undefined,
      priceMax: priceMax !== "" ? priceMax : undefined,
      inStock: inStockOnly || undefined,
      onSale: onSaleOnly || undefined,
    }),
    [
      debouncedQ,
      categoryId,
      page,
      sort,
      priceMin,
      priceMax,
      inStockOnly,
      onSaleOnly,
    ],
  );

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["products", productParams],
    queryFn: () => CatalogService.getProducts(productParams),
    keepPreviousData: true,
  });

  const products: Product[] = productsData?.items ?? [];
  const total = productsData?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  // React Query for categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: () => CatalogService.getCategories(),
  });

  // React Query for facets
  const facetParams = React.useMemo(
    () => ({
      q: debouncedQ || undefined,
      categoryId,
      sort,
      inStock: inStockOnly || undefined,
      onSale: onSaleOnly || undefined,
    }),
    [debouncedQ, categoryId, sort, inStockOnly, onSaleOnly],
  );

  const { data: facets } = useQuery({
    queryKey: ["facets", facetParams],
    queryFn: () => CatalogService.getCategoryFacets(facetParams),
  });

  // No automatic URL sync in effects — only explicit updates in handlers

  // Reset to page 1 helper
  const _resetPage = React.useCallback(() => {
    setPage(1);
  }, []);

  // Reset all filters
  const resetFilters = React.useCallback(() => {
    setQ("");
    setCategoryId(undefined);
    setPriceMin("");
    setPriceMax("");
    setInStockOnly(false);
    setOnSaleOnly(false);
    setSort("newest");
    setPage(1);
    updateUrl({
      q: "",
      categoryId: undefined,
      page: 1,
      priceMin: "",
      priceMax: "",
      inStockOnly: false,
      onSaleOnly: false,
      sort: "newest",
    });
  }, [updateUrl]);

  return (
    <div className={styles.page} id="catalog-page">
      <h1 id="catalog-title">Каталог</h1>

      <div className={styles.controls}>
        <input
          id="catalog-search"
          placeholder="Пошук…"
          value={q}
          onChange={(e) => {
            const value = e.target.value;
            setQ(value);
            setPage(1);
            updateUrl({ q: value, page: 1 });
          }}
          className={styles.searchInput}
          aria-label="Пошук товарів"
        />

        <SelectRoot
          value={categoryId ?? "all"}
          onValueChange={(v) => {
            const nextCategory = v === "all" ? undefined : v;
            setCategoryId(nextCategory);
            setPage(1);
            updateUrl({ categoryId: nextCategory, page: 1 });
          }}
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
            [
              priceMin === "" ? 0 : priceMin,
              priceMax === "" ? 1000 : priceMax,
            ] as [number, number]
          }
          onChange={([lo, hi]) => {
            setPriceMin(lo);
            setPriceMax(hi);
            setPage(1);
            updateUrl({ priceMin: lo, priceMax: hi, page: 1 });
          }}
          aria-label="Діапазон ціни"
        />

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => {
              const next = e.target.checked;
              setInStockOnly(next);
              setPage(1);
              updateUrl({ inStockOnly: next, page: 1 });
            }}
            aria-label="Показати тільки товари в наявності"
          />{" "}
          В наявності
        </label>

        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => {
              const next = e.target.checked;
              setOnSaleOnly(next);
              setPage(1);
              updateUrl({ onSaleOnly: next, page: 1 });
            }}
            aria-label="Показати тільки товари зі знижкою"
          />{" "}
          Зі знижкою
        </label>

        <SelectRoot
          value={sort}
          onValueChange={(v) => {
            const nextSort = v as typeof sort;
            setSort(nextSort);
            setPage(1);
            updateUrl({ sort: nextSort, page: 1 });
          }}
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
      <div className={styles.chips} role="region" aria-label="Активні фільтри">
        {q && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setQ("");
              updateUrl({ q: "", page: 1 });
              setPage(1);
            }}
            aria-label="Видалити пошуковий запит"
          >
            пошук: "{q}" ×
          </button>
        )}
        {categoryId && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setCategoryId(undefined);
              setPage(1);
              updateUrl({ categoryId: undefined, page: 1 });
            }}
            aria-label="Видалити фільтр за категорією"
          >
            категорія ×
          </button>
        )}
        {priceMin !== "" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setPriceMin("");
              setPage(1);
              updateUrl({ priceMin: "", page: 1 });
            }}
            aria-label="Видалити мінімальну ціну"
          >
            мін: {priceMin} ×
          </button>
        )}
        {priceMax !== "" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setPriceMax("");
              setPage(1);
              updateUrl({ priceMax: "", page: 1 });
            }}
            aria-label="Видалити максимальну ціну"
          >
            макс: {priceMax} ×
          </button>
        )}
        {inStockOnly && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setInStockOnly(false);
              setPage(1);
              updateUrl({ inStockOnly: false, page: 1 });
            }}
            aria-label="Видалити фільтр 'в наявності'"
          >
            в наявності ×
          </button>
        )}
        {onSaleOnly && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setOnSaleOnly(false);
              setPage(1);
              updateUrl({ onSaleOnly: false, page: 1 });
            }}
            aria-label="Видалити фільтр 'зі знижкою'"
          >
            зі знижкою ×
          </button>
        )}
        {sort !== "newest" && (
          <button
            type="button"
            className={styles.chip}
            onClick={() => {
              setSort("newest");
              setPage(1);
              updateUrl({ sort: "newest", page: 1 });
            }}
            aria-label="Скинути сортування"
          >
            сортування: {sort} ×
          </button>
        )}
      </div>

      {/* Loading skeleton */}
      {productsLoading && (
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: perPage }).map((_, i) => (
            <div key={`skeleton-${i}`} className={styles.skeletonCard} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!productsLoading && products.length === 0 && (
        <div className={styles.empty} role="status">
          <div className={styles.emptyTitle}>Нічого не знайдено</div>
          <div className={styles.emptyText}>
            Спробуйте змінити фільтри або скинути їх
          </div>
          <Button variant="ghost" onClick={resetFilters}>
            Скинути фільтри
          </Button>
        </div>
      )}

      {/* Products grid */}
      {!productsLoading && products.length > 0 && (
        <div
          className={styles.grid}
          id="catalog-grid"
          role="grid"
          aria-label="Результати пошуку"
        >
          {products.map((p) => (
            <a
              id={`catalog-card-${p.id}`}
              key={p.id}
              href={`/product/${p.slug}`}
              className={styles.card}
              role="gridcell"
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
        <div
          className={styles.pagination}
          id="catalog-pagination"
          role="navigation"
          aria-label="Пагінація"
        >
          <Button
            id="catalog-prev"
            variant="ghost"
            disabled={page <= 1}
            onClick={() => {
              const next = Math.max(1, page - 1);
              setPage(next);
              updateUrl({ page: next });
            }}
            aria-label="Попередня сторінка"
          >
            Назад
          </Button>
          <span id="catalog-page-indicator" style={{ opacity: 0.8 }}>
            Сторінка {page} з {pages}
          </span>
          <Button
            id="catalog-next"
            variant="ghost"
            disabled={page >= pages}
            onClick={() => {
              const next = Math.min(pages, page + 1);
              setPage(next);
              updateUrl({ page: next });
            }}
            aria-label="Наступна сторінка"
          >
            Далі
          </Button>
        </div>
      )}
    </div>
  );
}
