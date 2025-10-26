"use client";
import Link from "next/link";
import useSWR from "swr";
import { AdminApi } from "@/services/admin";
import type { Category } from "@/types/catalog";
import styles from "../products/products.module.scss";

export default function AdminCategoriesListPage() {
  const { data, mutate, isLoading } = useSWR("admin/categories", () =>
    AdminApi.listCategories(),
  );

  const onDelete = async (id: string) => {
    if (!confirm("Видалити категорію?")) return;
    await AdminApi.deleteCategory(id);
    mutate();
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Категорії</h1>
        <Link href="/admin/categories/new" className={styles.addButton}>
          <span>+</span> Додати категорію
        </Link>
      </div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={styles.th}>Назва</th>
              <th className={styles.th}>Slug</th>
              <th className={styles.th}>Батьківська</th>
              <th className={styles.th}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className={styles.td}>
                  Завантаження…
                </td>
              </tr>
            )}
            {data?.map((c: Category) => (
              <tr key={c.id}>
                <td className={styles.td}>{c.name}</td>
                <td className={styles.td}>{c.slug}</td>
                <td className={styles.td}>
                  {data.find((p: Category) => p.id === c.parentId)?.name || "—"}
                </td>
                <td className={styles.td}>
                  <div className={styles.actions}>
                    <Link
                      href={`/admin/categories/${c.id}`}
                      className={styles.iconButton}
                      title="Редагувати"
                    >
                      ✏️
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(c.id)}
                      className={styles.iconButton}
                      title="Видалити"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (
              <tr>
                <td colSpan={4} className={styles.tdEmpty}>
                  Категорій немає
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.info}>Всього категорій: {data?.length || 0}</div>
    </div>
  );
}
