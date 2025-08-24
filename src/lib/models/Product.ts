import mongoose, { Schema, models, model } from 'mongoose';

export type ProductDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  sku: string;
  price: number;
  salePrice?: number | null;
  stock: number;
  images: string[];
  attributes: Record<string, any>;
  categoryIds: mongoose.Types.ObjectId[];
};

const ProductSchema = new Schema<ProductDoc>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  attributes: { type: Schema.Types.Mixed, default: {} },
  categoryIds: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
});

export const ProductModel = models.Product || model<ProductDoc>('Product', ProductSchema);
