import React from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
  const hasSession = (await cookies()).get('admin_session')?.value === '1';
  if (!hasSession) {
    redirect('/admin/login');
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', minHeight: '100vh' }}>
      <aside style={{ borderRight: '1px solid #e5e7eb', padding: 16 }}>
        <h2 style={{ marginTop: 0 }}>Адмін</h2>
        <nav style={{ display: 'grid', gap: 8 }}>
          <Link href="/admin">Панель керування</Link>
          <Link href="/admin/products">Товари</Link>
          <Link href="/admin/categories">Категорії</Link>
          <Link href="/admin/orders">Замовлення</Link>
          <Link href="/admin/media">Медіа</Link>
          <Link href="/admin/settings">Налаштування</Link>
        </nav>
        <form action="/api/admin/logout" method="post" style={{ marginTop: 16 }}>
          <button type="submit" style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer' }}>Вийти</button>
        </form>
      </aside>
      <main style={{ padding: 24 }}>{children}</main>
    </div>
  );
}
