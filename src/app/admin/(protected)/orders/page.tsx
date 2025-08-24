"use client";
import React from 'react';
import Link from 'next/link';
import { useAdminOrdersList } from '@/services/admin';

export default function AdminOrdersPage() {
  const [q, setQ] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [page, setPage] = React.useState(1);
  const perPage = 10;
  const { data, isLoading } = useAdminOrdersList({ q, status, page, perPage });

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Замовлення</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
          placeholder="Пошук за номером, ПІБ, телефоном"
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', width: 320 }}
        />
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
          style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb' }}
        >
          <option value="">Усі статуси</option>
          <option value="new">Нове</option>
          <option value="processing">В обробці</option>
          <option value="shipped">Відправлено</option>
          <option value="completed">Завершено</option>
          <option value="cancelled">Скасовано</option>
        </select>
      </div>

      {isLoading && <div>Завантаження…</div>}
      {!isLoading && data && (
        <div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>№</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>Клієнт</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>Телефон</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>Сума</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>Статус</th>
                <th style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb', padding: '8px 4px' }}>Створено</th>
                <th style={{ borderBottom: '1px solid #e5e7eb' }}></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((o: any) => (
                <tr key={o.id}>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>#{o.number}</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>{o.customer.fullName}</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>{o.customer.phone}</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>{o.totals.grand.toFixed(2)} грн</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>{
                    ({ new: 'Нове', processing: 'В обробці', shipped: 'Відправлено', completed: 'Завершено', cancelled: 'Скасовано' } as Record<string, string>)[o.status] || o.status
                  }</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>{new Date(o.createdAt).toLocaleString()}</td>
                  <td style={{ padding: '8px 4px', borderBottom: '1px solid #f3f4f6' }}>
                    <Link href={`/admin/orders/${o.id}`}>Відкрити</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center' }}>
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
            >
              Назад
            </button>
            <div>
              Сторінка {data.page} з {Math.max(1, Math.ceil(data.total / data.perPage))}
            </div>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.items.length < data.perPage}
              style={{ padding: '6px 10px', border: '1px solid #e5e7eb', borderRadius: 6, background: '#fff' }}
            >
              Далі
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
