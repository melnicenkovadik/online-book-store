import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/uikit";
import { connectToDB } from "@/lib/db";
import { ProductModel } from "@/lib/models/Product";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Онлайн-магазин книг - Головна сторінка",
  description:
    "Ласкаво просимо до нашого онлайн-магазину книг. Широкий вибір книг для всіх вікових категорій.",
};

// Revalidate this page every 12 hours
export const revalidate = 43200;

async function getFeaturedProducts() {
  try {
    await connectToDB();
    // Fetch a few featured products (with sale price or newest)
    const products = await ProductModel.find({
      $or: [{ salePrice: { $ne: null } }, { stock: { $gt: 0 } }],
    })
      .sort({ _id: -1 }) // newest first
      .limit(4)
      .exec();

    return products.map((p) => ({
      id: p._id.toString(),
      title: p.title,
      slug: p.slug,
      price: p.price,
      salePrice: p.salePrice,
      images: p.images || [],
    }));
  } catch (error) {
    console.error("Failed to fetch featured products:", error);
    return [];
  }
}

export default async function Home() {
  const featuredProducts = await getFeaturedProducts();

  return (
    <>
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.title}>
            Знайдіть свою наступну улюблену книгу
          </h1>
          <p className={styles.description}>
            Широкий вибір книг різних жанрів та авторів для всіх вікових
            категорій
          </p>
          <div className={styles.actions}>
            <Link href="/catalog" passHref>
              <Button variant="primary" size="lg">
                Перейти до каталогу
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={styles.featured}>
        <h2 className={styles.sectionTitle}>Рекомендовані книги</h2>
        <div className={styles.featuredGrid}>
          {featuredProducts.map((product) => (
            <Link
              href={`/product/${product.slug}`}
              key={product.id}
              className={styles.productCard}
            >
              <div className={styles.productImage}>
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    width={200}
                    height={300}
                    style={{ objectFit: "contain" }}
                    sizes="(max-width: 768px) 100vw, 200px"
                  />
                ) : (
                  <div className={styles.noImage}>Немає зображення</div>
                )}
              </div>
              <h3 className={styles.productTitle}>{product.title}</h3>
              <div className={styles.productPrice}>
                {product.salePrice ? (
                  <>
                    <span className={styles.salePrice}>
                      {product.salePrice} ₴
                    </span>
                    <span className={styles.oldPrice}>{product.price} ₴</span>
                  </>
                ) : (
                  <span>{product.price} ₴</span>
                )}
              </div>
            </Link>
          ))}
        </div>
        <div className={styles.viewAll}>
          <Link href="/catalog" passHref>
            <Button variant="secondary">Переглянути всі книги</Button>
          </Link>
        </div>
      </section>

      <section className={styles.categories}>
        <h2 className={styles.sectionTitle}>Популярні категорії</h2>
        <div className={styles.categoryGrid}>
          <Link
            href="/catalog?categoryId=fiction"
            className={styles.categoryCard}
          >
            <h3>Художня література</h3>
          </Link>
          <Link
            href="/catalog?categoryId=nonfiction"
            className={styles.categoryCard}
          >
            <h3>Нехудожня література</h3>
          </Link>
          <Link
            href="/catalog?categoryId=children"
            className={styles.categoryCard}
          >
            <h3>Дитяча література</h3>
          </Link>
          <Link
            href="/catalog?categoryId=education"
            className={styles.categoryCard}
          >
            <h3>Навчальна література</h3>
          </Link>
        </div>
      </section>
    </>
  );
}
