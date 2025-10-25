import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import ProductClient from "./ProductClient";

export const revalidate = 3600; // Revalidate every hour (ISR)

interface ProductPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const product = await getProduct(slug);
    if (!product) {
      return {
        title: "Товар не знайдено | Онлайн-магазин книг",
      };
    }

    const description = product.attributes?.description
      ? String(product.attributes.description)
      : `Купити ${product.title} в нашому інтернет-магазині книг`;

    return {
      title: `${product.title} | Онлайн-магазин книг`,
      description,
      openGraph: {
        images: product.images?.[0] ? [product.images[0]] : [],
      },
    };
  } catch (error) {
    console.error("Error generating metadata:", error);
    return {
      title: "Книга | Онлайн-магазин книг",
    };
  }
}

async function getProduct(slug: string) {
  try {
    await connectToDB();
    const doc = await ProductModel.findOne({ slug }).exec();

    if (!doc) return null;

    return {
      id: doc._id.toString(),
      title: doc.title,
      slug: doc.slug,
      sku: doc.sku,
      price: doc.price,
      salePrice: doc.salePrice ?? null,
      stock: doc.stock,
      images: doc.images ?? [],
      attributes: doc.attributes ?? {},
      categoryIds: (doc.categoryIds ?? []).map((cid) => cid.toString()),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return null;
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  return <ProductClient initialProduct={product} />;
}
