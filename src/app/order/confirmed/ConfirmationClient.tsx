"use client";

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/uikit';

export default function ConfirmationClient() {
  const sp = useSearchParams();
  const number = sp.get('number');
  const [summary, setSummary] = React.useState<{ totals: { grand: number }; payment: { provider: string } } | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!number) return;
    let ignore = false;
    setLoading(true);
    fetch(`/api/orders/${number}`)
      .then(async (r) => {
        if (!r.ok) throw new Error('Failed to load order');
        return r.json();
      })
      .then((data) => {
        if (!ignore) setSummary(data);
      })
      .catch((e: any) => !ignore && setError(e?.message || 'Error'))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [number]);

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', textAlign: 'center' }}>
      <h1>Дякуємо за замовлення!</h1>
      {number ? (
        <p>Номер вашого замовлення: <strong>{number}</strong></p>
      ) : (
        <p>Замовлення створено.</p>
      )}
      <p>Ми зв'яжемося з вами для підтвердження та відправки.</p>

      {number && (
        <section style={{ marginTop: 16, textAlign: 'left', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
          <h3 style={{ marginTop: 0 }}>Реквізити для оплати</h3>
          {loading && <div>Завантаження…</div>}
          {error && <div style={{ color: '#ef4444' }}>{error}</div>}
          {!!summary && (
            <div style={{ display: 'grid', gap: 6 }}>
              <div><strong>Отримувач:</strong> {process.env.NEXT_PUBLIC_PAYEE_NAME || 'Ваше підприємство'}</div>
              <div><strong>IBAN:</strong> {process.env.NEXT_PUBLIC_IBAN || 'UAxx xxxx xxxx xxxx xxxx xxxx xxx'}</div>
              <div><strong>Банк:</strong> {process.env.NEXT_PUBLIC_BANK_NAME || ''}</div>
              {process.env.NEXT_PUBLIC_EDRPOU && <div><strong>ЄДРПОУ:</strong> {process.env.NEXT_PUBLIC_EDRPOU}</div>}
              <div><strong>Сума до сплати:</strong> {summary.totals.grand.toFixed(2)} грн</div>
              <div><strong>Призначення платежу:</strong> {(process.env.NEXT_PUBLIC_PAYMENT_PURPOSE || 'Оплата замовлення {number}').replace('{number}', number)}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>Будь ласка, вкажіть номер замовлення у призначенні платежу.</div>
            </div>
          )}
        </section>
      )}
      <div style={{ marginTop: 16 }}>
        <Link href="/catalog"><Button variant="primary">Повернутись до каталогу</Button></Link>
      </div>
    </div>
  );
}
