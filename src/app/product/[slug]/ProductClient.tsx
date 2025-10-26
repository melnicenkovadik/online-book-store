"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useParams } from "next/navigation";
import React from "react";
import SimilarProducts from "@/components/SimilarProducts";
import { Button } from "@/components/uikit";
import { CatalogService } from "@/services/catalog";
import { useCart } from "@/store/cart";
import type { Product } from "@/types/catalog";
import styles from "./page.module.css";

interface ProductClientProps {
  initialProduct: Product;
}

export default function ProductClient({ initialProduct }: ProductClientProps) {
  const { slug } = useParams<{ slug: string }>();
  const cart = useCart();

  // Використовуємо React Query з initialData - без мерцання!
  const { data: product = initialProduct } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => CatalogService.getProductBySlug(slug as string),
    initialData: initialProduct,
    staleTime: 5 * 60 * 1000, // 5 хвилин
  });

  // Gallery/lightbox state must be declared unconditionally before any early returns
  const [activeIdx, setActiveIdx] = React.useState(0);
  const [openLightbox, setOpenLightbox] = React.useState(false);
  const images =
    product?.images && product.images.length > 0 ? product.images : [];
  const sanitizeSrc = React.useCallback((s: string) => s?.trim(), []);
  const closeBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const _imgWrapRef = React.useRef<HTMLDivElement | null>(null);
  const [activeTab, setActiveTab] = React.useState<
    "desc" | "specs" | "reviews"
  >("desc");

  // Zoom/pan handled by library
  const TransformWrapper = React.useMemo(
    () =>
      dynamic(
        () =>
          import("react-zoom-pan-pinch").then(
            (m) =>
              m.TransformWrapper as unknown as React.ComponentType<
                Record<string, unknown>
              >,
          ),
        { ssr: false },
      ) as unknown as React.ComponentType<Record<string, unknown>>,
    [],
  );
  const TransformComponent = React.useMemo(
    () =>
      dynamic(
        () =>
          import("react-zoom-pan-pinch").then(
            (m) =>
              m.TransformComponent as unknown as React.ComponentType<
                Record<string, unknown>
              >,
          ),
        { ssr: false },
      ) as unknown as React.ComponentType<Record<string, unknown>>,
    [],
  );

  const nextImg = React.useCallback(() => {
    setActiveIdx((i) => {
      const len = product?.images?.length || 0;
      return len ? (i + 1) % len : i;
    });
  }, [product?.images?.length]);

  const prevImg = React.useCallback(() => {
    setActiveIdx((i) => {
      const len = product?.images?.length || 0;
      return len ? (i - 1 + len) % len : i;
    });
  }, [product?.images?.length]);

  // Reset active image when product changes
  React.useEffect(() => {
    setActiveIdx(0);
    setActiveTab("desc");
  }, []);

  // Keyboard controls when lightbox is open
  React.useEffect(() => {
    if (!openLightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpenLightbox(false);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        nextImg();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevImg();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openLightbox, nextImg, prevImg]);

  // Focus management when opening lightbox
  React.useEffect(() => {
    if (openLightbox) {
      closeBtnRef.current?.focus();
    }
  }, [openLightbox]);

  // Lock body scroll when lightbox is open
  React.useEffect(() => {
    if (!openLightbox) return;

    const { body } = document;
    const prev = body.style.overflow;
    body.style.overflow = "hidden";

    return () => {
      body.style.overflow = prev;
    };
  }, [openLightbox]);

  const onShare = React.useCallback(async () => {
    try {
      const url = images[Math.min(activeIdx, images.length - 1)];
      if (navigator.share) {
        const data: { title: string; url?: string } = {
          title: product?.title ?? "Товар",
        };
        if (typeof location !== "undefined") data.url = location.href;
        await navigator.share(data);
      } else if (navigator.clipboard && url) {
        await navigator.clipboard.writeText(url);
        alert("Посилання на зображення скопійовано");
      }
    } catch {
      // noop
    }
  }, [images, activeIdx, product?.title]);

  const onSave = React.useCallback(() => {
    const url = images[Math.min(activeIdx, images.length - 1)] || "";
    if (!url) return; // Не навигируем на '#', если url отсутствует
    const a = document.createElement("a");
    a.href = url;
    a.download = "image.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }, [images, activeIdx]);

  const inCart = cart.items[product.id];
  const price = product.salePrice ?? product.price;
  const hasDiscount =
    product.salePrice != null && product.salePrice < product.price;
  const discountPct = hasDiscount
    ? Math.round(
        ((product.price - (product.salePrice ?? product.price)) /
          product.price) *
          100,
      )
    : 0;
  const available = product.stock > 0;

  return (
    <div className={styles.container} id="product-page">
      <div className={styles.grid}>
        {/* Gallery + description */}
        <div id="product-gallery" className={styles.gallery}>
          <button
            type="button"
            className={`${styles.panel} ${styles.imageBox}`}
            onClick={() => images.length && setOpenLightbox(true)}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && images.length) {
                setOpenLightbox(true);
              }
            }}
            aria-label="Відкрити зображення у повному розмірі"
          >
            {images.length ? (
              images[Math.min(activeIdx, images.length - 1)] ? (
                <Image
                  src={sanitizeSrc(
                    images[Math.min(activeIdx, images.length - 1)] || "",
                  )}
                  alt={product.title}
                  width={420}
                  height={420}
                  priority={activeIdx === 0} // Prioritize loading the first image
                  sizes="(max-width: 768px) 100vw, 420px"
                  style={{
                    objectFit: "contain",
                    width: "100%",
                    height: "auto",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 320,
                    height: 320,
                    background: "#f3f4f6",
                    display: "grid",
                    placeItems: "center",
                    borderRadius: 8,
                  }}
                >
                  Немає зображення
                </div>
              )
            ) : (
              <div
                style={{
                  width: 320,
                  height: 320,
                  background: "#f3f4f6",
                  display: "grid",
                  placeItems: "center",
                  borderRadius: 8,
                }}
              >
                Немає зображення
              </div>
            )}
          </button>
          {images.length > 1 ? (
            <fieldset className={styles.thumbs} aria-label="Галерея превью">
              {images.map((src, idx) => (
                <button
                  type="button"
                  key={src || idx}
                  className={`${styles.thumb} ${idx === activeIdx ? styles.thumbActive : ""}`}
                  onClick={() => setActiveIdx(idx)}
                  aria-label={`Показати зображення ${idx + 1}`}
                >
                  {src ? (
                    <Image
                      src={sanitizeSrc(src)}
                      alt={`thumb-${idx + 1}`}
                      width={64}
                      height={64}
                      sizes="64px"
                      style={{
                        objectFit: "contain",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : null}
                </button>
              ))}
            </fieldset>
          ) : null}
          {/* Tabs */}
          <div className={`${styles.panel} ${styles.descBox}`}>
            <div className={styles.tabsBar} role="tablist">
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "desc" ? styles.tabActive : ""}`}
                role="tab"
                aria-selected={activeTab === "desc"}
                onClick={() => setActiveTab("desc")}
              >
                Опис
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "specs" ? styles.tabActive : ""}`}
                role="tab"
                aria-selected={activeTab === "specs"}
                onClick={() => setActiveTab("specs")}
              >
                Характеристики
              </button>
              <button
                type="button"
                className={`${styles.tabBtn} ${activeTab === "reviews" ? styles.tabActive : ""}`}
                role="tab"
                aria-selected={activeTab === "reviews"}
                onClick={() => setActiveTab("reviews")}
              >
                Відгуки
              </button>
            </div>
            {activeTab === "desc" && (
              <div id="product-description">
                <p style={{ margin: 0 }}>
                  {product.attributes.description || "Опис відсутній."}
                </p>
              </div>
            )}
            {activeTab === "specs" && (
              <div>
                <ul
                  className={`${"product-property-list"} ${styles.propsList}`}
                >
                  {product.attributes.author ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Автор</span>
                      <span className="propery-des">
                        {product.attributes.author}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.publisher ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Виробник</span>
                      <span className="propery-des">
                        {product.attributes.publisher}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.class ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Клас</span>
                      <span className="propery-des">
                        {product.attributes.class}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.language ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Мова</span>
                      <span className="propery-des">
                        {product.attributes.language === "uk"
                          ? "Українська"
                          : product.attributes.language}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.subject ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Предмет</span>
                      <span className="propery-des">
                        {product.attributes.subject === "math"
                          ? "Математика"
                          : product.attributes.subject}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.year ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Рік випуску</span>
                      <span className="propery-des">
                        {product.attributes.year}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.pages ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>
                        Кількість сторінок
                      </span>
                      <span className="propery-des">
                        {product.attributes.pages}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.coverType ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Палітурка</span>
                      <span className="propery-des">
                        {product.attributes.coverType}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.series ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Серія</span>
                      <span className="propery-des">
                        {product.attributes.series}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.format ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Формат</span>
                      <span className="propery-des">
                        {product.attributes.format}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.isbn ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>ISBN</span>
                      <span className="propery-des">
                        {product.attributes.isbn}
                      </span>
                    </li>
                  ) : null}
                  {product.attributes.barcode ? (
                    <li className="property-item">
                      <span className={styles.propTitle}>Штрихкод</span>
                      <span className="propery-des">
                        {product.attributes.barcode}
                      </span>
                    </li>
                  ) : null}
                </ul>
              </div>
            )}
            {activeTab === "reviews" && (
              <div>
                <em>Відгуки поки відсутні.</em>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div id="product-main" className={styles.main}>
          <h1 id="product-title" style={{ margin: 0 }}>
            {product.title}
          </h1>

          {/* Aside: purchase controls moved under title */}
          <aside
            id="product-aside"
            className={`${styles.panel} ${styles.aside} ${styles.asideBox}`}
          >
            <div className={styles.asideTop}>
              <div>Ціна</div>
              <div>
                <strong id="product-aside-price">{price} ₴</strong>
              </div>
            </div>
            {inCart ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Button
                  id="product-qty-dec"
                  onClick={() =>
                    cart.setQty(product.id, Math.max(0, inCart.qty - 1))
                  }
                >
                  -
                </Button>
                <div
                  id="product-qty"
                  style={{ minWidth: 24, textAlign: "center" }}
                >
                  {inCart.qty}
                </div>
                <Button
                  id="product-qty-inc"
                  onClick={() => cart.setQty(product.id, inCart.qty + 1)}
                >
                  +
                </Button>
                <Button
                  id="product-remove"
                  variant="ghost"
                  onClick={() => cart.remove(product.id)}
                >
                  Видалити
                </Button>
              </div>
            ) : (
              <Button
                id="product-add"
                fullWidth
                disabled={!available}
                onClick={() =>
                  cart.add(
                    {
                      productId: product.id,
                      slug: product.slug,
                      title: product.title,
                      price,
                      ...(product.images?.[0]
                        ? { image: product.images[0] }
                        : {}),
                    },
                    1,
                  )
                }
              >
                {available ? "Купити" : "Немає в наявності"}
              </Button>
            )}
            <div className={styles.detailAction}>
              <div className="stock">
                <span>Доступність: </span>
                <span style={{ color: available ? "#059669" : "#ef4444" }}>
                  {available ? "В наявності" : "Немає"}
                </span>
              </div>
              <button
                type="button"
                aria-label="wishlist"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#111827",
                  cursor: "pointer",
                }}
                onClick={() => alert("Додано в бажане (демо)")}
              >
                ❤ Бажане
              </button>
            </div>
            <div
              id="product-shipping-note"
              style={{ fontSize: 13, opacity: 0.8 }}
            >
              Безкоштовна доставка від 1500 ₴
            </div>
          </aside>

          {/* Rating */}
          {product.attributes.rating ? (
            <div
              id="product-rating"
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                color: "#6b7280",
              }}
            >
              <span style={{ fontWeight: 600 }}>
                {product.attributes.rating.value.toFixed(1)} / 5
              </span>
              <button
                type="button"
                onClick={() => setActiveTab("reviews")}
                style={{
                  textDecoration: "underline",
                  background: "none",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                {product.attributes.rating.count} відгуків
              </button>
            </div>
          ) : null}

          {/* Price row */}
          <div className={styles.priceRow}>
            <strong id="product-price" style={{ fontSize: 28 }}>
              {price} ₴
            </strong>
            {hasDiscount ? (
              <s id="product-old-price" style={{ opacity: 0.6 }}>
                {product.price} ₴
              </s>
            ) : null}
            {hasDiscount ? (
              <span
                id="product-discount"
                style={{ color: "#ef4444", fontWeight: 600 }}
              >
                -{discountPct}%
              </span>
            ) : null}
          </div>

          {/* Meta */}
          <div className={styles.meta}>
            <div id="product-sku">Артикул: {product.sku}</div>
            <div id="product-availability">
              Доступність:{" "}
              <span style={{ color: available ? "#059669" : "#ef4444" }}>
                {available ? "В наявності" : "Немає на складі"}
              </span>
            </div>
          </div>

          {/* Properties now in tabs */}
        </div>
      </div>

      <SimilarProducts currentProduct={product} />

      {/* Sticky buy bar on mobile */}
      <div className={styles.stickyBar}>
        <div className={styles.stickyPrice}>
          <strong>{price} ₴</strong>
          {hasDiscount ? (
            <s style={{ opacity: 0.6, marginLeft: 8 }}>{product.price} ₴</s>
          ) : null}
        </div>
        {inCart ? (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button
              onClick={() =>
                cart.setQty(
                  product.id,
                  Math.max(0, (cart.items[product.id]?.qty || 0) - 1),
                )
              }
            >
              -
            </Button>
            <div style={{ minWidth: 24, textAlign: "center" }}>
              {cart.items[product.id]?.qty || 0}
            </div>
            <Button
              onClick={() =>
                cart.setQty(product.id, (cart.items[product.id]?.qty || 0) + 1)
              }
            >
              +
            </Button>
          </div>
        ) : (
          <Button
            fullWidth
            disabled={!available}
            onClick={() =>
              cart.add(
                {
                  productId: product.id,
                  slug: product.slug,
                  title: product.title,
                  price,
                  ...(product.images?.[0] ? { image: product.images[0] } : {}),
                },
                1,
              )
            }
          >
            {available ? "Купити" : "Немає в наявності"}
          </Button>
        )}
      </div>

      {/* Lightbox */}
      {openLightbox && images.length ? (
        <>
          <button
            type="button"
            className={styles.lightboxBackdrop}
            onClick={() => setOpenLightbox(false)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setOpenLightbox(false);
              }
            }}
            aria-label="Закрити лайтбокс"
          />
          <div className={styles.lightbox} role="dialog" aria-modal="true">
            {/** Client-only zoom/pan */}
            <TransformWrapper
              initialScale={1}
              minScale={1}
              maxScale={4}
              doubleClick={{ mode: "toggle", step: 1 }}
              wheel={{ step: 0.25 }}
              pinch={{ step: 0.25 }}
              panning={{ velocityDisabled: true }}
            >
              <TransformComponent>
                <div className={styles.lightboxImgWrap}>
                  <Image
                    src={sanitizeSrc(
                      (
                        images[Math.min(activeIdx, images.length - 1)] || ""
                      ).replace("/800/800", "/1600/1600"),
                    )}
                    alt={`image-${activeIdx + 1}`}
                    width={1600}
                    height={1600}
                    className={styles.lightboxImg}
                    style={{
                      objectFit: "contain",
                      width: "auto",
                      height: "auto",
                    }}
                  />
                </div>
              </TransformComponent>
            </TransformWrapper>
          </div>
          <div className={styles.counter}>
            {activeIdx + 1} / {images.length}
          </div>
          <div className={styles.actionBar}>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Поділитися"
              onClick={onShare}
            >
              ⤴︎
            </button>
            <button
              type="button"
              className={styles.iconBtn}
              aria-label="Зберегти"
              onClick={onSave}
            >
              ↓
            </button>
          </div>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navLeft}`}
                aria-label="Попереднє зображення"
                onClick={prevImg}
              >
                ‹
              </button>
              <button
                type="button"
                className={`${styles.navBtn} ${styles.navRight}`}
                aria-label="Наступне зображення"
                onClick={nextImg}
              >
                ›
              </button>
            </>
          ) : null}
          <button
            type="button"
            ref={closeBtnRef}
            className={styles.closeBtn}
            onClick={() => setOpenLightbox(false)}
            aria-label="Закрити"
          >
            Закрити
          </button>
        </>
      ) : null}
    </div>
  );
}
