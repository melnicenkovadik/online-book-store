"use client";

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { CatalogService } from '@/services/catalog';
import type { Category, Product } from '@/types/catalog';
import { Button, SelectRoot, SelectTrigger, SelectValue, SelectContent, SelectItem, Slider } from '@/components/uikit';
import styles from './Catalog.module.scss';

export default function CatalogClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const [q, setQ] = React.useState('');
  const [categoryId, setCategoryId] = React.useState<string | undefined>();
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [facets, setFacets] = React.useState<{ categories: Record<string, number>; price?: { min: number; max: number } } | null>(null);
  const [page, setPage] = React.useState(1);
  const [perPage] = React.useState(12);
  const [total, setTotal] = React.useState(0);
  // Filters & sort
  const [priceMin, setPriceMin] = React.useState<number | ''>('');
  const [priceMax, setPriceMax] = React.useState<number | ''>('');
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [onSaleOnly, setOnSaleOnly] = React.useState(false);
  const [sort, setSort] = React.useState<'price-asc' | 'price-desc' | 'title-asc' | 'title-desc' | 'newest'>('newest');
  // Debounced search
  const [debouncedQ, setDebouncedQ] = React.useState('');

  // Hydrate state from URL on first mount
  React.useEffect(() => {
    const qp = sp;
    const getBool = (key: string) => {
      const v = qp.get(key);
      return v === 'true' ? true : v === 'false' ? false : undefined;
    };
    const getNum = (key: string) => (qp.get(key) ? Number(qp.get(key)) : undefined);
    const q0 = qp.get('q') ?? '';
    const cat0 = qp.get('categoryId') ?? undefined;
    const page0 = getNum('page') ?? 1;
    const per0 = getNum('perPage') ?? 12;
    const s0 = (qp.get('sort') as typeof sort | null) ?? null;
    const pmin0 = getNum('priceMin');
    const pmax0 = getNum('priceMax');
    const in0 = getBool('inStock');
    const sale0 = getBool('onSale');

    setQ(q0);
    setDebouncedQ(q0);
    setCategoryId(cat0);
    setPage(page0);
    // perPage is fixed in UI but keep parity
    if (pmin0 != null) setPriceMin(pmin0);
    if (pmax0 != null) setPriceMax(pmax0);
    if (in0 != null) setInStockOnly(in0);
    if (sale0 != null) setOnSaleOnly(sale0);
    if (s0) setSort(s0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep URL in sync when filters change
  React.useEffect(() => {
    const usp = new URLSearchParams();
    if (q) usp.set('q', q);
    if (categoryId) usp.set('categoryId', categoryId);
    if (page !== 1) usp.set('page', String(page));
    if (perPage !== 12) usp.set('perPage', String(perPage));
    if (priceMin !== '') usp.set('priceMin', String(priceMin));
    if (priceMax !== '') usp.set('priceMax', String(priceMax));
    if (inStockOnly) usp.set('inStock', String(inStockOnly));
    if (onSaleOnly) usp.set('onSale', String(onSaleOnly));
    if (sort !== 'newest') usp.set('sort', sort);
    const qs = usp.toString();
    router.replace(`/catalog${qs ? `?${qs}` : ''}`);
  }, [q, categoryId, page, perPage, priceMin, priceMax, inStockOnly, onSaleOnly, sort, router]);

  // Debounce q
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 300);
    return () => clearTimeout(t);
  }, [q]);

  // SWR params
  const productParams = React.useMemo(() => ({
    q: debouncedQ,
    categoryId,
    page,
    perPage,
    sort,
    priceMin: priceMin === '' ? undefined : priceMin,
    priceMax: priceMax === '' ? undefined : priceMax,
    inStock: inStockOnly ? true : undefined,
    onSale: onSaleOnly ? true : undefined,
  }), [debouncedQ, categoryId, page, perPage, sort, priceMin, priceMax, inStockOnly, onSaleOnly]);

  const { data: productsData, isLoading: productsLoading } = useSWR(
    ['catalog/products', productParams],
    () => CatalogService.getProducts(productParams),
    { keepPreviousData: true },
  );

  const products: Product[] = productsData?.items ?? [];
  React.useEffect(() => {
    if (productsData?.total != null) setTotal(productsData.total);
  }, [productsData]);

  // Categories via SWR
  const { data: categoriesData } = useSWR('catalog/categories', () => CatalogService.getCategories());
  React.useEffect(() => { if (categoriesData) setCategories(categoriesData); }, [categoriesData]);

  // Facets via SWR (ignore pagination)
  const facetParams = React.useMemo(() => ({
    q: debouncedQ,
    categoryId,
    sort,
    // do NOT include priceMin/Max so bounds remain stable
    inStock: inStockOnly ? true : undefined,
    onSale: onSaleOnly ? true : undefined,
  }), [debouncedQ, categoryId, sort, inStockOnly, onSaleOnly]);
  const { data: facetsData } = useSWR(
    ['catalog/facets', facetParams],
    () => CatalogService.getCategoryFacets(facetParams),
    { keepPreviousData: true, revalidateOnFocus: false, dedupingInterval: 300 },
  );
  React.useEffect(() => { if (facetsData) setFacets(facetsData as any); }, [facetsData]);

  // products are handled by SWR

  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className={styles.page} id="catalog-page">
      <h1 id="catalog-title">Каталог</h1>

      <div className={styles.controls}>
        <input
          id="catalog-search"
          placeholder="Пошук…"
          value={q}
          onChange={(e) => {
            setPage(1); setQ(e.target.value);
          }}
          className={styles.searchInput}
        />

        <SelectRoot value={categoryId ?? 'all'} onValueChange={(v) => { setPage(1); setCategoryId(v === 'all' ? undefined : v); }}>
          <SelectTrigger id="catalog-category-trigger" className={styles.selectTrigger}>
            <SelectValue placeholder="Усі категорії" />
          </SelectTrigger>
          <SelectContent id="catalog-category-content">
            <SelectItem id="catalog-category-all" value="all">Усі</SelectItem>
            {categories.map((c) => {
              const count = facets?.categories?.[c.id] ?? 0;
              return (
                <SelectItem id={`catalog-category-${c.id}`} key={c.id} value={c.id}>
                  {c.name} {count ? `(${count})` : ''}
                </SelectItem>
              );
            })}
          </SelectContent>
        </SelectRoot>

        {/* Price range slider (Radix) */}
        <Slider
          min={0}
          max={1000}
          value={[priceMin === '' ? 0 : priceMin, priceMax === '' ? 1000 : priceMax]}
          onChange={([lo, hi]) => {
            setPage(1);
            setPriceMin(typeof lo === 'number' ? lo : '');
            setPriceMax(typeof hi === 'number' ? hi : '');
          }}
        />

        {/* Toggles */}
        <label className={styles.checkbox}><input type="checkbox" checked={inStockOnly} onChange={(e) => { setPage(1); setInStockOnly(e.target.checked); }} /> В наявності</label>
        <label className={styles.checkbox}><input type="checkbox" checked={onSaleOnly} onChange={(e) => { setPage(1); setOnSaleOnly(e.target.checked); }} /> Зі знижкою</label>

        {/* Sort */}
        <SelectRoot value={sort} onValueChange={(v) => { setPage(1); setSort(v as typeof sort); }}>
          <SelectTrigger id="catalog-sort-trigger" className={styles.selectTrigger}>
            <SelectValue placeholder="Сортування" />
          </SelectTrigger>
          <SelectContent id="catalog-sort-content">
            <SelectItem value="newest">Новинки</SelectItem>
            <SelectItem value="price-asc">Ціна: від низької до високої</SelectItem>
            <SelectItem value="price-desc">Ціна: від високої до низької</SelectItem>
            <SelectItem value="title-asc">Назва: A → Я</SelectItem>
            <SelectItem value="title-desc">Назва: Я → A</SelectItem>
          </SelectContent>
        </SelectRoot>
        <Button variant="ghost" onClick={() => {
          setQ('');
          setDebouncedQ('');
          setCategoryId(undefined);
          setPriceMin('');
          setPriceMax('');
          setInStockOnly(false);
          setOnSaleOnly(false);
          setSort('newest');
          setPage(1);
        }}>Скинути</Button>
      </div>

      {/* Active filter chips */}
      <div className={styles.chips}>
        {q ? (<button className={styles.chip} onClick={() => setQ('')}>пошук: “{q}” ×</button>) : null}
        {categoryId ? (<button className={styles.chip} onClick={() => setCategoryId(undefined)}>категорія ×</button>) : null}
        {priceMin !== '' ? (<button className={styles.chip} onClick={() => setPriceMin('')}>мін: {priceMin} ×</button>) : null}
        {priceMax !== '' ? (<button className={styles.chip} onClick={() => setPriceMax('')}>макс: {priceMax} ×</button>) : null}
        {inStockOnly ? (<button className={styles.chip} onClick={() => setInStockOnly(false)}>в наявності ×</button>) : null}
        {onSaleOnly ? (<button className={styles.chip} onClick={() => setOnSaleOnly(false)}>зі знижкою ×</button>) : null}
        {sort !== 'newest' ? (<button className={styles.chip} onClick={() => setSort('newest')}>сортування: {sort} ×</button>) : null}
      </div>

      {/* Skeletons while loading */}
      {productsLoading && (
        <div className={styles.grid} aria-hidden>
          {Array.from({ length: perPage }).map((_, i) => (
            <div key={i} className={styles.skeletonCard} />
          ))}
        </div>
      )}
      {/* Empty state */}
      {!productsLoading && products.length === 0 && (
        <div className={styles.empty}>
          <div className={styles.emptyTitle}>Нічого не знайдено</div>
          <div className={styles.emptyText}>Спробуйте змінити фільтри або скинути їх</div>
          <Button variant="ghost" onClick={() => {
            setQ(''); setDebouncedQ(''); setCategoryId(undefined); setPriceMin(''); setPriceMax(''); setInStockOnly(false); setOnSaleOnly(false); setSort('newest'); setPage(1);
          }}>Скинути фільтри</Button>
        </div>
      )}
      {/* Products grid */}
      {!productsLoading && products.length > 0 && (
        <div className={styles.grid} id="catalog-grid">
          {products.map((p) => (
            <a id={`catalog-card-${p.id}`} key={p.id} href={`/product/${p.slug}`} className={styles.card}>
              <div className={styles.cardTitle}>{p.title}</div>
              <div className={styles.cardMeta}>Артикул: {p.sku}</div>
              <div className={styles.priceRow}>
                <strong>{p.salePrice ?? p.price} ₴</strong>
                {p.salePrice ? <s className={styles.oldPrice}>{p.price} ₴</s> : null}
              </div>
              <div className={styles.stock}>Залишок: {p.stock}</div>
              <Button id={`catalog-card-${p.id}-view`} variant="primary">Переглянути</Button>
            </a>
          ))}
        </div>
      )}

      <div className={styles.pagination} id="catalog-pagination">
        <Button id="catalog-prev" variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Назад</Button>
        <span id="catalog-page-indicator" style={{ opacity: 0.8 }}>Сторінка {page} з {pages}</span>
        <Button id="catalog-next" variant="ghost" disabled={page >= pages} onClick={() => setPage((p) => Math.min(pages, p + 1))}>Далі</Button>
      </div>
    </div>
  );
}
