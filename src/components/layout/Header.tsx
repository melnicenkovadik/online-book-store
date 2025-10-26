"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRoot,
  DropdownMenuTrigger,
} from "@/components/uikit";
import { useCart } from "@/store/cart";
import type { Category } from "@/types/catalog";
import styles from "./Header.module.scss";

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const cart = useCart();
  const isAdmin = pathname.startsWith("/admin");

  // Завантаження категорій через React Query
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/catalog/categories");
      if (!res.ok) throw new Error("Failed to fetch categories");
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5 хвилин
    gcTime: 10 * 60 * 1000, // 10 хвилин
  });

  // Close mobile menu when navigating
  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is needed to trigger on navigation
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Calculate cart items count
  const cartItemsCount = Object.values(cart.items).reduce(
    (sum, item) => sum + item.qty,
    0,
  );

  return (
    <header className={styles.header}>
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.contact}>
            <a href="tel:+380123456789" className={styles.contactLink}>
              <span className={styles.contactIcon}>📞</span>
              <span className={styles.contactText}>+38 (012) 345-67-89</span>
            </a>
            <a href="mailto:info@bookstore.com" className={styles.contactLink}>
              <span className={styles.contactIcon}>✉️</span>
              <span className={styles.contactText}>info@bookstore.com</span>
            </a>
          </div>
          <div className={styles.actions}>
            <button type="button" className={styles.actionLink}>
              Доставка і оплата
            </button>
            <button type="button" className={styles.actionLink}>
              Про нас
            </button>
            <button type="button" className={styles.actionLink}>
              Контакти
            </button>
          </div>
        </div>
      </div>

      <div className={styles.mainBar}>
        <div className={styles.container}>
          <Link href="/" className={styles.logo}>
            <Image
              src="/next.svg"
              alt="Book Store"
              width={120}
              height={40}
              priority
            />
          </Link>

          <div className={styles.search}>
            <form action="/catalog" method="get" className={styles.searchForm}>
              <input
                type="text"
                name="q"
                placeholder="Пошук книг..."
                className={styles.searchInput}
                aria-label="Пошук книг"
              />
              <button
                type="submit"
                className={styles.searchButton}
                aria-label="Шукати"
              >
                🔍
              </button>
            </form>
          </div>

          <div className={styles.userActions}>
            <Link href="/cart" className={styles.cartLink}>
              <span className={styles.cartIcon}>🛒</span>
              <span className={styles.cartText}>Кошик</span>
              {cartItemsCount > 0 && (
                <span className={styles.cartBadge}>{cartItemsCount}</span>
              )}
            </Link>

            <button
              type="button"
              className={styles.mobileMenuButton}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-expanded={isMobileMenuOpen}
              aria-label="Меню"
            >
              {isMobileMenuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </div>

      {!isAdmin ? (
        <nav
          className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ""}`}
          aria-label="Головна навігація"
        >
          <div className={styles.container}>
            <ul className={styles.navList}>
              <li className={styles.navItem}>
                <Link
                  href="/"
                  className={`${styles.navLink} ${pathname === "/" ? styles.active : ""}`}
                >
                  Головна
                </Link>
              </li>
              <li className={styles.navItem}>
                <DropdownMenuRoot>
                  <DropdownMenuTrigger asChild>
                    <button type="button" className={styles.navLink}>
                      Каталог <span className={styles.dropdownArrow}>▼</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem asChild>
                      <Link href="/catalog" className={styles.dropdownLink}>
                        Всі книги
                      </Link>
                    </DropdownMenuItem>
                    {categories.map((category) => (
                      <DropdownMenuItem key={category.id} asChild>
                        <Link
                          href={`/catalog?categoryId=${category.id}`}
                          className={styles.dropdownLink}
                        >
                          {category.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenuRoot>
              </li>
              <li className={styles.navItem}>
                <Link
                  href="/catalog?onSale=true"
                  className={`${styles.navLink} ${styles.saleLink}`}
                >
                  Акції
                </Link>
              </li>
              <li className={styles.navItem}>
                <Link href="/catalog?sort=newest" className={styles.navLink}>
                  Новинки
                </Link>
              </li>
            </ul>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
