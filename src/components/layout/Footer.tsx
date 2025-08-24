"use client";

import Link from 'next/link';
import React from 'react';
import { Button } from '@/components/uikit';
import styles from './Footer.module.scss';

export function Footer() {
  return (
    <footer className={styles.footer} id="app-footer">
      <div className={styles.inner} id="footer-inner">
        <div className={styles.copy} id="footer-copy">© <span suppressHydrationWarning>{new Date().getFullYear()}</span> Магазин підручників</div>
        <nav className={styles.nav} id="footer-nav">
          <Link href="/catalog"><Button variant="ghost" id="footer-nav-catalog">Каталог</Button></Link>
          <Link href="/demo/uikit"><Button variant="ghost" id="footer-nav-uikit">UI Kit</Button></Link>
        </nav>
      </div>
    </footer>
  );
}
