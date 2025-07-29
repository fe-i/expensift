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
  type LucideProps,
} from "lucide-react";
import type { LineItem, ReceiptInput, Surcharge } from "@/lib/types";
import currency from "currency.js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const CATEGORIES = [
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

export const CATEGORY_ICONS: Record<
  string,
  React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >
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
  default: Package,
};

export const CATEGORY_COLORS: Record<string, string> = {
  Education: "#4CAF50",
  Entertainment: "#FF9800",
  "Food & Drink": "#D32F2F",
  Gifts: "#9C27B0",
  Health: "#2196F3",
  Housing: "#3F51B5",
  Insurance: "#00BCD4",
  Savings: "#8BC34A",
  Shopping: "#FFC107",
  Transport: "#FF7043",
  Travel: "#009688",
  Utilities: "#795548",
  Miscellaneous: "#6E6E6E",
};

function getLineItemsTotal(lineItems: LineItem[] = []) {
  return lineItems.reduce(
    (sum, item) =>
      currency(sum).add(currency(item.unitPrice).multiply(item.quantity)).value,
    0,
  );
}

function getSurchargesTotal(base: number, surcharges?: Surcharge[]) {
  let fixed = 0,
    percent = 0;
  (surcharges ?? []).forEach((s) => {
    if (s.type === "fixed") fixed += s.value;
    else if (s.type === "percentage") percent += s.value;
  });
  return currency(fixed).add(currency(base).multiply(percent / 100)).value;
}

function getPercentOrFixedTotal(base: number, type?: string, value?: number) {
  if (type === "fixed") return value ?? 0;
  if (type === "percentage")
    return currency(base).multiply((value ?? 0) / 100).value;
  return 0;
}

export function calculateTotal(receipt: ReceiptInput): number {
  if (!receipt?.lineItems || receipt.lineItems.length === 0) return 0;
  const lineItemsTotal = getLineItemsTotal(receipt.lineItems);
  const surchargesTotal = getSurchargesTotal(
    lineItemsTotal,
    receipt.surcharges,
  );
  const taxableTotal = currency(lineItemsTotal).add(surchargesTotal).value;
  const taxTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.taxType,
    receipt.taxValue,
  );
  const tipTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.tipType,
    receipt.tipValue,
  );
  return currency(taxableTotal).add(taxTotal).add(tipTotal).value;
}

export function splitEvenly(receipt: ReceiptInput): {
  name: string;
  breakdown: {
    subtotal: number;
    surcharge: number;
    tax: number;
    tip: number;
    total: number;
    treat?: number;
  };
}[] {
  const splits = receipt.splits ?? [];
  const payers = splits.filter((s) => s.isPaying);

  const lineItemsTotal = getLineItemsTotal(receipt.lineItems);
  const surchargesTotal = getSurchargesTotal(
    lineItemsTotal,
    receipt.surcharges,
  );
  const taxableTotal = currency(lineItemsTotal).add(surchargesTotal).value;
  const taxTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.taxType,
    receipt.taxValue,
  );
  const tipTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.tipType,
    receipt.tipValue,
  );

  const grandTotal = calculateTotal(receipt);
  const distributedTotals = currency(grandTotal).distribute(payers.length);

  return splits.map((split) => {
    if (!split.isPaying)
      return {
        name: split.name,
        breakdown: {
          subtotal: 0,
          surcharge: 0,
          tax: 0,
          tip: 0,
          total: 0,
          treat: 0,
        },
      };

    const payerIdx = payers.findIndex((p) => p.name === split.name);
    const total = distributedTotals[payerIdx]!.value;
    const percent = grandTotal ? total / grandTotal : 0;
    const subtotal = currency(lineItemsTotal).multiply(percent).value;
    const surcharge = currency(surchargesTotal).multiply(percent).value;
    const tax = currency(taxTotal).multiply(percent).value;
    const tip = currency(tipTotal).multiply(percent).value;
    const treat = grandTotal / payers.length - grandTotal / splits.length;

    return {
      name: split.name,
      breakdown: { subtotal, surcharge, tax, tip, total, treat },
    };
  });
}

export function splitAdvanced(receipt: ReceiptInput): {
  name: string;
  breakdown: {
    subtotal: number;
    surcharge: number;
    tax: number;
    tip: number;
    total: number;
    treat?: number;
  };
}[] {
  const lineItems = receipt.lineItems ?? [];
  const splits = receipt.splits ?? [];

  const splitMap: Record<string, number> = {};
  splits.forEach((s) => (splitMap[s.name] = 0));
  for (const item of lineItems) {
    const assigned = item.assignedTo?.length ? item.assignedTo : ["Me"];
    const share = currency(item.unitPrice)
      .multiply(item.quantity)
      .divide(assigned.length).value;
    for (const name of assigned) {
      if (splitMap[name] !== undefined) {
        splitMap[name] = currency(splitMap[name]).add(share).value;
      }
    }
  }

  const totalSubtotal = Object.values(splitMap).reduce(
    (sum, v) => currency(sum).add(v).value,
    0,
  );
  const surchargesTotal = getSurchargesTotal(totalSubtotal, receipt.surcharges);
  const taxableTotal = currency(totalSubtotal).add(surchargesTotal).value;
  const taxTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.taxType,
    receipt.taxValue,
  );
  const tipTotal = getPercentOrFixedTotal(
    taxableTotal,
    receipt.tipType,
    receipt.tipValue,
  );

  const baseResults = splits.map((s) => {
    const sub = splitMap[s.name] ?? 0;
    const pct = totalSubtotal > 0 ? sub / totalSubtotal : 0;
    const surcharge = currency(surchargesTotal).multiply(pct).value;
    const tax = currency(taxTotal).multiply(pct).value;
    const tip = currency(tipTotal).multiply(pct).value;
    const total = currency(sub).add(surcharge).add(tax).add(tip).value;
    return {
      name: s.name,
      isPaying: s.isPaying,
      breakdown: { subtotal: sub, surcharge, tax, tip, total },
    };
  });

  const treatPool = baseResults
    .filter((r) => !r.isPaying)
    .reduce((sum, r) => currency(sum).add(r.breakdown.total).value, 0);

  const payers = baseResults.filter((r) => r.isPaying);
  const treatShares =
    payers.length > 0 ? currency(treatPool).distribute(payers.length) : [];
  const treatMap: Record<string, number> = {};
  payers.forEach((p, i) => {
    treatMap[p.name] = treatShares[i]?.value ?? 0;
  });

  return baseResults.map((r) => {
    if (r.isPaying) {
      return {
        name: r.name,
        breakdown: {
          ...r.breakdown,
          total: currency(r.breakdown.total).add(treatMap[r.name]!).value,
          treat: treatMap[r.name],
        },
      };
    } else {
      return {
        name: r.name,
        breakdown: {
          subtotal: 0,
          surcharge: 0,
          tax: 0,
          tip: 0,
          total: 0,
          treat: r.breakdown.total,
        },
      };
    }
  });
}
