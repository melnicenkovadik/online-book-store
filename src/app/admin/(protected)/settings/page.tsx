"use client";

import React from "react";
import styles from "../products/products.module.scss";

export default function AdminSettingsPage() {
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function seed() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch("/api/admin/dev/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Seed failed");
      }
      setStatus(
        `✅ Успішно: категорії=${data.categories}, товари=${data.products}, оновлено=${data.upserts}`,
      );
    } catch (e: unknown) {
      setStatus(`❌ Помилка: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Налаштування</h1>
      </div>

      <div className={styles.settingsSection}>
        <h2 className={styles.sectionTitle}>Дані для демо</h2>
        <p className={styles.sectionDescription}>
          Імпорт категорій та товарів з моків у базу даних. Використовуйте для
          тестування та наповнення бази демо-даними.
        </p>
        <button
          type="button"
          onClick={seed}
          disabled={loading}
          className={styles.addButton}
        >
          {loading ? "⏳ Імпорт..." : "🌱 Засіяти базу (категорії + товари)"}
        </button>
        {status && <div className={styles.statusMessage}>{status}</div>}
      </div>
    </div>
  );
}
