"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '../_form/ProductForm';
import type { Product } from '@/types/catalog';

export default function AdminProductCreatePage() {
  const router = useRouter();
  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>Новий товар</h1>
      <ProductForm
        mode="create"
        onSaved={(p: Product) => router.push(`/admin/products/${p.id}`)}
      />
    </div>
  );
}
