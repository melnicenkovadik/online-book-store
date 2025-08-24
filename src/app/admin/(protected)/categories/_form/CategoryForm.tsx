"use client";
import React from 'react';
import { AdminApi } from '@/services/admin';
import type { Category } from '@/types/catalog';

export type CategoryFormProps = {
  mode: 'create' | 'edit';
  initial?: Partial<Category>;
  onSaved?: (c: Category) => void;
};

export default function CategoryForm({ mode, initial, onSaved }: CategoryFormProps) {
  const [name, setName] = React.useState(initial?.name || '');
  const [slug, setSlug] = React.useState(initial?.slug || '');
  const [parentId, setParentId] = React.useState<string | ''>((initial?.parentId as string) || '');
  const [all, setAll] = React.useState<Category[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    AdminApi.listCategories().then(setAll).catch(() => setAll([]));
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<Category> = {
        name: name.trim(),
        slug: slug.trim() || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, ''),
        parentId: parentId || undefined,
      } as any;
      let saved: Category;
      if (mode === 'create') saved = await AdminApi.createCategory(payload);
      else saved = await AdminApi.updateCategory(String(initial?.id), payload);
      onSaved?.(saved);
    } catch (err: any) {
      setError(err?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
      <div>
        <label style={label}>Name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required style={input} />
      </div>
      <div>
        <label style={label}>Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="auto from name" style={input} />
      </div>
      <div>
        <label style={label}>Parent</label>
        <select value={parentId} onChange={(e) => setParentId(e.target.value)} style={input}>
          <option value="">— No parent —</option>
          {all.filter((c) => c.id !== initial?.id).map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {error && <div style={{ color: '#ef4444', fontSize: 12 }}>{error}</div>}

      <div>
        <button type="submit" disabled={saving} style={btnPrimary}>{saving ? 'Saving…' : mode === 'create' ? 'Create' : 'Save changes'}</button>
      </div>
    </form>
  );
}

const label: React.CSSProperties = { display: 'block', fontSize: 12, color: '#6b7280', marginBottom: 6 };
const input: React.CSSProperties = { width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid #e5e7eb' };
const btnPrimary: React.CSSProperties = { padding: '10px 14px', borderRadius: 8, border: '1px solid #111827', background: '#111827', color: 'white', cursor: 'pointer' };
