import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  Book,
  Car,
  Gift,
  HeartPulse,
  Home,
  Lightbulb,
  Package,
  PiggyBank,
  Plane,
  ShoppingBag,
  Shield,
  Ticket,
  UtensilsCrossed,
} from "lucide-react";
import { type ComponentType } from "react";
import type { zodReceiptSchema } from "@/lib/zod";
import { z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Categories = [
  "Education",
  "Entertainment",
  "Food & Drink",
  "Gifts",
  "Health",
  "Housing",
  "Insurance",
  "Savings",
  "Shopping",
  "Transport",
  "Travel",
  "Utilities",
  "Miscellaneous",
] as const;

export const categoryIcons: Record<
  string,
  ComponentType<{ className?: string }>
> = {
  Education: Book,
  Entertainment: Ticket,
  "Food & Drink": UtensilsCrossed,
  Gifts: Gift,
  Health: HeartPulse,
  Housing: Home,
  Insurance: Shield,
  Savings: PiggyBank,
  Shopping: ShoppingBag,
  Transport: Car,
  Travel: Plane,
  Utilities: Lightbulb,
  Miscellaneous: Package,
};

export function calculateTotal(
  receipt: z.infer<typeof zodReceiptSchema>,
): number {
  const lineItemsTotal = receipt.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  );

  const surchargesTotal = (receipt.surcharges ?? []).reduce(
    (sum, surcharge) => sum + surcharge.amount,
    0,
  );

  const subtotal = lineItemsTotal + surchargesTotal;

  const taxTotal =
    receipt.taxType === "fixed"
      ? (receipt.taxValue ?? 0)
      : receipt.taxType === "percentage"
        ? subtotal * ((receipt.taxValue ?? 0) / 100)
        : 0;

  const tipTotal =
    receipt.tipType === "fixed"
      ? (receipt.tipValue ?? 0)
      : receipt.tipType === "percentage"
        ? subtotal * ((receipt.tipValue ?? 0) / 100)
        : 0;

  return subtotal + taxTotal + tipTotal;
}
