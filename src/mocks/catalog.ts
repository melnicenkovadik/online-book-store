import type { Category, Product } from "@/types/catalog";
import type { Paginated } from "@/types/http";

export const categories: Category[] = [
  { id: "c1", name: "Підручники", slug: "pidruchnyky" },
  { id: "c2", name: "1 клас", slug: "1-klas", parentId: "c1" },
  { id: "c3", name: "2 клас", slug: "2-klas", parentId: "c1" },
  { id: "c4", name: "Математика", slug: "matematika" },
  { id: "c5", name: "Українська мова", slug: "ukrainska-mova" },
];

export const products: Product[] = [
  {
    id: "p1",
    title: "Математика 1 клас",
    slug: "matematika-1-klas",
    sku: "MAT-1-2024",
    price: 250,
    salePrice: 220,
    stock: 42,
    images: [
      "https://picsum.photos/seed/math-1-1-1/800/800",
      "https://picsum.photos/seed/math-1-1-2/800/800",
      "https://picsum.photos/seed/math-1-1-3/800/800",
    ],
    attributes: {
      class: "1",
      subject: "math",
      language: "uk",
      year: 2024,
      author: "Іваненко",
      publisher: "Освіта",
      pages: 128,
      coverType: "тверда",
      series: "Нова школа",
      format: "170x240 мм",
      isbn: "978-966-0000001",
      barcode: "2000000000011",
      description:
        "Підручник з математики для 1 класу. Сучасні методики навчання, яскраві ілюстрації, практичні завдання.",
      rating: { value: 4.6, count: 12 },
    },
    categoryIds: ["c1", "c2", "c4"],
  },
  {
    id: "p2",
    title: "Українська мова 2 клас",
    slug: "ukr-mova-2-klas",
    sku: "UKR-2-2024",
    price: 230,
    stock: 10,
    images: [
      "https://picsum.photos/seed/ukr-2-1-1/800/800",
      "https://picsum.photos/seed/ukr-2-1-2/800/800",
      "https://picsum.photos/seed/ukr-2-1-3/800/800",
    ],
    attributes: {
      class: "2",
      subject: "ukr",
      language: "uk",
      year: 2024,
      author: "Петренко",
      publisher: "Школа",
      pages: 144,
      coverType: "м'яка",
      series: "Нова школа",
      format: "170x240 мм",
      isbn: "978-966-0000002",
      barcode: "2000000000028",
      description:
        "Підручник з української мови для 2 класу. Вправи, диктанти та завдання для розвитку мовлення.",
      rating: { value: 4.3, count: 8 },
    },
    categoryIds: ["c1", "c3", "c5"],
  },
];

// Generate more mock products for demo/pagination
(() => {
  const subjects = [
    { key: "math", name: "Математика", catId: "c4" },
    { key: "ukr", name: "Українська мова", catId: "c5" },
  ] as const;
  const baseYear = 2024;
  let counter = 3;
  for (let cls = 1; cls <= 6; cls++) {
    for (const s of subjects) {
      // create 3 variants per class/subject
      for (let v = 1; v <= 3; v++) {
        const id = `p${counter++}`;
        const title = `${s.name} ${cls} клас ${v}`;
        const slug = `${s.key}-${cls}-klas-${v}`;
        const sku = `${s.key.toUpperCase()}-${cls}-${baseYear}-${v}`;
        const price = 180 + cls * 10 + v * 5;
        const salePrice = v % 3 === 0 ? null : price - 15;
        const stock = 5 + ((cls * 7 + v * 3) % 50);
        const images = [
          `https://picsum.photos/seed/${s.key}-${cls}-${v}-1/800/800`,
          `https://picsum.photos/seed/${s.key}-${cls}-${v}-2/800/800`,
          `https://picsum.photos/seed/${s.key}-${cls}-${v}-3/800/800`,
        ];
        const categoryIds = [
          "c1",
          s.catId,
          cls === 1 ? "c2" : cls === 2 ? "c3" : undefined,
        ].filter(Boolean) as string[];
        products.push({
          id,
          title,
          slug,
          sku,
          price,
          salePrice,
          stock,
          images,
          attributes: {
            class: String(cls),
            subject: s.key,
            language: "uk",
            year: baseYear,
            author: cls % 2 ? "Іваненко" : "Петренко",
            publisher: v % 2 ? "Освіта" : "Школа",
            pages: 120 + ((cls * 7 + v * 11) % 40),
            coverType: v % 2 ? "м'яка" : "тверда",
            series: "Шкільна програма",
            format: "170x240 мм",
            isbn: `978-966-${String(cls).padStart(2, "0")}${String(v).padStart(2, "0")}${String(100 + (cls * 10 + v)).slice(-3)}`,
            barcode: `2000000${String(cls).padStart(2, "0")}${String(v).padStart(2, "0")}001`,
            description: `Підручник з ${s.name.toLowerCase()} для ${cls} класу. Містить теорію та вправи для закріплення матеріалу. Варіант ${v}.`,
            rating: {
              value: 4 + ((cls + v) % 10) / 10,
              count: 2 + ((cls * v) % 25),
            },
          },
          categoryIds,
        });
      }
    }
  }
})();

export type ProductFilters = {
  q?: string;
  categoryId?: string;
  page?: number;
  perPage?: number;
  priceMin?: number;
  priceMax?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: "price-asc" | "price-desc" | "title-asc" | "title-desc" | "newest";
};

export function listProducts(filters: ProductFilters = {}): Paginated<Product> {
  const {
    q,
    categoryId,
    page = 1,
    perPage = 12,
    priceMin,
    priceMax,
    inStock,
    onSale,
    sort = "newest",
  } = filters;
  let list = products.slice();
  if (q) {
    const qw = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.title.toLowerCase().includes(qw) ||
        p.attributes.author?.toLowerCase().includes(qw) ||
        p.attributes.publisher?.toLowerCase().includes(qw),
    );
  }
  if (categoryId) {
    list = list.filter((p) => p.categoryIds.includes(categoryId));
  }
  // Price / stock / sale filters
  if (priceMin != null) {
    list = list.filter((p) => (p.salePrice ?? p.price) >= priceMin);
  }
  if (priceMax != null) {
    list = list.filter((p) => (p.salePrice ?? p.price) <= priceMax);
  }
  if (inStock) {
    list = list.filter((p) => p.stock > 0);
  }
  if (onSale) {
    list = list.filter((p) => p.salePrice != null && p.salePrice < p.price);
  }

  // Sorting
  list.sort((a, b) => {
    const pa = a.salePrice ?? a.price;
    const pb = b.salePrice ?? b.price;
    switch (sort) {
      case "price-asc":
        return pa - pb;
      case "price-desc":
        return pb - pa;
      case "title-asc":
        return a.title.localeCompare(b.title);
      case "title-desc":
        return b.title.localeCompare(a.title);
      default:
        // mock: use id to emulate recency
        return b.id.localeCompare(a.id);
    }
  });
  const total = list.length;
  const start = (page - 1) * perPage;
  const items = list.slice(start, start + perPage);
  return { items, page, perPage, total };
}

export function findProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
