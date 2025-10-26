"use client";
import {
  useInfiniteQuery,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import React from "react";
import { useDebounce } from "@/hooks";
import { AdminApi } from "@/services/admin";
import type { Product } from "@/types/catalog";
import styles from "./products.module.scss";

export default function AdminProductsListPage() {
  const [q, setQ] = React.useState("");
  const [sort, setSort] = React.useState("newest");
  const [categoryFilter, setCategoryFilter] = React.useState<string>("all");
  const [inStock, setInStock] = React.useState(false);
  const [onSale, setOnSale] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const perPage = 50;
  const debouncedQ = useDebounce(q, 300);
  const queryClient = useQueryClient();

  // Infinite query для продуктів
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending: isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: [
      "admin/products",
      { q: debouncedQ, sort, categoryFilter, inStock, onSale },
    ],
    queryFn: ({ pageParam = 1 }) =>
      AdminApi.listProducts({
        q: debouncedQ,
        page: pageParam,
        perPage,
        categoryId: categoryFilter !== "all" ? categoryFilter : undefined,
        inStock: inStock || undefined,
        onSale: onSale || undefined,
        sort,
      }),
    getNextPageParam: (lastPage, pages) => {
      const totalPages = Math.ceil(lastPage.total / perPage);
      const nextPage = pages.length + 1;
      return nextPage <= totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  // Отримуємо всі продукти з усіх сторінок
  const allProducts = React.useMemo(() => {
    return data?.pages.flatMap((page) => page.items) ?? [];
  }, [data]);

  const total = data?.pages[0]?.total ?? 0;

  const { data: categoriesData } = useQuery({
    queryKey: ["admin/categories"],
    queryFn: () => AdminApi.listCategories(),
  });

  const onDelete = async (id: string) => {
    if (!confirm("Видалити товар?")) return;
    await AdminApi.deleteProduct(id);
    queryClient.invalidateQueries({ queryKey: ["admin/products"] });
  };

  const onDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Видалити ${selected.size} товар(ів)?`)) return;

    for (const id of selected) {
      await AdminApi.deleteProduct(id);
    }

    setSelected(new Set());
    queryClient.invalidateQueries({ queryKey: ["admin/products"] });
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  const toggleSelectAll = () => {
    if (selected.size === allProducts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allProducts.map((p: Product) => p.id)));
    }
  };

  // Бекенд вже фільтрує і сортує, просто повертаємо всі продукти
  const sortedProducts = allProducts;

  // IntersectionObserver для автопідгрузки
  const loadMoreRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const currentRef = loadMoreRef.current;
    if (!currentRef || !hasNextPage || isFetchingNextPage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(currentRef);

    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Підраховуємо активні фільтри
  const activeFiltersCount = React.useMemo(() => {
    let count = 0;
    if (categoryFilter !== "all") count++;
    if (inStock) count++;
    if (onSale) count++;
    return count;
  }, [categoryFilter, inStock, onSale]);

  // Скидаємо фільтри
  const resetFilters = () => {
    setQ("");
    setCategoryFilter("all");
    setInStock(false);
    setOnSale(false);
    setSort("newest");
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Товари</h1>
          <div className={styles.headerStats}>
            {activeFiltersCount > 0 || q ? (
              <>
                Знайдено: <strong>{total}</strong>{" "}
                {total === 1 ? "товар" : "товарів"}
                {hasNextPage && (
                  <span style={{ color: "#6b7280", marginLeft: "8px" }}>
                    (завантажено {sortedProducts.length})
                  </span>
                )}
              </>
            ) : (
              <>
                Всього: <strong>{total}</strong>{" "}
                {total === 1 ? "товар" : "товарів"}
              </>
            )}
          </div>
        </div>
        <Link href="/admin/products/new" className={styles.addButton}>
          <span>+</span> Додати товар
        </Link>
      </div>

      <div className={styles.toolbar}>
        <input
          placeholder="Пошук товарів..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={styles.searchInput}
        />

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="all">Усі категорії</option>
          {categoriesData?.map((cat: any) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className={styles.sortSelect}
        >
          <option value="newest">Новинки</option>
          <option value="price-asc">Ціна: від низької</option>
          <option value="price-desc">Ціна: від високої</option>
          <option value="title-asc">Назва: A → Я</option>
          <option value="title-desc">Назва: Я → A</option>
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => setInStock(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span>В наявності</span>
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={onSale}
            onChange={(e) => setOnSale(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span>Зі знижкою</span>
        </label>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={resetFilters}
            className={styles.resetButton}
          >
            ✕ Скинути фільтри
          </button>
        )}

        {selected.size > 0 && (
          <button
            type="button"
            onClick={onDeleteSelected}
            className={styles.deleteButton}
          >
            🗑️ Видалити ({selected.size})
          </button>
        )}
      </div>

      {/* Active filters chips */}
      {activeFiltersCount > 0 && (
        <div className={styles.chips}>
          {q && (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setQ("")}
            >
              пошук: "{q}" ×
            </button>
          )}
          {categoryFilter !== "all" && (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setCategoryFilter("all")}
            >
              категорія ×
            </button>
          )}
          {inStock && (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setInStock(false)}
            >
              в наявності ×
            </button>
          )}
          {onSale && (
            <button
              type="button"
              className={styles.chip}
              onClick={() => setOnSale(false)}
            >
              зі знижкою ×
            </button>
          )}
          <button
            type="button"
            className={styles.chipReset}
            onClick={resetFilters}
          >
            Скинути все
          </button>
        </div>
      )}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.checkboxCol}>
                <input
                  type="checkbox"
                  checked={
                    selected.size === sortedProducts.length &&
                    sortedProducts.length > 0
                  }
                  onChange={toggleSelectAll}
                  className={styles.checkbox}
                />
              </th>
              <th className={styles.th}>Назва</th>
              <th className={styles.th}>Ціна</th>
              <th className={styles.th}>Склад</th>
              <th className={styles.th}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={5} className={styles.td}>
                  Завантаження…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={5} className={styles.tdError}>
                  Помилка завантаження: {error.message}
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              sortedProducts.map((p: Product) => (
                <tr
                  key={p.id}
                  className={selected.has(p.id) ? styles.selectedRow : ""}
                >
                  <td className={styles.checkboxCol}>
                    <input
                      type="checkbox"
                      checked={selected.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      className={styles.checkbox}
                    />
                  </td>
                  <td className={styles.td}>{p.title}</td>
                  <td className={styles.td}>
                    {p.salePrice != null ? (
                      <>
                        <s className={styles.oldPrice}>{p.price}</s>{" "}
                        <strong className={styles.salePrice}>
                          {p.salePrice}
                        </strong>
                      </>
                    ) : (
                      p.price
                    )}
                  </td>
                  <td className={styles.td}>{p.stock}</td>
                  <td className={styles.td}>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/products/${p.id}`}
                        className={styles.iconButton}
                        title="Редагувати"
                      >
                        ✏️
                      </Link>
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className={styles.iconButton}
                        title="Видалити"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            {!isLoading && !error && sortedProducts.length === 0 && (
              <tr>
                <td colSpan={5} className={styles.tdEmpty}>
                  Товарів немає
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Індикатор завантаження для бесконечного скролу */}
      {!isLoading && sortedProducts.length > 0 && (
        <div ref={loadMoreRef} className={styles.loadMore}>
          {isFetchingNextPage && (
            <div className={styles.loadingIndicator}>
              <div className={styles.spinner} />
              <span>Завантаження...</span>
            </div>
          )}
          {!hasNextPage && sortedProducts.length > 0 && (
            <div className={styles.endMessage}>Всі товари завантажено</div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && sortedProducts.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Товарів не знайдено</div>
          <div className={styles.emptyText}>
            Спробуйте змінити фільтри або скинути їх
          </div>
          {activeFiltersCount > 0 && (
            <button
              type="button"
              onClick={resetFilters}
              className={styles.addButton}
            >
              Скинути фільтри
            </button>
          )}
        </div>
      )}
    </div>
  );
}
