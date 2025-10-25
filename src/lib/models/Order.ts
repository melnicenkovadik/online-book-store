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
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
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
      cityRef: { type: String },
      warehouseRef: { type: String },
      address: { type: String },
    },
    payment: {
      provider: {
        type: String,
        enum: ["fondy", "liqpay", "cod"],
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

export const OrderModel: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) || model<OrderDoc>("Order", OrderSchema);
