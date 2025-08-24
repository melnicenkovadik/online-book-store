"use client";

import React from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useParams, notFound } from 'next/navigation';
import { CatalogService } from '@/services/catalog';
import type { Product } from '@/types/catalog';
import { Button } from '@/components/uikit';
import { useCart } from '@/store/cart';
import SimilarProducts from '@/components/SimilarProducts';
import styles from './page.module.css';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);
  const cart = useCart();

  React.useEffect(() => {
    let active = true;
    (async () => {
      try {
        const p = await CatalogService.getProductBySlug(slug);
        if (active) setProduct(p);
      } catch (e) {
        if (active) setProduct(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [slug]);

  // Gallery/lightbox state must be declared unconditionally before any early returns
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [openLightbox, setOpenLightbox] = React.useState(false);
  const images = product?.images && product.images.length > 0 ? product.images : [];
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const imgWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = React.useState<'desc' | 'specs' | 'reviews'>('desc');

  // Zoom/pan handled by library (typed to accept any props to satisfy TS in dynamic JSX)
  const TransformWrapper = React.useMemo(
    () => dynamic(() => import('react-zoom-pan-pinch').then((m) => m.TransformWrapper as unknown as React.ComponentType<any>), { ssr: false }) as unknown as React.ComponentType<any>,
    [],
  );
  const TransformComponent = React.useMemo(
    () => dynamic(() => import('react-zoom-pan-pinch').then((m) => m.TransformComponent as unknown as React.ComponentType<any>), { ssr: false }) as unknown as React.ComponentType<any>,
    [],
  );

  const nextImg = React.useCallback(() => {
    setActiveIdx((i) => (images.length ? (i + 1) % images.length : i));
  }, [images]);

  const prevImg = React.useCallback(() => {
    setActiveIdx((i) => (images.length ? (i - 1 + images.length) % images.length : i));
  }, [images]);

  // Reset active image when product changes
  React.useEffect(() => {
    setActiveIdx(0);
    setActiveTab('desc');
  }, [product?.id]);

  // Keyboard controls when lightbox is open
  React.useEffect(() => {
    if (!openLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpenLightbox(false);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        nextImg();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevImg();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openLightbox, nextImg, prevImg]);

  // Focus management when opening lightbox
  React.useEffect(() => {
    if (openLightbox) {
      closeBtnRef.current?.focus();
    }
  }, [openLightbox]);

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    const { body } = document;
    if (openLightbox) {
      const prev = body.style.overflow;
      body.style.overflow = 'hidden';
      return () => { body.style.overflow = prev; };
    }
  }, [openLightbox]);

  const onShare = React.useCallback(async () => {
    try {
      const url = images[Math.min(activeIdx, images.length - 1)];
      if (navigator.share) {
        await navigator.share({ title: product?.title ?? 'Товар', url: typeof location !== 'undefined' ? location.href : url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
        alert('Посилання на зображення скопійовано');
      }
    } catch {
      // noop
    }
  }, [images, activeIdx, product?.title]);

  const onSave = React.useCallback(() => {
    const url = images[Math.min(activeIdx, images.length - 1)];
    const a = document.createElement('a');
    a.href = url;
    a.download = 'image.jpg';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [images, activeIdx]);



  if (loading) return <div style={{ padding: 24 }} id="product-loading">Завантаження…</div>;
  if (!product) return notFound();

  const inCart = cart.items[product.id];
  const price = product.salePrice ?? product.price;
  const hasDiscount = product.salePrice != null && product.salePrice < product.price;
  const discountPct = hasDiscount ? Math.round(((product.price - (product.salePrice ?? product.price)) / product.price) * 100) : 0;
  const available = product.stock > 0;

  return (
    <div className={styles.container} id="product-page">
      <div className={styles.grid}>
        {/* Gallery + description */}
        <div id="product-gallery" className={styles.gallery}>
          <div className={`${styles.panel} ${styles.imageBox}`} onClick={() => images.length && setOpenLightbox(true)}>
            {images.length ? (
              <Image src={images[Math.min(activeIdx, images.length - 1)]} alt={product.title} width={420} height={420} style={{ objectFit: 'contain', width: '100%', height: 'auto' }} />
            ) : (
              <div style={{ width: 320, height: 320, background: '#f3f4f6', display: 'grid', placeItems: 'center', borderRadius: 8 }}>Немає зображення</div>
            )}
          </div>
          {images.length > 1 ? (
            <div className={styles.thumbs} aria-label="Галерея превью">
              {images.map((src, idx) => (
                <button
                  type="button"
                  key={src}
                  className={`${styles.thumb} ${idx === activeIdx ? styles.thumbActive : ''}`}
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Показати зображення ${idx + 1}`}
                >
                  <Image src={src} alt={`thumb-${idx + 1}`} width={64} height={64} style={{ objectFit: 'contain', width: '100%', height: '100%' }} />
                </button>
              ))}
            </div>
          ) : null}
          {/* Tabs */}
          <div className={`${styles.panel} ${styles.descBox}`}>
            <div className={styles.tabsBar} role="tablist">
              <button className={`${styles.tabBtn} ${activeTab === 'desc' ? styles.tabActive : ''}`} role="tab" aria-selected={activeTab === 'desc'} onClick={() => setActiveTab('desc')}>Опис</button>
              <button className={`${styles.tabBtn} ${activeTab === 'specs' ? styles.tabActive : ''}`} role="tab" aria-selected={activeTab === 'specs'} onClick={() => setActiveTab('specs')}>Характеристики</button>
              <button className={`${styles.tabBtn} ${activeTab === 'reviews' ? styles.tabActive : ''}`} role="tab" aria-selected={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')}>Відгуки</button>
            </div>
            {activeTab === 'desc' && (
              <div id="product-description"><p style={{ margin: 0 }}>{product.attributes.description || 'Опис відсутній.'}</p></div>
            )}
            {activeTab === 'specs' && (
              <div>
                <ul className={`${'product-property-list'} ${styles.propsList}`}>
                  {product.attributes.author ? (
                    <li className="property-item"><span className={styles.propTitle}>Автор</span><span className="propery-des">{product.attributes.author}</span></li>
                  ) : null}
                  {product.attributes.publisher ? (
                    <li className="property-item"><span className={styles.propTitle}>Виробник</span><span className="propery-des">{product.attributes.publisher}</span></li>
                  ) : null}
                  {product.attributes.class ? (
                    <li className="property-item"><span className={styles.propTitle}>Клас</span><span className="propery-des">{product.attributes.class}</span></li>
                  ) : null}
                  {product.attributes.language ? (
                    <li className="property-item"><span className={styles.propTitle}>Мова</span><span className="propery-des">{product.attributes.language === 'uk' ? 'Українська' : product.attributes.language}</span></li>
                  ) : null}
                  {product.attributes.subject ? (
                    <li className="property-item"><span className={styles.propTitle}>Предмет</span><span className="propery-des">{product.attributes.subject === 'math' ? 'Математика' : product.attributes.subject}</span></li>
                  ) : null}
                  {product.attributes.year ? (
                    <li className="property-item"><span className={styles.propTitle}>Рік випуску</span><span className="propery-des">{product.attributes.year}</span></li>
                  ) : null}
                  {product.attributes.pages ? (
                    <li className="property-item"><span className={styles.propTitle}>Кількість сторінок</span><span className="propery-des">{product.attributes.pages}</span></li>
                  ) : null}
                  {product.attributes.coverType ? (
                    <li className="property-item"><span className={styles.propTitle}>Палітурка</span><span className="propery-des">{product.attributes.coverType}</span></li>
                  ) : null}
                  {product.attributes.series ? (
                    <li className="property-item"><span className={styles.propTitle}>Серія</span><span className="propery-des">{product.attributes.series}</span></li>
                  ) : null}
                  {product.attributes.format ? (
                    <li className="property-item"><span className={styles.propTitle}>Формат</span><span className="propery-des">{product.attributes.format}</span></li>
                  ) : null}
                  {product.attributes.isbn ? (
                    <li className="property-item"><span className={styles.propTitle}>ISBN</span><span className="propery-des">{product.attributes.isbn}</span></li>
                  ) : null}
                  {product.attributes.barcode ? (
                    <li className="property-item"><span className={styles.propTitle}>Штрихкод</span><span className="propery-des">{product.attributes.barcode}</span></li>
                  ) : null}
                </ul>
              </div>
            )}
            {activeTab === 'reviews' && (
              <div><em>Відгуки поки відсутні.</em></div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div id="product-main" className={styles.main}>
          <h1 id="product-title" style={{ margin: 0 }}>{product.title}</h1>

          {/* Aside: purchase controls moved under title */}
          <aside id="product-aside" className={`${styles.panel} ${styles.aside} ${styles.asideBox}`}>
            <div className={styles.asideTop}>
              <div>Ціна</div>
              <div><strong id="product-aside-price">{price} ₴</strong></div>
            </div>
            {inCart ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Button id="product-qty-dec" onClick={() => cart.setQty(product.id, Math.max(0, inCart.qty - 1))}>-</Button>
                <div id="product-qty" style={{ minWidth: 24, textAlign: 'center' }}>{inCart.qty}</div>
                <Button id="product-qty-inc" onClick={() => cart.setQty(product.id, inCart.qty + 1)}>+</Button>
                <Button id="product-remove" variant="ghost" onClick={() => cart.remove(product.id)}>Видалити</Button>
              </div>
            ) : (
              <Button id="product-add" fullWidth disabled={!available} onClick={() => cart.add({ productId: product.id, slug: product.slug, title: product.title, price, image: product.images?.[0] }, 1)}>
                {available ? 'Купити' : 'Немає в наявності'}
              </Button>
            )}
            <div className={styles.detailAction}>
              <div className="stock"><span>Доступність: </span><span style={{ color: available ? '#059669' : '#ef4444' }}>{available ? 'В наявності' : 'Немає'}</span></div>
              <button type="button" aria-label="wishlist" style={{ border: 'none', background: 'transparent', color: '#111827', cursor: 'pointer' }} onClick={() => alert('Додано в бажане (демо)')}>❤ Бажане</button>
            </div>
            <div id="product-shipping-note" style={{ fontSize: 13, opacity: 0.8 }}>Безкоштовна доставка від 1500 ₴</div>
          </aside>

          {/* Rating */}
          {product.attributes.rating ? (
            <div id="product-rating" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#6b7280' }}>
              <span style={{ fontWeight: 600 }}>{product.attributes.rating.value.toFixed(1)} / 5</span>
              <a href="#tab-review" style={{ textDecoration: 'underline' }}>{product.attributes.rating.count} відгуків</a>
            </div>
          ) : null}

          {/* Price row */}
          <div className={styles.priceRow}>
            <strong id="product-price" style={{ fontSize: 28 }}>{price} ₴</strong>
            {hasDiscount ? <s id="product-old-price" style={{ opacity: 0.6 }}>{product.price} ₴</s> : null}
            {hasDiscount ? <span id="product-discount" style={{ color: '#ef4444', fontWeight: 600 }}>-{discountPct}%</span> : null}
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <div id="product-sku">Артикул: {product.sku}</div>
            <div id="product-availability">Доступність: <span style={{ color: available ? '#059669' : '#ef4444' }}>{available ? 'В наявності' : 'Немає на складі'}</span></div>
          </div>

          {/* Properties now in tabs */}
        </div>

        
      </div>

      <SimilarProducts currentProduct={product} />

      {/* Sticky buy bar on mobile */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyPrice}>
          <strong>{price} ₴</strong>
          {hasDiscount ? <s style={{ opacity: 0.6, marginLeft: 8 }}>{product.price} ₴</s> : null}
        </div>
        {inCart ? (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Button onClick={() => cart.setQty(product.id, Math.max(0, (cart.items[product.id]?.qty || 0) - 1))}>-</Button>
            <div style={{ minWidth: 24, textAlign: 'center' }}>{cart.items[product.id]?.qty || 0}</div>
            <Button onClick={() => cart.setQty(product.id, (cart.items[product.id]?.qty || 0) + 1)}>+</Button>
          </div>
        ) : (
          <Button fullWidth disabled={!available} onClick={() => cart.add({ productId: product.id, slug: product.slug, title: product.title, price, image: product.images?.[0] }, 1)}>
            {available ? 'Купити' : 'Немає в наявності'}
          </Button>
        )}
      </div>

      {/* Lightbox */}
      {openLightbox && images.length ? (
        <>
          <div className={styles.lightboxBackdrop} onClick={() => setOpenLightbox(false)} />
          <div className={styles.lightbox} role="dialog" aria-modal="true">
            {/** Client-only zoom/pan */}
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={4}
              doubleClick={{ mode: 'toggle', step: 1 }}
              wheel={{ step: 0.25 }}
              pinch={{ step: 0.25 }}
              panning={{ velocityDisabled: true }}
            >
              <TransformComponent>
                <div className={styles.lightboxImgWrap}>
                  <Image
                    src={images[Math.min(activeIdx, images.length - 1)].replace('/800/800', '/1600/1600')}
                    alt={`image-${activeIdx + 1}`}
                    width={1600}
                    height={1600}
                    className={styles.lightboxImg}
                    style={{ objectFit: 'contain', width: 'auto', height: 'auto' }}
                  />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
          <div className={styles.counter}>{activeIdx + 1} / {images.length}</div>
          <div className={styles.actionBar}>
            <button className={styles.iconBtn} aria-label="Поділитися" onClick={onShare}>⤴︎</button>
            <button className={styles.iconBtn} aria-label="Зберегти" onClick={onSave}>↓</button>
          </div>
          {images.length > 1 ? (
            <>
              <button
                className={`${styles.navBtn} ${styles.navLeft}`}
                aria-label="Попереднє зображення"
                onClick={prevImg}
              >
                ‹
              </button>
              <button
                className={`${styles.navBtn} ${styles.navRight}`}
                aria-label="Наступне зображення"
                onClick={nextImg}
              >
                ›
              </button>
            </>
          ) : null}
          <button ref={closeBtnRef} className={styles.closeBtn} onClick={() => setOpenLightbox(false)} aria-label="Закрити">Закрити</button>
        </>
      ) : null}
    </div>
  );
}
