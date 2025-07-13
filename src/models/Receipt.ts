import {
  UtensilsCrossed,
  Car,
  Lightbulb,
  Ticket,
  ShoppingBag,
  Plane,
  Package,
  PiggyBank,
} from "lucide-react";

// Receipt model definition
import { Schema, model, models, type Document, type Model } from "mongoose";
import type React from "react";

export interface ILineItem extends Document {
  name: string;
  quantity: number;
  price: number;
  assignedTo?: string[];
}

const LineItemSchema: Schema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  assignedTo: [{ type: String }],
});

export interface IExtras extends Document {
  description: string;
  type: "fixed" | "percentage";
  amount: number;
}

const ExtrasSchema: Schema = new Schema({
  description: { type: String, required: true },
  type: { type: String, enum: ["fixed", "percentage"], required: true },
  amount: { type: Number, required: true },
});

export interface ISplitUser extends Document {
  name: string;
  isPaying?: boolean;
  paid?: boolean;
  assignedItems?: string[];
  subtotal?: number;
  extras?: number;
  tax?: number;
  tip?: number;
}

const SplitUserSchema: Schema = new Schema({
  name: { type: String, required: true },
  isPaying: { type: Boolean },
  paid: { type: Boolean },
  assignedItems: [{ type: String }],
  subtotal: { type: Number },
  extras: { type: Number },
  tax: { type: Number },
  tip: { type: Number },
});

export interface IReceipt extends Document {
  vendor: string;
  date: Date;
  category: string;
  lineItems: ILineItem[];
  extras?: IExtras[];
  taxType?: "fixed" | "percentage";
  taxAmount?: number;
  tipType?: "fixed" | "percentage";
  tipAmount?: number;
  splitMode?: "simple" | "advanced";
  splitUsers?: ISplitUser[];
  user: string;
}

const ReceiptSchema: Schema = new Schema({
  vendor: { type: String, required: true },
  date: { type: Date, required: true },
  category: { type: String, required: true },
  lineItems: [LineItemSchema],
  extras: [ExtrasSchema],
  taxType: { type: String, enum: ["fixed", "percentage"] },
  taxAmount: { type: Number },
  tipType: { type: String, enum: ["fixed", "percentage"] },
  tipAmount: { type: Number },
  splitMode: { type: String, enum: ["simple", "advanced"] },
  splitUsers: [SplitUserSchema],
  user: { type: String, required: true },
});

export const Receipt: Model<IReceipt> =
  models.Receipt ?? model<IReceipt>("Receipt", ReceiptSchema);

// Expense categories and icons
export const ExpenseCategories = [
  "Food",
  "Transport",
  "Utilities",
  "Entertainment",
  "Shopping",
  "Travel",
  "Savings",
  "Miscellaneous",
] as const;

export const categoryIcons: Record<string, React.FC<{ className?: string }>> = {
  Food: UtensilsCrossed,
  Transport: Car,
  Utilities: Lightbulb,
  Entertainment: Ticket,
  Shopping: ShoppingBag,
  Travel: Plane,
  Savings: PiggyBank,
  Miscellaneous: Package,
};
