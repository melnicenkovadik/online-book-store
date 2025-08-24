"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CategoryForm from '../_form/CategoryForm';
import type { Category } from '@/types/catalog';

export default function AdminCategoryCreatePage() {
  const router = useRouter();
  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>New category</h1>
      <CategoryForm
        mode="create"
        onSaved={(c: Category) => router.push(`/admin/categories/${c.id}`)}
      />
    </div>
  );
}
