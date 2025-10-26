"use client";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import React from "react";
import useSWR from "swr";
import type { AdminOrderDetail } from "@/services/admin";
import { AdminApi } from "@/services/admin";
import styles from "../../products/products.module.scss";
import orderStyles from "./order-detail.module.scss";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
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

  if (isLoading || !order)
    return <div className={styles.info}>Завантаження…</div>;

  const sanitizeSrc = (s: string) => s?.trim();

  const paymentLabels: Record<string, string> = {
    cod: "Оплата при отриманні",
    requisites: "Оплата за реквізитами",
    card: "Оплата карткою",
    fondy: "Fondy",
    liqpay: "LiqPay",
  };

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
        <div>
          <h1 className={styles.title}>Замовлення №{order.number}</h1>
          <div className={orderStyles.orderMeta}>
            <span>
              Створено: {new Date(order.createdAt).toLocaleString("uk-UA")}
            </span>
            <span className={styles.statusBadge}>
              {statusLabels[order.status] || order.status}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push("/admin/orders")}
          className={styles.addButton}
        >
          ← Назад до списку
        </button>
      </div>

      <div className={orderStyles.grid}>
        <div className={orderStyles.mainColumn}>
          {/* Клієнт */}
          <section className={orderStyles.section}>
            <h3 className={orderStyles.sectionTitle}>👤 Клієнт</h3>
            <div className={orderStyles.infoGrid}>
              <div>
                <strong>ПІБ:</strong> {order.customer.fullName}
              </div>
              <div>
                <strong>Телефон:</strong> {order.customer.phone}
              </div>
              {order.customer.email && (
                <div>
                  <strong>Email:</strong> {order.customer.email}
                </div>
              )}
            </div>
          </section>

          {/* Доставка */}
          <section className={orderStyles.section}>
            <h3 className={orderStyles.sectionTitle}>📦 Доставка</h3>
            <div className={orderStyles.infoGrid}>
              <div>
                <strong>Перевізник:</strong>{" "}
                {order.delivery.carrier === "nova" ? "Нова Пошта" : "Укрпошта"}
              </div>

              {/* Місто */}
              {order.delivery.city ? (
                <div>
                  <strong>Місто:</strong> {order.delivery.city}
                </div>
              ) : order.delivery.cityRef ? (
                <div>
                  <strong>Місто:</strong>{" "}
                  <span style={{ color: "#ef4444" }}>
                    ⚠️ Тільки Ref: {order.delivery.cityRef}
                  </span>
                </div>
              ) : null}

              {/* Відділення/Адреса */}
              {order.delivery.warehouse ? (
                <div>
                  <strong>Відділення:</strong> {order.delivery.warehouse}
                </div>
              ) : order.delivery.address ? (
                <div>
                  <strong>Адреса доставки:</strong>{" "}
                  <span style={{ fontWeight: 600, color: "#059669" }}>
                    {order.delivery.address}
                  </span>
                </div>
              ) : order.delivery.warehouseRef ? (
                <div>
                  <strong>Відділення:</strong>{" "}
                  <span style={{ color: "#ef4444" }}>
                    ⚠️ Тільки Ref: {order.delivery.warehouseRef}
                  </span>
                </div>
              ) : null}

              {/* Технічна інформація */}
              {(order.delivery.cityRef || order.delivery.warehouseRef) && (
                <details className={orderStyles.techDetails}>
                  <summary>Технічна інформація (API Refs)</summary>
                  <div className={orderStyles.techInfo}>
                    {order.delivery.cityRef && (
                      <div>
                        <strong>City Ref:</strong> {order.delivery.cityRef}
                      </div>
                    )}
                    {order.delivery.warehouseRef && (
                      <div>
                        <strong>Warehouse Ref:</strong>{" "}
                        {order.delivery.warehouseRef}
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
          </section>

          {/* Товари */}
          <section className={orderStyles.sectionWithTable}>
            <h3 className={orderStyles.sectionTitle}>🛍️ Товари</h3>
            <div className={orderStyles.tableWrapper}>
              <table className={orderStyles.table}>
                <thead>
                  <tr>
                    <th className={orderStyles.th}>Товар</th>
                    <th className={orderStyles.th}>SKU</th>
                    <th
                      className={orderStyles.th}
                      style={{ textAlign: "right" }}
                    >
                      К-сть
                    </th>
                    <th
                      className={orderStyles.th}
                      style={{ textAlign: "right" }}
                    >
                      Ціна
                    </th>
                    <th
                      className={orderStyles.th}
                      style={{ textAlign: "right" }}
                    >
                      Сума
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it, idx) => {
                    const p = (it as any).product;
                    const hasSale =
                      it.salePrice != null && typeof it.salePrice === "number";
                    const _savings = hasSale
                      ? Math.max(
                          0,
                          it.basePrice - (it.salePrice ?? it.basePrice),
                        )
                      : 0;
                    return (
                      <tr key={`${it.productId}-${idx}`}>
                        <td className={orderStyles.td}>
                          <div className={orderStyles.productCell}>
                            {(it.image || p?.images?.[0]) && (
                              <Image
                                src={sanitizeSrc(
                                  (it.image || p?.images?.[0]) as string,
                                )}
                                alt={(it.title || p?.title) as string}
                                width={40}
                                height={40}
                                className={orderStyles.productImage}
                              />
                            )}
                            {p?.slug ? (
                              <a
                                href={`/product/${p.slug}`}
                                target="_blank"
                                rel="noreferrer"
                                className={orderStyles.productLink}
                              >
                                {it.title || p.title}
                              </a>
                            ) : (
                              <span>
                                {it.title || p?.title || it.productId}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className={orderStyles.td}>
                          {it.sku || p?.sku || "-"}
                        </td>
                        <td
                          className={orderStyles.td}
                          style={{ textAlign: "right" }}
                        >
                          {it.qty}
                        </td>
                        <td
                          className={orderStyles.td}
                          style={{ textAlign: "right" }}
                        >
                          {hasSale ? (
                            <div>
                              <strong>{it.price.toFixed(0)} грн</strong>
                              <br />
                              <span className={orderStyles.oldPrice}>
                                <s>{it.basePrice.toFixed(0)} грн</s>
                              </span>
                            </div>
                          ) : (
                            <span>{it.price.toFixed(0)} грн</span>
                          )}
                        </td>
                        <td
                          className={orderStyles.td}
                          style={{ textAlign: "right" }}
                        >
                          <strong>{(it.price * it.qty).toFixed(0)} грн</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Підсумок */}
          <section className={orderStyles.section}>
            <h3 className={orderStyles.sectionTitle}>💰 Підсумок</h3>
            <div className={orderStyles.totalsGrid}>
              <div className={orderStyles.totalRow}>
                <span>Товари:</span>
                <strong>{order.totals.items.toFixed(0)} грн</strong>
              </div>
              <div className={orderStyles.totalRow}>
                <span>Доставка:</span>
                <strong>{order.totals.shipping.toFixed(0)} грн</strong>
              </div>
              <div className={orderStyles.totalRowMain}>
                <span>Всього до сплати:</span>
                <strong>{order.totals.grand.toFixed(0)} грн</strong>
              </div>
            </div>
          </section>

          {/* Оплата */}
          <section className={orderStyles.section}>
            <h3 className={orderStyles.sectionTitle}>💳 Оплата</h3>
            <div className={orderStyles.infoGrid}>
              <div>
                <strong>Метод:</strong>{" "}
                {paymentLabels[order.payment.provider] ||
                  order.payment.provider}
              </div>
              <div>
                <strong>Статус:</strong>{" "}
                <span className={orderStyles.paymentStatus}>
                  {order.payment.status === "paid"
                    ? "✅ Оплачено"
                    : order.payment.status === "failed"
                      ? "❌ Відхилено"
                      : "⏳ Очікується"}
                </span>
              </div>
            </div>
          </section>

          {/* Реквізити для оплати */}
          {order.payment.provider === "requisites" && (
            <section className={orderStyles.section}>
              <h3 className={orderStyles.sectionTitle}>
                📋 Реквізити для оплати (копіпаст для клієнта)
              </h3>
              <div className={orderStyles.requisites}>
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
                  <strong>Банк:</strong>{" "}
                  {process.env.NEXT_PUBLIC_BANK_NAME || ""}
                </div>
                {process.env.NEXT_PUBLIC_EDRPOU && (
                  <div>
                    <strong>ЄДРПОУ:</strong> {process.env.NEXT_PUBLIC_EDRPOU}
                  </div>
                )}
                <div>
                  <strong>Сума:</strong> {order.totals.grand.toFixed(0)} грн
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
          )}

          {/* Примітки */}
          {order.notes && (
            <section className={orderStyles.section}>
              <h3 className={orderStyles.sectionTitle}>
                📝 Примітки до замовлення
              </h3>
              <div className={orderStyles.notes}>{order.notes}</div>
            </section>
          )}
        </div>

        <div className={orderStyles.sideColumn}>
          <section className={orderStyles.section}>
            <h3 className={orderStyles.sectionTitle}>⚙️ Керування</h3>
            <div className={orderStyles.controls}>
              <label className={orderStyles.label}>
                <span>Статус замовлення</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as typeof status)}
                  className={orderStyles.select}
                >
                  <option value="new">Нове</option>
                  <option value="processing">В обробці</option>
                  <option value="shipped">Відправлено</option>
                  <option value="completed">Завершено</option>
                  <option value="cancelled">Скасовано</option>
                </select>
              </label>

              <label className={orderStyles.label}>
                <span>ТТН (Номер накладної)</span>
                <input
                  value={ttn}
                  onChange={(e) => setTtn(e.target.value)}
                  placeholder="Введіть номер накладної..."
                  className={orderStyles.input}
                />
              </label>

              <div className={orderStyles.buttons}>
                <button
                  type="button"
                  onClick={onSave}
                  className={orderStyles.saveButton}
                >
                  💾 Зберегти
                </button>
                <button
                  type="button"
                  onClick={onDelete}
                  className={orderStyles.deleteButton}
                >
                  🗑️ Видалити
                </button>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
