"use client";

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/uikit';
import { useCart } from '@/store/cart';

export default function CartPage() {
  const cart = useCart();
  const items = React.useMemo(() => Object.values(cart.items), [cart.items]);
  const total = cart.subtotal();

  return (
    <div style={{ padding: 24, maxWidth: 900, margin: '0 auto' }}>
      <h1>Кошик</h1>

      {items.length === 0 ? (
        <div>
          <p>Кошик порожній.</p>
          <Link href="/catalog">Повернутись до каталогу</Link>
        </div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Товар</th>
                <th>Ціна</th>
                <th>К-сть</th>
                <th>Сума</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => {
                const price = it.price;
                return (
                  <tr key={it.productId} style={{ borderTop: '1px solid #eee' }}>
                    <td>
                      {it.slug ? (
                        <Link href={`/product/${it.slug}`}>{it.title}</Link>
                      ) : (
                        <span>{it.title}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{price} ₴</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        min={0}
                        value={it.qty}
                        onChange={(e) => {
                          const qty = Number(e.target.value);
                          cart.setQty(it.productId, qty);
                        }}
                        style={{ width: 64 }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>{price * it.qty} ₴</td>
                    <td style={{ textAlign: 'right' }}>
                      <Button variant="ghost" onClick={() => cart.remove(it.productId)}>Видалити</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
            <Link href="/catalog">← Продовжити покупки</Link>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div><strong>Разом: {total} ₴</strong></div>
              <Link href="/checkout"><Button variant="primary">Оформити</Button></Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
