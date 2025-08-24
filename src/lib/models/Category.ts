import { type Model, model, models, Schema } from "mongoose";
import type { CategoryDoc } from "@/types/database";

const CategorySchema = new Schema<CategoryDoc>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: "Category", default: null },
});

export const CategoryModel: Model<CategoryDoc> =
  (models.Category as Model<CategoryDoc>) ||
  model<CategoryDoc>("Category", CategorySchema);
