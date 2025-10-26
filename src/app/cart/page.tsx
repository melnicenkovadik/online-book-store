"use client";

import Link from "next/link";
import React from "react";
import OptimizedImage from "@/components/OptimizedImage";
import { useCart } from "@/store/cart";
import styles from "./cart.module.scss";

export default function CartPage() {
  const cart = useCart();
  const items = React.useMemo(() => Object.values(cart.items), [cart.items]);
  const total = cart.subtotal();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Кошик</h1>
      </div>

      {items.length === 0 ? (
        <div className={styles.emptyState}>
          <p>Кошик порожній.</p>
          <Link href="/catalog">Повернутись до каталогу</Link>
        </div>
      ) : (
        <>
          <div className={styles.cartItems}>
            {items.map((it) => {
              const price = it.price;
              return (
                <div key={it.productId} className={styles.cartItem}>
                  <div className={styles.itemImage}>
                    {it.image ? (
                      <OptimizedImage
                        src={it.image}
                        alt={it.title}
                        width={100}
                        height={100}
                        style={{ objectFit: "contain" }}
                      />
                    ) : (
                      <div className={styles.noImage}>Немає зображення</div>
                    )}
                  </div>

                  <div className={styles.itemInfo}>
                    {it.slug ? (
                      <Link
                        href={`/product/${it.slug}`}
                        className={styles.itemTitle}
                      >
                        {it.title}
                      </Link>
                    ) : (
                      <span className={styles.itemTitle}>{it.title}</span>
                    )}
                    <div className={styles.itemPrice}>{price} ₴</div>
                  </div>

                  <div className={styles.itemControls}>
                    <div className={styles.qtyControls}>
                      <button
                        type="button"
                        className={styles.qtyButton}
                        onClick={() =>
                          cart.setQty(it.productId, Math.max(0, it.qty - 1))
                        }
                        aria-label="Зменшити кількість"
                      >
                        −
                      </button>
                      <span className={styles.qtyDisplay}>{it.qty}</span>
                      <button
                        type="button"
                        className={styles.qtyButton}
                        onClick={() => cart.setQty(it.productId, it.qty + 1)}
                        aria-label="Збільшити кількість"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => cart.remove(it.productId)}
                    >
                      Видалити
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.footer}>
            <Link href="/catalog" className={styles.continueLink}>
              ← Продовжити покупки
            </Link>
            <div className={styles.summary}>
              <div className={styles.total}>Разом: {total} ₴</div>
              <Link href="/checkout" className={styles.checkoutButton}>
                Оформити замовлення
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
