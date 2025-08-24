"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { AdminApi } from "@/services/admin";
import type { Product } from "@/types/catalog";
import ProductForm from "../_form/ProductForm";

export default function AdminProductEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const { data, isLoading } = useSWR(id ? ["admin/product", id] : null, () =>
    AdminApi.getProduct(id),
  );

  if (isLoading) return <div>Завантаження…</div>;
  if (!data) return <div>Не знайдено</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>Редагувати товар</h1>
      <ProductForm
        mode="edit"
        initial={data as Product}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
