"use client";
import Link from "next/link";
import React from "react";
import useSWR from "swr";
import { AdminApi } from "@/services/admin";
import type { Product } from "@/types/catalog";

export default function AdminProductsListPage() {
  const [q, setQ] = React.useState("");
  const [page, setPage] = React.useState(1);
  const perPage = 20;
  const { data, mutate, isLoading, error } = useSWR(
    ["admin/products", { q, page, perPage }],
    () => AdminApi.listProducts({ q, page, perPage }),
    {
      onError: (err) => {
        console.error("Failed to load products:", err);
      },
    },
  );

  const onDelete = async (id: string) => {
    if (!confirm("Видалити товар?")) return;
    await AdminApi.deleteProduct(id);
    mutate();
  };

  const total = data?.total || 0;
  const pages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0 }}>Товари</h1>
        <Link
          href="/admin/products/new"
          style={{
            padding: "8px 12px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
          }}
        >
          Додати товар
        </Link>
      </div>

      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <input
          placeholder="Пошук..."
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          style={{
            padding: "8px 10px",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            width: 320,
          }}
        />
      </div>

      <div
        style={{
          overflowX: "auto",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              <th style={th}>Назва</th>
              <th style={th}>Ціна</th>
              <th style={th}>Склад</th>
              <th style={th}>Дії</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} style={{ padding: 16 }}>
                  Завантаження…
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: "#ef4444" }}>
                  Помилка завантаження: {error.message}
                </td>
              </tr>
            )}
            {!isLoading &&
              !error &&
              data?.items?.map((p: Product) => (
                <tr key={p.id}>
                  <td style={td}>{p.title}</td>
                  <td style={td}>
                    {p.salePrice != null ? (
                      <>
                        <s style={{ color: "#6b7280" }}>{p.price}</s>{" "}
                        <b>{p.salePrice}</b>
                      </>
                    ) : (
                      p.price
                    )}
                  </td>
                  <td style={td}>{p.stock}</td>
                  <td style={td}>
                    <Link
                      href={`/admin/products/${p.id}`}
                      style={{ marginRight: 8 }}
                    >
                      Редагувати
                    </Link>
                    <button
                      type="button"
                      onClick={() => onDelete(p.id)}
                      style={{
                        border: "1px solid #e5e7eb",
                        borderRadius: 6,
                        padding: "4px 8px",
                      }}
                    >
                      Видалити
                    </button>
                  </td>
                </tr>
              ))}
            {!isLoading && !error && data?.items?.length === 0 && (
              <tr>
                <td colSpan={4} style={{ padding: 16, color: "#6b7280" }}>
                  Товарів немає
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}
      >
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          style={btn}
        >
          Назад
        </button>
        <span style={{ fontSize: 12, color: "#6b7280" }}>
          Сторінка {page} / {pages}
        </span>
        <button
          type="button"
          disabled={page >= pages}
          onClick={() => setPage((p) => Math.min(pages, p + 1))}
          style={btn}
        >
          Вперед
        </button>
      </div>
    </div>
  );
}

const th: React.CSSProperties = {
  textAlign: "left",
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
  fontSize: 12,
  color: "#6b7280",
};
const td: React.CSSProperties = {
  padding: 12,
  borderBottom: "1px solid #f3f4f6",
};
const btn: React.CSSProperties = {
  padding: "6px 10px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
};
