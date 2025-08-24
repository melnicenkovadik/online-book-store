'use client';

import React from 'react';
import { CatalogService } from '@/services/catalog';
import type { Product } from '@/types/catalog';
import styles from './SimilarProducts.module.scss';

interface SimilarProductsProps {
  /** Current product to exclude from similar items */
  currentProduct: Product;
  /** Number of similar products to show */
  limit?: number;
  /** Custom title */
  title?: string;
}

export default function SimilarProducts({ 
  currentProduct, 
  limit = 8, 
  title = 'Схожі товари' 
}: SimilarProductsProps) {
  const [similar, setSimilar] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    setLoading(true);
    
    (async () => {
      try {
        const categoryId = currentProduct.categoryIds?.[0];
        if (!categoryId) { 
          setSimilar([]); 
          return; 
        }
        
        const res = await CatalogService.getProducts({ 
          categoryId, 
          perPage: limit, 
          sort: 'newest' 
        });
        
        if (active) {
          setSimilar(res.items.filter((p) => p.id !== currentProduct.id));
        }
      } catch {
        if (active) setSimilar([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    
    return () => { active = false; };
  }, [currentProduct.id, currentProduct.categoryIds, limit]);

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.loading}>Завантаження...</div>
      </section>
    );
  }

  if (!similar.length) {
    return null;
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.grid}>
        {similar.map((product) => (
          <a 
            key={product.id} 
            href={`/product/${product.slug}`} 
            className={styles.card}
          >
            <img 
              src={product.images?.[0] || '/noimg.png'} 
              alt={product.title} 
              className={styles.image}
            />
            <div className={styles.productTitle}>{product.title}</div>
            <div className={styles.price}>
              {(product.salePrice ?? product.price)} ₴
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
