import type { Metadata } from "next";
import { Suspense } from "react";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import CatalogClient from "./CatalogClient";

export const revalidate = 3600; // Revalidate this page every hour

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Каталог книг | Онлайн-магазин книг",
    description:
      "Широкий вибір книг різних жанрів та авторів. Знайдіть свою наступну улюблену книгу!",
  };
}

async function getInitialProductsCount() {
  try {
    await connectToDB();
    return await ProductModel.countDocuments();
  } catch (error) {
    console.error("Failed to fetch initial products count:", error);
    return 0;
  }
}

export default async function CatalogPage() {
  // Prefetch initial data for better SEO and performance
  const initialProductsCount = await getInitialProductsCount();

  return (
    <div>
      <Suspense fallback={<div>Завантаження каталогу...</div>}>
        <CatalogClient />
      </Suspense>
      {/* This hidden div helps with SEO by providing initial data */}
      <div
        style={{ display: "none" }}
        data-total-products={initialProductsCount}
      >
        Наш каталог містить {initialProductsCount} книг для вашого вибору.
      </div>
    </div>
  );
}
