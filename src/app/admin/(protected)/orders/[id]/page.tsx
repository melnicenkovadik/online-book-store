"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";
import type { AdminOrderDetail } from "@/services/admin";
import { AdminApi } from "@/services/admin";

export default function OrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;
  const {
    data: order,
    isLoading,
    mutate,
  } = useSWR<AdminOrderDetail>(["admin/order", id], () =>
    AdminApi.getOrder(id),
  );

  const [status, setStatus] = React.useState<
    "new" | "processing" | "shipped" | "completed" | "cancelled"
  >("new");
  const [ttn, setTtn] = React.useState("");
  React.useEffect(() => {
    if (order) {
      setStatus(order.status as typeof status);
      setTtn(order.ttn || "");
    }
  }, [order]);

  async function onSave() {
    await AdminApi.updateOrder(id, { status, ttn });
    await mutate();
  }

  async function onDelete() {
    if (!confirm("Видалити замовлення?")) return;
    await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
    router.push("/admin/orders");
  }

  if (isLoading || !order) return <div>Завантаження…</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Замовлення №{order.number}</h1>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <div>
          <section
            style={{
              marginBottom: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Клієнт</h3>
            <div>{order.customer.fullName}</div>
            <div>{order.customer.phone}</div>
            {order.customer.email && <div>{order.customer.email}</div>}
          </section>

          <section
            style={{
              marginBottom: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Товари</h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                    }}
                  >
                    Товар
                  </th>
                  <th
                    style={{
                      textAlign: "left",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                    }}
                  >
                    SKU
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                    }}
                  >
                    К-сть
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                    }}
                  >
                    Ціна
                  </th>
                  <th
                    style={{
                      textAlign: "right",
                      borderBottom: "1px solid #e5e7eb",
                      padding: "8px 4px",
                    }}
                  >
                    Сума
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((it, idx) => {
                  const p = (it as any).product; // populated product (optional)
                  const hasSale =
                    it.salePrice != null && typeof it.salePrice === "number";
                  const savings = hasSale
                    ? Math.max(0, it.basePrice - (it.salePrice ?? it.basePrice))
                    : 0;
                  return (
                    <tr key={`${it.productId}-${idx}`}>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          {(it.image || p?.images?.[0]) && (
                            <Image
                              src={(it.image || p?.images?.[0]) as string}
                              alt={(it.title || p?.title) as string}
                              width={40}
                              height={40}
                              style={{
                                objectFit: "cover",
                                borderRadius: 6,
                                border: "1px solid #eee",
                              }}
                            />
                          )}
                          {p?.slug ? (
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {it.title || p.title}
                            </a>
                          ) : (
                            <span>{it.title || p?.title || it.productId}</span>
                          )}
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "8px 4px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {it.sku || p?.sku || "-"}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "8px 4px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {it.qty}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "8px 4px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {hasSale ? (
                          <div style={{ display: "grid" }}>
                            <span>
                              <strong>{it.price.toFixed(2)} грн</strong>
                            </span>
                            <span style={{ opacity: 0.7 }}>
                              <s>{it.basePrice.toFixed(2)} грн</s>{" "}
                              <span style={{ color: "#10b981" }}>
                                −{savings.toFixed(2)} грн
                              </span>
                            </span>
                          </div>
                        ) : (
                          <span>{it.price.toFixed(2)} грн</span>
                        )}
                      </td>
                      <td
                        style={{
                          textAlign: "right",
                          padding: "8px 4px",
                          borderBottom: "1px solid #f3f4f6",
                        }}
                      >
                        {(it.price * it.qty).toFixed(2)} грн
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          <section
            style={{
              marginBottom: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Реквізити для оплати (копіпаст для клієнта)
            </h3>
            <div style={{ display: "grid", gap: 6 }}>
              <div>
                <strong>Отримувач:</strong>{" "}
                {process.env.NEXT_PUBLIC_PAYEE_NAME || "Ваше підприємство"}
              </div>
              <div>
                <strong>IBAN:</strong>{" "}
                {process.env.NEXT_PUBLIC_IBAN ||
                  "UAxx xxxx xxxx xxxx xxxx xxxx xxx"}
              </div>
              <div>
                <strong>Банк:</strong> {process.env.NEXT_PUBLIC_BANK_NAME || ""}
              </div>
              {process.env.NEXT_PUBLIC_EDRPOU && (
                <div>
                  <strong>ЄДРПОУ:</strong> {process.env.NEXT_PUBLIC_EDRPOU}
                </div>
              )}
              <div>
                <strong>Сума:</strong> {order.totals.grand.toFixed(2)} грн
              </div>
              <div>
                <strong>Призначення платежу:</strong>{" "}
                {(
                  process.env.NEXT_PUBLIC_PAYMENT_PURPOSE ||
                  "Оплата замовлення {number}"
                ).replace("{number}", order.number)}
              </div>
            </div>
          </section>
        </div>

        <div>
          <section
            style={{
              marginBottom: 16,
              border: "1px solid #e5e7eb",
              borderRadius: 12,
              padding: 16,
            }}
          >
            <h3 style={{ marginTop: 0 }}>Керування</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <label>
                <div style={{ fontSize: 12, color: "#6b7280" }}>Статус</div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <option value="new">Нове</option>
                  <option value="processing">В обробці</option>
                  <option value="shipped">Відправлено</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Скасовано</option>
                </select>
              </label>
              <label>
                <div style={{ fontSize: 12, color: "#6b7280" }}>ТТН</div>
                <input
                  value={ttn}
                  onChange={(e) => setTtn(e.target.value)}
                  placeholder="Номер накладної"
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                  }}
                />
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  onClick={onSave}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #e5e7eb",
                    background: "#fff",
                  }}
                >
                  Зберегти
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: "1px solid #ef4444",
                    background: "#fff",
                    color: "#ef4444",
                  }}
                >
                  Видалити
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
