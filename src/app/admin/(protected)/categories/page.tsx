"use client";
import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { AdminApi } from '@/services/admin';
import type { Category } from '@/types/catalog';

export default function AdminCategoriesListPage() {
  const { data, mutate, isLoading } = useSWR('admin/categories', () => AdminApi.listCategories());

  const onDelete = async (id: string) => {
    if (!confirm('Delete category?')) return;
    await AdminApi.deleteCategory(id);
    mutate();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1 style={{ margin: 0 }}>Categories</h1>
        <Link href="/admin/categories/new" style={{ padding: '8px 12px', border: '1px solid #e5e7eb', borderRadius: 8 }}>New category</Link>
      </div>

      <div style={{ border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f9fafb' }}>
              <th style={th}>Name</th>
              <th style={th}>Slug</th>
              <th style={th}>Parent</th>
              <th style={th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (<tr><td colSpan={4} style={{ padding: 16 }}>Loading…</td></tr>)}
            {data?.map((c: Category) => (
              <tr key={c.id}>
                <td style={td}>{c.name}</td>
                <td style={td}>{c.slug}</td>
                <td style={td}>{data.find((p: Category) => p.id === c.parentId)?.name || '—'}</td>
                <td style={td}>
                  <Link href={`/admin/categories/${c.id}`} style={{ marginRight: 8 }}>Edit</Link>
                  <button onClick={() => onDelete(c.id)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px' }}>Delete</button>
                </td>
              </tr>
            ))}
            {!isLoading && data?.length === 0 && (<tr><td colSpan={4} style={{ padding: 16, color: '#6b7280' }}>No categories</td></tr>)}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: 'left', padding: 12, borderBottom: '1px solid #e5e7eb', fontWeight: 600, fontSize: 12, color: '#6b7280' };
const td: React.CSSProperties = { padding: 12, borderBottom: '1px solid #f3f4f6' };
