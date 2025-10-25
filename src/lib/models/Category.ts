import { type Model, model, models, Schema } from "mongoose";
import type { CategoryDoc } from "@/types/database";

const CategorySchema = new Schema<CategoryDoc>(
  {
    name: {
      type: String,
      required: true,
      index: true, // Index for name searches
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for lookups by slug
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
      index: true, // Index for hierarchical queries
    },
    order: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true, // Index for filtering active categories
    },
  },
  {
    timestamps: true, // Add createdAt and updatedAt timestamps
  },
);

export const CategoryModel: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ||
  model<CategoryDoc>("Category", CategorySchema);
