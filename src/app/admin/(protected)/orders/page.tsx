"use client";
import Link from "next/link";
import React from "react";
import type { AdminOrderListItem } from "@/services/admin";
import { useAdminOrdersList } from "@/services/admin";
import styles from "../products/products.module.scss";

export default function AdminOrdersPage() {
  const [q, setQ] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 20;
  const { data, isLoading } = useAdminOrdersList({ q, status, page, perPage });

  const statusLabels: Record<string, string> = {
    new: "Нове",
    processing: "В обробці",
    shipped: "Відправлено",
    completed: "Завершено",
    cancelled: "Скасовано",
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Замовлення</h1>
      </div>

      <div className={styles.toolbar}>
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Пошук за номером, ПІБ, телефоном..."
          className={styles.searchInput}
        />

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          className={styles.sortSelect}
        >
          <option value="">Усі статуси</option>
          <option value="new">Нові</option>
          <option value="processing">В обробці</option>
          <option value="shipped">Відправлено</option>
          <option value="completed">Завершені</option>
          <option value="cancelled">Скасовані</option>
        </select>
      </div>

      {isLoading && <div className={styles.info}>Завантаження…</div>}

      {!isLoading && data && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.th}>№</th>
                  <th className={styles.th}>Клієнт</th>
                  <th className={styles.th}>Телефон</th>
                  <th className={styles.th}>Сума</th>
                  <th className={styles.th}>Статус</th>
                  <th className={styles.th}>Створено</th>
                  <th className={styles.th}>Дії</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((o: AdminOrderListItem) => (
                  <tr key={o.id}>
                    <td className={styles.td}>#{o.number}</td>
                    <td className={styles.td}>{o.customer.fullName}</td>
                    <td className={styles.td}>{o.customer.phone}</td>
                    <td className={styles.td}>
                      {o.totals.grand.toFixed(0)} грн
                    </td>
                    <td className={styles.td}>
                      <span className={styles.statusBadge}>
                        {statusLabels[o.status] || o.status}
                      </span>
                    </td>
                    <td className={styles.td}>
                      {new Date(o.createdAt).toLocaleDateString("uk-UA")}
                    </td>
                    <td className={styles.td}>
                      <div className={styles.actions}>
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className={styles.iconButton}
                          title="Переглянути"
                        >
                          👁️
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.items.length === 0 && (
            <div className={styles.info}>Замовлень не знайдено</div>
          )}

          <div className={styles.pagination}>
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className={styles.paginationButton}
            >
              ← Назад
            </button>
            <div className={styles.paginationInfo}>
              Сторінка {data.page} з{" "}
              {Math.max(1, Math.ceil(data.total / data.perPage))}
            </div>
            <button
              type="button"
              onClick={() => setPage((p) => p + 1)}
              disabled={data.items.length < data.perPage}
              className={styles.paginationButton}
            >
              Далі →
            </button>
          </div>

          <div className={styles.info}>Всього замовлень: {data.total}</div>
        </>
      )}
    </div>
  );
}
