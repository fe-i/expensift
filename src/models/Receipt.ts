import { Schema, model, models, type Document, type Model } from "mongoose";

export interface ILineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  assignedTo?: string[];
}

export interface ISurcharge {
  description: string;
  type: "fixed" | "percentage";
  value: number;
}

export interface ISplit {
  name: string;
  isPaying: boolean;
  paid: boolean;
}

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
  splits?: ISplit[];
  userId: string;
}

const LineItemSchema: Schema = new Schema({
  name: { type: String, required: true, maxlength: 100 },
  quantity: { type: Number, required: true, min: 1, max: 1000 },
  unitPrice: { type: Number, required: true, min: 0.01, max: 10000 },
  assignedTo: { type: [String], default: [] },
});

const SurchargeSchema: Schema = new Schema({
  description: { type: String, required: true, maxlength: 100 },
  type: { type: String, enum: ["fixed", "percentage"], required: true },
  value: { type: Number, required: true, min: -10000, max: 10000 },
});

const SplitSchema: Schema = new Schema({
  name: { type: String, required: true, maxlength: 50 },
  isPaying: { type: Boolean, required: true },
  paid: { type: Boolean, required: true },
});

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
    default: [],
    validate: {
      validator: (val: unknown[]) =>
        !val || (Array.isArray(val) && val.length <= 5),
    },
  },
  taxType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
  taxValue: { type: Number, min: 0, max: 10000, default: 0 },
  tipType: { type: String, enum: ["fixed", "percentage"], default: "fixed" },
  tipValue: { type: Number, min: 0, max: 10000, default: 0 },
  splitMode: { type: String, enum: ["simple", "advanced"], default: "simple" },
  splits: {
    type: [SplitSchema],
    default: [],
    validate: {
      validator: (val: unknown[]) =>
        !val || (Array.isArray(val) && val.length <= 20),
    },
  },
  userId: { type: String, required: true },
});

export const Receipt: Model<IReceipt> =
  models.Receipt ?? model<IReceipt>("Receipt", ReceiptSchema);
