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
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true, // Index for status filtering
    },
    customer: {
      name: { type: String, required: true },
      email: {
        type: String,
        required: true,
        index: true, // Index for customer email lookups
      },
      phone: { type: String, required: true },
    },
    shipping: {
      address: { type: String },
      city: { type: String },
      postalCode: { type: String },
      country: { type: String, default: "Ukraine" },
    },
    payment: {
      method: { type: String, default: "cod" }, // Cash on delivery
      transactionId: { type: String },
      status: { type: String, default: "pending" },
    },
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping_fee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    notes: { type: String },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true, // Index for date-based queries
    },
    updatedAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    // Create compound indexes for common query patterns
    indexes: [
      // Compound index for customer + date (for customer order history)
      { "customer.email": 1, createdAt: -1 },
      // Compound index for status + date (for order management)
      { status: 1, createdAt: -1 },
      // Index for total amount (for financial reports)
      { total: 1 },
    ],
  },
);

// Pre-save hook to update timestamps
OrderSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

export const OrderModel: Model<OrderDoc> =
  (models.Order as Model<OrderDoc>) || model<OrderDoc>("Order", OrderSchema);
