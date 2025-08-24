import mongoose, { Schema, models, model } from 'mongoose';

export type CategoryDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  parentId?: mongoose.Types.ObjectId | null;
};

const CategorySchema = new Schema<CategoryDoc>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  parentId: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
});

export const CategoryModel = models.Category || model<CategoryDoc>('Category', CategorySchema);
