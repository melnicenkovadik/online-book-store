import { type Model, model, models, Schema } from "mongoose";
import type { ProductDoc } from "@/types/database";

const ProductSchema = new Schema<ProductDoc>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  sku: { type: String, required: true, index: true },
  price: { type: Number, required: true },
  salePrice: { type: Number, default: null },
  stock: { type: Number, default: 0 },
  images: { type: [String], default: [] },
  attributes: { type: Schema.Types.Mixed, default: {} },
  categoryIds: [{ type: Schema.Types.ObjectId, ref: "Category" }],
});

export const ProductModel: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ||
  model<ProductDoc>("Product", ProductSchema);
