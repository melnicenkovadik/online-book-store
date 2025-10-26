"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type React from "react";
import { useState } from "react";
import { QueryProvider } from "@/providers/QueryProvider";
import styles from "./admin-layout.module.scss";

export default function AdminProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  };

  const isActive = (path: string) => {
    if (path === "/admin") {
      return pathname === "/admin" || pathname === "/admin/dashboard";
    }
    return pathname.startsWith(path);
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link href="/admin" className={styles.logo}>
            📚 Admin Panel
          </Link>

          <button
            type="button"
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>

          <nav
            className={`${styles.nav} ${isMobileMenuOpen ? styles.navOpen : ""}`}
          >
            <Link
              href="/admin"
              className={`${styles.navLink} ${isActive("/admin") && pathname === "/admin" ? styles.active : ""}`}
            >
              Панель керування
            </Link>
            <Link
              href="/admin/products"
              className={`${styles.navLink} ${isActive("/admin/products") ? styles.active : ""}`}
            >
              Товари
            </Link>
            <Link
              href="/admin/categories"
              className={`${styles.navLink} ${isActive("/admin/categories") ? styles.active : ""}`}
            >
              Категорії
            </Link>
            <Link
              href="/admin/orders"
              className={`${styles.navLink} ${isActive("/admin/orders") ? styles.active : ""}`}
            >
              Замовлення
            </Link>
            <Link
              href="/admin/settings"
              className={`${styles.navLink} ${isActive("/admin/settings") ? styles.active : ""}`}
            >
              Налаштування
            </Link>
          </nav>

          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutButton}
          >
            Вийти
          </button>
        </div>
      </header>

      <main className={styles.main}>
        <QueryProvider>{children}</QueryProvider>
      </main>
    </div>
  );
}
