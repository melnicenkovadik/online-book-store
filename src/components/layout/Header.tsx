"use client";

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/uikit';
import { useCart } from '@/store/cart';
import styles from './Header.module.scss';

export function Header() {
  const cart = useCart();
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);
  const count = mounted ? cart.count() : 0;
  const subtotal = mounted ? cart.subtotal() : 0;

  return (
    <header className={styles.header} id="app-header">
      <div className={styles.inner}>
        <div>
          <Link href="/" className={styles.brand} id="nav-brand">
            <strong>Магазин підручників</strong>
          </Link>
        </div>
        <nav className={styles.nav} id="main-nav">
          <Link href="/catalog">
            <Button variant="ghost" id="nav-catalog">Каталог</Button>
          </Link>
          <Link href="/cart">
            <Button variant="ghost" className={styles.cartBadge} id="nav-cart">
              Кошик {mounted && count > 0 ? `(${count})` : ''}
              {mounted && count > 0 ? <span className={styles.subtotal}>· {subtotal} ₴</span> : null}
            </Button>
          </Link>
          <Link href="/admin/dashboard">
            <Button variant="ghost" id="nav-admin">Адмін</Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}
