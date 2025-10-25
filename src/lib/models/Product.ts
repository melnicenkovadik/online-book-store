import { type Model, model, models, Schema } from "mongoose";
import type { ProductDoc } from "@/types/database";

const ProductSchema = new Schema<ProductDoc>(
  {
    title: { type: String, required: true },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    sku: {
      type: String,
      required: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      index: true, // Index for price-based queries and sorting
    },
    salePrice: {
      type: Number,
      default: null,
      index: true, // Index for sale price filtering
    },
    stock: {
      type: Number,
      default: 0,
      index: true, // Index for stock filtering (in stock)
    },
    images: { type: [String], default: [] },
    attributes: {
      type: Schema.Types.Mixed,
      default: {},
    },
    categoryIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
        index: true, // Index for category filtering
      },
    ],
  },
  {
    timestamps: true, // Add createdAt and updatedAt timestamps
    // Create compound indexes for common query patterns
    indexes: [
      // Compound index for category + price sorting (common filter scenario)
      { categoryIds: 1, price: 1 },
      // Compound index for in-stock + price sorting
      { stock: 1, price: 1 },
      // Compound index for sale items + price sorting
      { salePrice: 1, price: 1 },
      // Text index for search functionality
      { title: "text", "attributes.description": "text" },
    ],
  },
);

export const ProductModel: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ||
  model<ProductDoc>("Product", ProductSchema);
