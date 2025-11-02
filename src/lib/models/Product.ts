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
  },
);

// Create text index for full-text search on title and other searchable fields
// Weights: title is most important, then author/publisher, then description
ProductSchema.index(
  {
    title: "text",
    sku: "text",
    "attributes.author": "text",
    "attributes.publisher": "text",
    "attributes.description": "text",
  },
  {
    weights: {
      title: 10,
      sku: 8,
      "attributes.author": 5,
      "attributes.publisher": 3,
      "attributes.description": 1,
    },
    name: "product_text_search",
  },
);

export const ProductModel: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ||
  model<ProductDoc>("Product", ProductSchema);
