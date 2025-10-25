"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CatalogService } from "@/services/catalog";
import type { Product } from "@/types/catalog";
import OptimizedImage from "./OptimizedImage";
import styles from "./SimilarProducts.module.scss";

interface SimilarProductsProps {
  currentProduct: Product;
}

export default function SimilarProducts({
  currentProduct,
}: SimilarProductsProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchSimilarProducts = async () => {
      try {
        setLoading(true);

        // Get products from the same category
        const categoryId = currentProduct.categoryIds?.[0];
        if (!categoryId) {
          setProducts([]);
          return;
        }

        const result = await CatalogService.getProducts({
          categoryId,
          perPage: 4,
        });

        if (!active) return;

        // Filter out the current product
        const similarProducts = result.items.filter(
          (p) => p.id !== currentProduct.id,
        );

        setProducts(similarProducts);
      } catch (error) {
        console.error("Error fetching similar products:", error);
        if (active) setProducts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSimilarProducts();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentProduct.id, currentProduct.categoryIds?.[0]]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.title}>Схожі товари</h2>
        <div className={styles.loading}>Завантаження...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.title}>Схожі товари</h2>
      <div className={styles.grid}>
        {products.map((product) => (
          <Link
            href={`/product/${product.slug}`}
            key={product.id}
            className={styles.card}
          >
            <div className={styles.imageContainer}>
              {product.images?.[0] ? (
                <OptimizedImage
                  src={product.images[0]}
                  alt={product.title}
                  width={150}
                  height={200}
                  sizes="150px"
                  style={{ objectFit: "contain" }}
                  loadingComponent={<div className={styles.imagePlaceholder} />}
                />
              ) : (
                <div className={styles.noImage}>Немає зображення</div>
              )}
            </div>
            <h3 className={styles.productTitle}>{product.title}</h3>
            <div className={styles.priceRow}>
              <strong>{product.salePrice ?? product.price} ₴</strong>
              {product.salePrice && (
                <s className={styles.oldPrice}>{product.price} ₴</s>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
