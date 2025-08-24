"use client";

import React from 'react';

export default function AdminSettingsPage() {
  const [status, setStatus] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);

  async function seed() {
    setLoading(true);
    setStatus(null);
    try {
      const res = await fetch('/api/admin/dev/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Seed failed');
      }
      setStatus(`OK: categories=${data.categories}, products=${data.products}, upserts=${data.upserts}`);
    } catch (e: any) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <h1>Налаштування</h1>

      <section style={{ marginTop: 16 }}>
        <h3>Дані для демо</h3>
        <p>Імпорт категорій та товарів з моків у базу даних.</p>
        <button onClick={seed} disabled={loading} style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8, cursor: 'pointer' }}>
          {loading ? 'Імпорт...' : 'Засіяти базу (категорії + товари)'}
        </button>
        {status && <div style={{ marginTop: 8 }}>{status}</div>}
      </section>
    </div>
  );
}
