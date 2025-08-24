export type Category = {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
};

export type ProductAttributes = {
  class?: string; // класс (класс обучения)
  subject?: string; // предмет
  language?: string;
  type?: string; // тип/жанр
  year?: number;
  author?: string;
  publisher?: string;
  pages?: number;
  coverType?: string; // обложка: мягкая/твердая
  series?: string;
  format?: string; // размеры, напр. 145x200 мм
  isbn?: string;
  barcode?: string;
  description?: string;
  rating?: { value: number; count: number };
};

export type Product = {
  id: string;
  title: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images: string[];
  attributes: ProductAttributes;
  categoryIds: string[];
};

export type Paginated<T> = {
  items: T[];
  page: number;
  perPage: number;
  total: number;
};
