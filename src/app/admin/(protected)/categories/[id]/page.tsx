"use client";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { AdminApi } from "@/services/admin";
import type { Category } from "@/types/catalog";
import CategoryForm from "../_form/CategoryForm";

export default function AdminCategoryEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const { data, isLoading } = useSWR(id ? ["admin/category", id] : null, () =>
    AdminApi.getCategory(id),
  );

  if (isLoading) return <div>Loading…</div>;
  if (!data) return <div>Not found</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0, marginBottom: 16 }}>Edit category</h1>
      <CategoryForm
        mode="edit"
        initial={data as Category}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
