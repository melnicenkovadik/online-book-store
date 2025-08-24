import mongoose, { Schema, models, model } from 'mongoose';

export type OrderItemDoc = {
  productId: mongoose.Types.ObjectId;
  qty: number;
  // Snapshot of product data at the time of purchase
  title: string;
  sku?: string;
  image?: string;
  basePrice: number; // original price at the time of purchase
  salePrice?: number | null; // sale price at the time of purchase
  price: number; // final unit price used to compute totals (salePrice ?? basePrice)
};

export type OrderDoc = {
  _id: mongoose.Types.ObjectId;
  number: string;
  items: OrderItemDoc[];
  customer: {
    fullName: string;
    phone: string;
    email?: string;
  };
  delivery: {
    carrier: 'nova' | 'ukr';
    cityRef?: string;
    warehouseRef?: string;
    address?: string;
  };
  totals: {
    items: number;
    shipping: number;
    grand: number;
  };
  payment: {
    provider: 'fondy' | 'liqpay' | 'cod';
    status: 'pending' | 'paid' | 'failed';
    txId?: string;
  };
  ttn?: string;
  status: 'new' | 'processing' | 'shipped' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
};

const OrderItemSchema = new Schema<OrderItemDoc>({
  productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  qty: { type: Number, required: true, min: 1 },
  title: { type: String, required: true },
  sku: { type: String },
  image: { type: String },
  basePrice: { type: Number, required: true, min: 0 },
  salePrice: { type: Number },
  price: { type: Number, required: true, min: 0 },
});

const OrderSchema = new Schema<OrderDoc>({
  number: { type: String, required: true, unique: true, index: true },
  items: { type: [OrderItemSchema], required: true },
  customer: {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
  },
  delivery: {
    carrier: { type: String, enum: ['nova', 'ukr'], required: true },
    cityRef: { type: String },
    warehouseRef: { type: String },
    address: { type: String },
  },
  totals: {
    items: { type: Number, required: true },
    shipping: { type: Number, required: true },
    grand: { type: Number, required: true },
  },
  payment: {
    provider: { type: String, enum: ['fondy', 'liqpay', 'cod'], required: true },
    status: { type: String, enum: ['pending', 'paid', 'failed'], required: true },
    txId: { type: String },
  },
  ttn: { type: String },
  status: { type: String, enum: ['new', 'processing', 'shipped', 'completed', 'cancelled'], default: 'new', index: true },
}, { timestamps: true });

OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'customer.email': 1 });
OrderSchema.index({ 'customer.phone': 1 });

export const OrderModel = models.Order || model<OrderDoc>('Order', OrderSchema);
