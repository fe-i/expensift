import { Schema, model, models, type Document, type Model } from "mongoose";

export interface ILineItem extends Document {
  name: string;
  quantity: number;
  unitPrice: number;
  assignedTo?: string[];
}

const LineItemSchema: Schema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  quantity: { type: Number, required: true, min: 1, max: 1000 },
  unitPrice: { type: Number, required: true, min: 0, max: 10000 },
  assignedTo: { type: [String], default: [] },
});

export interface ISurcharge extends Document {
  description: string;
  type: "fixed" | "percentage";
  value: number;
}

const SurchargeSchema: Schema = new Schema({
  description: { type: String, required: true, maxlength: 100 },
  type: { type: String, enum: ["fixed", "percentage"], required: true },
  value: { type: Number, required: true, min: -10000, max: 10000 },
});

export interface ISplitUser extends Document {
  name: string;
  isPaying?: boolean;
  paid?: boolean;
  assignedItems?: string[];
  subtotal?: number;
  surcharge?: number;
  tax?: number;
  tip?: number;
}

const SplitUserSchema: Schema = new Schema({
  name: { type: String, required: true, maxlength: 50 },
  isPaying: { type: Boolean },
  paid: { type: Boolean },
  assignedItems: { type: [String], default: [] },
  subtotal: { type: Number, min: 0, max: 10000 },
  surcharge: { type: Number, min: -10000, max: 10000 },
  tax: { type: Number, min: 0, max: 10000 },
  tip: { type: Number, min: 0, max: 10000 },
});

export interface IReceipt extends Document {
  merchant: string;
  date: string;
  category: string;
  lineItems: ILineItem[];
  surcharges?: ISurcharge[];
  taxType?: "fixed" | "percentage";
  taxValue?: number;
  tipType?: "fixed" | "percentage";
  tipValue?: number;
  splitMode?: "simple" | "advanced";
  splitUsers?: ISplitUser[];
  userId: string;
}

const ReceiptSchema: Schema = new Schema({
  merchant: { type: String, required: true, maxlength: 50 },
  date: { type: String, required: true },
  category: { type: String, required: true, maxlength: 50 },
  lineItems: {
    type: [LineItemSchema],
    validate: {
      validator: (val: unknown[]) =>
        Array.isArray(val) && val.length >= 1 && val.length <= 500,
    },
  },
  surcharges: {
    type: [SurchargeSchema],
    validate: {
      validator: (val: unknown[]) =>
        !val || (Array.isArray(val) && val.length <= 5),
    },
  },
  taxType: { type: String, enum: ["fixed", "percentage"] },
  taxValue: { type: Number, min: 0, max: 10000 },
  tipType: { type: String, enum: ["fixed", "percentage"] },
  tipValue: { type: Number, min: 0, max: 10000 },
  splitMode: { type: String, enum: ["simple", "advanced"] },
  splitUsers: {
    type: [SplitUserSchema],
    validate: {
      validator: (val: unknown[]) =>
        !val || (Array.isArray(val) && val.length <= 20),
    },
  },
  userId: { type: String, required: true },
});

export const Receipt: Model<IReceipt> =
  models.Receipt ?? model<IReceipt>("Receipt", ReceiptSchema);
