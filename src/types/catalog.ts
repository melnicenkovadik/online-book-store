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
  publisherCode?: string; // видавничий код / внутренний код
  pages?: number;
  coverType?: string; // обложка: мягкая/твердая
  series?: string;
  format?: string; // размеры, напр. 145x200 мм
  color?: string;
  model?: string;
  isbn?: string;
  barcode?: string;
  description?: string;
  rating?: { value: number; count: number };
  source?: {
    vendor?: string;
    url?: string;
    externalId?: string;
  };
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
