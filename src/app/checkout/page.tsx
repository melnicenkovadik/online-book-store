"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { OrdersService } from '@/services/orders';
import { Button } from '@/components/uikit';
import { useCart } from '@/store/cart';

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // form state
  const [fullName, setFullName] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [email, setEmail] = React.useState('');

  const [carrier, setCarrier] = React.useState<'nova' | 'ukr'>('nova');
  const [cityRef, setCityRef] = React.useState('');
  const [warehouseRef, setWarehouseRef] = React.useState('');

  const [provider, setProvider] = React.useState<'cod' | 'fondy' | 'liqpay'>('cod');

  const items = React.useMemo(() => Object.values(cart.items), [cart.items]);
  const total = cart.subtotal();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!items.length) {
      setError('Кошик порожній');
      return;
    }
    if (!fullName || !phone) {
      setError('Вкажіть ПІБ і телефон');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
        customer: { fullName, phone, email: email || undefined },
        delivery: { carrier, cityRef: cityRef || undefined, warehouseRef: warehouseRef || undefined },
        payment: { provider },
      } as const;
      const res = await OrdersService.createOrder(payload);
      cart.clear();
      router.push(`/order/confirmed?number=${encodeURIComponent(res.number)}`);
    } catch (err) {
      setError((err as Error).message || 'Не вдалося створити замовлення');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Оформлення замовлення</h1>
      {items.length === 0 ? (
        <div>
          <p>Кошик порожній.</p>
          <Link href="/catalog">До каталогу</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <fieldset>
              <legend>Контакти</legend>
              <div>
                <label>ПІБ<br />
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                </label>
              </div>
              <div>
                <label>Телефон<br />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} required />
                </label>
              </div>
              <div>
                <label>Email (необов'язково)<br />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Доставка</legend>
              <div>
                <label>
                  <input type="radio" checked={carrier === 'nova'} onChange={() => setCarrier('nova')} /> Нова Пошта
                </label>
                <label style={{ marginLeft: 16 }}>
                  <input type="radio" checked={carrier === 'ukr'} onChange={() => setCarrier('ukr')} /> Укрпошта
                </label>
              </div>
              <div>
                <label>Місто<br />
                  <input value={cityRef} onChange={(e) => setCityRef(e.target.value)} />
                </label>
              </div>
              <div>
                <label>Відділення/пошта<br />
                  <input value={warehouseRef} onChange={(e) => setWarehouseRef(e.target.value)} />
                </label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Оплата</legend>
              <div>
                <label>
                  <input type="radio" checked={provider === 'cod'} onChange={() => setProvider('cod')} /> Післяплата
                </label>
                <label style={{ marginLeft: 16 }}>
                  <input type="radio" checked={provider === 'fondy'} onChange={() => setProvider('fondy')} /> Банківська карта (Fondy)
                </label>
                <label style={{ marginLeft: 16 }}>
                  <input type="radio" checked={provider === 'liqpay'} onChange={() => setProvider('liqpay')} /> LiqPay
                </label>
              </div>
            </fieldset>

            {error && <div style={{ color: 'crimson' }}>{error}</div>}

            <div>
              <Button type="submit" variant="primary" disabled={submitting}>{submitting ? 'Надсилання…' : 'Підтвердити замовлення'}</Button>
            </div>
          </form>

          <aside style={{ border: '1px solid #eee', borderRadius: 8, padding: 16, alignSelf: 'start' }}>
            <h3>Ваше замовлення</h3>
            <ul>
              {items.map((it) => (
                <li key={it.productId}>
                  {it.title} × {it.qty} — {it.price * it.qty} ₴
                </li>
              ))}
            </ul>
            <div style={{ marginTop: 8 }}><strong>Разом: {total} ₴</strong></div>
          </aside>
        </div>
      )}
    </div>
  );
}
