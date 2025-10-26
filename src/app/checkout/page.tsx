"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/uikit";
import { clientLogger } from "@/lib/client-logger";
import {
  calculateDeliveryCost,
  getWarehouses,
  type NovaPoshtaCity,
  type NovaPoshtaWarehouse,
  searchCities,
} from "@/services/novaposhta";
import { OrdersService } from "@/services/orders";
import { useCart } from "@/store/cart";
import styles from "./checkout.module.scss";

type FormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  cityRef: string;
  warehouse: string;
  warehouseRef: string;
  paymentMethod: "cod" | "requisites";
  notes: string;
};

type FormErrors = {
  [K in keyof FormData]?: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "Имя Фамилия",
    email: "email@example.com",
    phone: "+380991234567",
    address: "Адрес доставки",
    city: "Город",
    cityRef: "city_1234567890",
    warehouse: "Відділення №1",
    warehouseRef: "warehouse_1234567890",
    paymentMethod: "cod",
    notes: "Примітка до замовлення",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [step, setStep] = useState<"cart" | "shipping" | "payment">("cart");

  // Нова Пошта інтеграція
  const [cities, setCities] = useState<NovaPoshtaCity[]>([]);
  const [warehouses, setWarehouses] = useState<NovaPoshtaWarehouse[]>([]);
  const [showCities, setShowCities] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [deliveryCost, setDeliveryCost] = useState(0);

  // Calculate order totals
  const subtotal = Object.values(cart.items).reduce(
    (sum, item) => sum + item.price * item.qty,
    0,
  );
  const shippingFee = deliveryCost;
  const total = subtotal + shippingFee;

  // Redirect to home if cart is empty
  useEffect(() => {
    if (Object.keys(cart.items).length === 0) {
      router.push("/");
    }
  }, [cart.items, router]);

  // Пошук міст при введенні
  useEffect(() => {
    const performCitySearch = async () => {
      console.log("🔍 Searching cities for:", citySearch);
      if (citySearch.length >= 2) {
        const results = await searchCities(citySearch);
        console.log("📍 Cities found:", results);
        setCities(results);
      } else {
        setCities([]);
      }
    };

    const timeoutId = setTimeout(performCitySearch, 300);
    return () => clearTimeout(timeoutId);
  }, [citySearch]);

  // Завантаження відділень при виборі міста
  useEffect(() => {
    const loadWarehouses = async () => {
      if (formData.cityRef) {
        const wh = await getWarehouses(formData.cityRef);
        setWarehouses(wh);
      }
    };

    loadWarehouses();
  }, [formData.cityRef]);

  // Розрахунок вартості доставки
  useEffect(() => {
    const calculateCost = async () => {
      if (formData.cityRef && subtotal > 0) {
        const cost = await calculateDeliveryCost(formData.cityRef, 1, subtotal);
        setDeliveryCost(cost);
      }
    };

    calculateCost();
  }, [formData.cityRef, subtotal]);

  // Handle form input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when field is edited
    if (errors[name as keyof FormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) newErrors.name = "Ім'я обов'язкове";
    if (!formData.email.trim()) newErrors.email = "Email обов'язковий";
    if (!formData.phone.trim()) newErrors.phone = "Телефон обов'язковий";
    if (!formData.city || !formData.cityRef)
      newErrors.city = "Оберіть місто зі списку";
    if (!formData.warehouse || !formData.warehouseRef)
      newErrors.address = "Оберіть відділення зі списку";

    // Email format
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = "Некоректний email";
    }

    // Phone format (simple validation)
    if (formData.phone && !/^\+?[0-9\s-]{10,15}$/.test(formData.phone)) {
      newErrors.phone = "Некоректний телефон";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create order items from cart
      const items = Object.values(cart.items).map((item) => ({
        productId: item.productId,
        qty: item.qty,
        title: item.title,
        price: item.price,
        image: item.image,
      }));

      // Create order payload
      const orderPayload = {
        customer: {
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
        delivery: {
          carrier: "nova" as const,
          city: formData.city,
          cityRef: formData.cityRef,
          warehouse: formData.warehouse,
          warehouseRef: formData.warehouseRef,
          address: formData.address,
        },
        payment: {
          provider: formData.paymentMethod,
        },
        items,
        notes: formData.notes,
      };

      // Create order
      const order = await OrdersService.createOrder(orderPayload);

      // Clear cart and redirect to confirmation page
      cart.clear();
      router.push(`/order/confirmed?order=${order.number}`);
    } catch (error) {
      clientLogger.error("Failed to create order", error as Error);
      alert("Помилка при оформленні замовлення. Спробуйте ще раз.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle step navigation
  const goToNextStep = () => {
    if (step === "cart") {
      setStep("shipping");
    } else if (step === "shipping") {
      // Validate shipping info before proceeding
      if (
        formData.name &&
        formData.email &&
        formData.phone &&
        formData.city &&
        formData.cityRef &&
        formData.warehouse &&
        formData.warehouseRef
      ) {
        setStep("payment");
      } else {
        validateForm();
      }
    }
  };

  const goToPrevStep = () => {
    if (step === "payment") {
      setStep("shipping");
    } else if (step === "shipping") {
      setStep("cart");
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Оформлення замовлення</h1>

      {/* Progress indicator */}
      <div className={styles.progress}>
        <div
          className={`${styles.progressStep} ${step === "cart" ? styles.active : ""} ${step === "shipping" || step === "payment" ? styles.completed : ""}`}
        >
          <div className={styles.progressIcon}>1</div>
          <span className={styles.progressLabel}>Кошик</span>
        </div>
        <div className={styles.progressLine}></div>
        <div
          className={`${styles.progressStep} ${step === "shipping" ? styles.active : ""} ${step === "payment" ? styles.completed : ""}`}
        >
          <div className={styles.progressIcon}>2</div>
          <span className={styles.progressLabel}>Доставка</span>
        </div>
        <div className={styles.progressLine}></div>
        <div
          className={`${styles.progressStep} ${step === "payment" ? styles.active : ""}`}
        >
          <div className={styles.progressIcon}>3</div>
          <span className={styles.progressLabel}>Оплата</span>
        </div>
      </div>

      <div className={styles.layout}>
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit}>
            {/* Step 1: Cart Review */}
            {step === "cart" && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Ваше замовлення</h2>

                <div className={styles.cartItems}>
                  {Object.values(cart.items).map((item) => (
                    <div key={item.productId} className={styles.cartItem}>
                      <div className={styles.cartItemImage}>
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            width={80}
                            height={80}
                            style={{ objectFit: "contain" }}
                          />
                        ) : (
                          <div className={styles.noImage}>Немає зображення</div>
                        )}
                      </div>
                      <div className={styles.cartItemInfo}>
                        <h3 className={styles.cartItemTitle}>{item.title}</h3>
                        <div className={styles.cartItemPrice}>
                          {item.price} ₴
                        </div>
                      </div>
                      <div className={styles.cartItemQty}>
                        <div className={styles.qtyControls}>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              cart.setQty(
                                item.productId,
                                Math.max(0, item.qty - 1),
                              )
                            }
                          >
                            -
                          </button>
                          <span className={styles.qty}>{item.qty}</span>
                          <button
                            type="button"
                            className={styles.qtyBtn}
                            onClick={() =>
                              cart.setQty(item.productId, item.qty + 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className={styles.removeBtn}
                          onClick={() => cart.remove(item.productId)}
                        >
                          Видалити
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={styles.cartActions}>
                  <Link href="/catalog" className={styles.continueShoppingLink}>
                    Продовжити покупки
                  </Link>
                  <Button onClick={goToNextStep}>Продовжити</Button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Information */}
            {step === "shipping" && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Інформація для доставки</h2>

                <div className={styles.formGroup}>
                  <label htmlFor="name" className={styles.label}>
                    Ім'я та прізвище <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={errors.name ? styles.inputError : styles.input}
                    placeholder="Введіть ім'я та прізвище"
                  />
                  {errors.name && (
                    <div className={styles.errorText}>{errors.name}</div>
                  )}
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="email" className={styles.label}>
                      Email <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={
                        errors.email ? styles.inputError : styles.input
                      }
                      placeholder="Введіть email"
                    />
                    {errors.email && (
                      <div className={styles.errorText}>{errors.email}</div>
                    )}
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="phone" className={styles.label}>
                      Телефон <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={
                        errors.phone ? styles.inputError : styles.input
                      }
                      placeholder="+380XXXXXXXXX"
                    />
                    {errors.phone && (
                      <div className={styles.errorText}>{errors.phone}</div>
                    )}
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="city" className={styles.label}>
                    Місто Нової Пошти <span className={styles.required}>*</span>
                  </label>
                  <div className={styles.autocompleteWrapper}>
                    <input
                      type="text"
                      id="city"
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setShowCities(true);
                      }}
                      onFocus={() => setShowCities(true)}
                      className={errors.city ? styles.inputError : styles.input}
                      placeholder="Почніть вводити назву міста..."
                    />
                    {showCities && cities.length > 0 && (
                      <div className={styles.autocompleteList}>
                        {cities.map((city) => (
                          <button
                            key={city.ref}
                            type="button"
                            className={styles.autocompleteItem}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                city: city.name,
                                cityRef: city.ref,
                                warehouse: "",
                                warehouseRef: "",
                                address: "",
                              }));
                              setCitySearch(city.name);
                              setShowCities(false);
                            }}
                          >
                            <div className={styles.cityName}>{city.name}</div>
                            <div className={styles.cityArea}>{city.area}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.city && (
                    <div className={styles.errorText}>{errors.city}</div>
                  )}
                </div>

                {formData.cityRef && (
                  <div className={styles.formGroup}>
                    <label htmlFor="warehouse" className={styles.label}>
                      Відділення Нової Пошти{" "}
                      <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.autocompleteWrapper}>
                      <input
                        type="text"
                        id="warehouse"
                        value={formData.warehouse}
                        onChange={(e) => {
                          setFormData((prev) => ({
                            ...prev,
                            warehouse: e.target.value,
                          }));
                          setShowWarehouses(true);
                        }}
                        onFocus={() => setShowWarehouses(true)}
                        className={
                          errors.address ? styles.inputError : styles.input
                        }
                        placeholder="Виберіть відділення..."
                      />
                      {showWarehouses && warehouses.length > 0 && (
                        <div className={styles.autocompleteList}>
                          {warehouses.map((wh) => (
                            <button
                              key={wh.ref}
                              type="button"
                              className={styles.autocompleteItem}
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  warehouse: wh.description,
                                  warehouseRef: wh.ref,
                                  address: wh.description,
                                }));
                                setShowWarehouses(false);
                              }}
                            >
                              {wh.description}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.address && (
                      <div className={styles.errorText}>{errors.address}</div>
                    )}
                  </div>
                )}

                <div className={styles.formActions}>
                  <Button variant="ghost" onClick={goToPrevStep}>
                    Назад
                  </Button>
                  <Button onClick={goToNextStep}>Продовжити</Button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === "payment" && (
              <div className={styles.formSection}>
                <h2 className={styles.sectionTitle}>Оплата</h2>

                <div className={styles.paymentOptions}>
                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={formData.paymentMethod === "cod"}
                      onChange={handleChange}
                    />
                    <div className={styles.paymentOptionContent}>
                      <div className={styles.paymentOptionTitle}>
                        Оплата при отриманні
                      </div>
                      <div className={styles.paymentOptionDesc}>
                        Оплатіть готівкою або карткою при отриманні замовлення
                      </div>
                    </div>
                  </label>

                  <label className={styles.paymentOption}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="requisites"
                      checked={formData.paymentMethod === "requisites"}
                      onChange={handleChange}
                    />
                    <div className={styles.paymentOptionContent}>
                      <div className={styles.paymentOptionTitle}>
                        Оплата за реквізитами
                      </div>
                      <div className={styles.paymentOptionDesc}>
                        Після оформлення замовлення ми надішлемо вам реквізити
                        для оплати
                      </div>
                    </div>
                  </label>
                </div>

                {formData.paymentMethod === "requisites" && (
                  <div className={styles.requisitesInfo}>
                    <h3 className={styles.requisitesTitle}>
                      Реквізити для оплати:
                    </h3>
                    <div className={styles.requisitesDetails}>
                      <p>
                        <strong>Отримувач:</strong> ФОП Іваненко Іван Іванович
                      </p>
                      <p>
                        <strong>ЄДРПОУ:</strong> 1234567890
                      </p>
                      <p>
                        <strong>Банк:</strong> ПриватБанк
                      </p>
                      <p>
                        <strong>IBAN:</strong> UA123456789012345678901234567
                      </p>
                      <p>
                        <strong>Призначення платежу:</strong> Оплата за
                        замовлення №[буде вказано після оформлення]
                      </p>
                    </div>
                    <p className={styles.requisitesNote}>
                      ⚠️ Замовлення буде відправлено після надходження коштів на
                      рахунок (зазвичай 1-2 робочих дні).
                    </p>
                  </div>
                )}

                <div className={styles.formGroup}>
                  <label htmlFor="notes" className={styles.label}>
                    Примітки до замовлення
                  </label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    className={styles.textarea}
                    placeholder="Додаткова інформація до замовлення"
                    rows={4}
                  />
                </div>

                <div className={styles.formActions}>
                  <Button variant="ghost" onClick={goToPrevStep}>
                    Назад
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Обробка..." : "Оформити замовлення"}
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className={styles.orderSummary}>
          <h2 className={styles.summaryTitle}>Ваше замовлення</h2>

          <div className={styles.summaryItems}>
            {Object.values(cart.items).map((item) => (
              <div key={item.productId} className={styles.summaryItem}>
                <div className={styles.summaryItemName}>
                  {item.title}{" "}
                  <span className={styles.summaryItemQty}>x{item.qty}</span>
                </div>
                <div className={styles.summaryItemPrice}>
                  {item.price * item.qty} ₴
                </div>
              </div>
            ))}
          </div>

          {/* Інформація про доставку */}
          {step !== "cart" && formData.city && (
            <div className={styles.summaryDelivery}>
              <h3 className={styles.summarySubtitle}>Доставка</h3>
              <div className={styles.deliveryInfo}>
                <div className={styles.deliveryRow}>
                  <strong>Перевізник:</strong> Нова Пошта
                </div>
                {formData.city && (
                  <div className={styles.deliveryRow}>
                    <strong>Місто:</strong> {formData.city}
                  </div>
                )}
                {formData.warehouse && (
                  <div className={styles.deliveryRow}>
                    <strong>Відділення:</strong> {formData.warehouse}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className={styles.summaryTotals}>
            <div className={styles.summaryRow}>
              <div className={styles.summaryLabel}>Сума</div>
              <div className={styles.summaryValue}>{subtotal} ₴</div>
            </div>

            <div className={styles.summaryRow}>
              <div className={styles.summaryLabel}>Доставка</div>
              <div className={styles.summaryValue}>
                {shippingFee === 0 ? "Безкоштовно" : `${shippingFee} ₴`}
              </div>
            </div>

            <div className={`${styles.summaryRow} ${styles.summaryTotal}`}>
              <div className={styles.summaryLabel}>Всього</div>
              <div className={styles.summaryValue}>{total} ₴</div>
            </div>
          </div>

          <div className={styles.shippingNote}>
            {subtotal < 1500 ? (
              <p>Безкоштовна доставка від 1500 ₴</p>
            ) : (
              <p>Ви отримали безкоштовну доставку!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
