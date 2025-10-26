import { type Model, model, models, Schema } from "mongoose";
import type { OrderDoc } from "@/types/database";

const OrderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    index: true, // Index for product lookup in orders
  },
  title: { type: String, required: true },
  sku: { type: String },
  image: { type: String },
  basePrice: { type: Number, required: true },
  salePrice: { type: Number },
  price: { type: Number, required: true },
  qty: { type: Number, required: true, min: 1 },
});

const OrderSchema = new Schema<OrderDoc>(
  {
    number: {
      type: String,
      required: true,
      unique: true,
      index: true, // Index for order number lookups
    },
    status: {
      type: String,
      enum: ["new", "processing", "shipped", "completed", "cancelled"],
      default: "new",
      index: true, // Index for status filtering
    },
    customer: {
      fullName: { type: String, required: true },
      email: {
        type: String,
        index: true, // Index for customer email lookups
      },
      phone: { type: String, required: true },
    },
    delivery: {
      carrier: { type: String, enum: ["nova", "ukr"], required: true },
      city: { type: String },
      cityRef: { type: String },
      warehouse: { type: String },
      warehouseRef: { type: String },
      address: { type: String },
    },
    payment: {
      provider: {
        type: String,
        enum: ["fondy", "liqpay", "cod", "card", "requisites"],
        required: true,
      },
      txId: { type: String },
      status: {
        type: String,
        enum: ["pending", "paid", "failed"],
        default: "pending",
      },
    },
    items: [OrderItemSchema],
    totals: {
      items: { type: Number, required: true },
      shipping: { type: Number, default: 0 },
      grand: { type: Number, required: true },
    },
    notes: { type: String },
    ttn: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for date-based queries
    },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  },
);

// Pre-save hook to update timestamps
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// Export model with cached check
export const OrderModel: Model<OrderDoc> = models.Order
  ? (models.Order as Model<OrderDoc>)
  : model<OrderDoc>("Order", OrderSchema);
