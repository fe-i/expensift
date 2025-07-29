"use client";
import { api } from "@/trpc/react";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { calculateTotal, CATEGORY_ICONS } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  FileQuestion,
  Package,
  Pencil,
  Split,
  Trash2,
} from "lucide-react";
import { ReceiptDialog } from "@/components/receipts/receipt-dialog";
import { SplitDialog } from "@/components/receipts/split-dialog";
import { toast } from "sonner";
import type {
  Receipt,
  ReceiptInput,
  Split as SplitType,
  WithDocument,
  LineItem,
} from "@/lib/types";
import React, { useState } from "react";
import currency from "currency.js";
import { CategoryBreakdownChart } from "@/components/receipts/category-breakdown-chart";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReceiptsList() {
  const [page, setPage] = useState(1);
  const [openDialog, setOpenDialog] = useState<"receipt" | "split" | null>(
    null,
  );
  const [selectedReceipt, setSelectedReceipt] = useState<
    WithDocument<Receipt> | undefined
  >();

  const { data, isLoading } = api.receipt.list.useQuery({
    page,
    pageSize: 25,
  });

  const receipts = data?.receipts ?? [];
  const grandTotal = data?.grandTotal ?? 0;
  const categoryBreakdown = data?.categoryBreakdown ?? [];
  const totalPages = data?.totalPages ?? 1;

  const utils = api.useUtils();
  const deleteReceipt = api.receipt.delete.useMutation({
    onSuccess: async () => {
      await utils.receipt.invalidate();
      toast.success("Receipt deleted", {
        description: "The receipt was removed successfully.",
      });
    },
    onError: () => {
      toast.error("Delete failed", {
        description: "Could not delete receipt.",
      });
    },
  });

  const { mutateAsync: updateReceipt, isPending: isUpdating } =
    api.receipt.update.useMutation({
      onSuccess: async () => {
        await utils.receipt.invalidate();
        toast.success("Receipt updated", {
          description: "Your changes were saved.",
        });
        setOpenDialog(null);
        setSelectedReceipt(undefined);
      },
      onError: () => {
        toast.error("Update failed", {
          description: "Could not update receipt.",
        });
      },
    });

  async function handleReceiptSubmit(data: ReceiptInput) {
    if (!selectedReceipt?._id) return;
    await updateReceipt({ id: selectedReceipt._id as string, data });
  }

  async function handleSplitSubmit(
    splitMode: "simple" | "advanced",
    splits: SplitType[],
    lineItems?: LineItem[],
  ) {
    if (!selectedReceipt?._id) return;

    let updatedLineItems: LineItem[];
    let updatedSplits: SplitType[];

    const mergeLineItems = (items: LineItem[]): LineItem[] => {
      const merged: Record<string, LineItem> = {};
      for (const item of items) {
        const key = `${item.name}_${item.unitPrice}`;
        if (merged[key]) merged[key].quantity += item.quantity;
        else merged[key] = { ...item };
      }
      return Object.values(merged);
    };

    if (splitMode === "simple") {
      updatedLineItems = mergeLineItems(selectedReceipt.lineItems);
      updatedSplits = splits;
    } else {
      updatedLineItems = mergeLineItems(
        lineItems ?? selectedReceipt.lineItems ?? [],
      );
      const assignedNames = new Set(
        updatedLineItems.flatMap((item) => item.assignedTo),
      );
      updatedSplits = splits.filter((split) => assignedNames.has(split.name));
    }

    await updateReceipt({
      id: selectedReceipt._id as string,
      data: {
        ...selectedReceipt,
        lineItems: updatedLineItems,
        splitMode,
        splits: updatedSplits,
      },
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <CategoryBreakdownChart
        categoryBreakdown={categoryBreakdown}
        isLoading={isLoading}
      />
      <Card className="h-[calc(100vh-12rem)] shadow">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="mb-1 text-xl">Your Receipts</CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <CardDescription>
                  Overview of all your receipts. Total:{" "}
                  <span className="font-semibold">
                    {currency(grandTotal).format()}
                  </span>
                </CardDescription>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ArrowLeft />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Previous Page</TooltipContent>
                </Tooltip>
                {isLoading ? (
                  <Skeleton className="size-8" />
                ) : (
                  `${page}/${totalPages}`
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      <ArrowRight />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Next Page</TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="h-full overflow-auto">
          {isLoading ? (
            <Skeleton className="size-full" />
          ) : receipts.length === 0 ? (
            <div className="flex size-full flex-col items-center justify-center text-center">
              <FileQuestion className="text-muted-foreground mb-4 h-16 w-16" />
              <h4 className="text-lg font-extrabold">No receipts found</h4>
              <p className="text-muted-foreground text-sm">
                Start by uploading your first receipt.
                <br />
                Your receipts will appear here once added.
              </p>
            </div>
          ) : (
            <div className="size-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt: WithDocument<Receipt>, _) => {
                    if (!receipt || !receipt.lineItems) return null;
                    const Icon = CATEGORY_ICONS[receipt.category] ?? Package;
                    return (
                      <TableRow key={receipt._id as string}>
                        <TableCell>
                          <Badge variant="outline">
                            <Icon />
                            {receipt.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-32 truncate overflow-hidden">
                          {receipt.merchant}
                        </TableCell>
                        <TableCell>
                          {new Date(receipt.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-mono">
                          {currency(calculateTotal(receipt)).format()}
                        </TableCell>
                        <TableCell className="flex items-center justify-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Split receipt"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setOpenDialog("split");
                                }}
                              >
                                <Split />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Split receipt</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Edit receipt"
                                onClick={() => {
                                  setSelectedReceipt(receipt);
                                  setOpenDialog("receipt");
                                }}
                              >
                                <Pencil />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit receipt</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive"
                                aria-label="Delete receipt"
                                onClick={() =>
                                  deleteReceipt.mutate({
                                    id: String(receipt._id),
                                  })
                                }
                                disabled={deleteReceipt.isPending}
                              >
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete receipt</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <ReceiptDialog
        key={`receipt-${selectedReceipt?._id as string}`}
        data={selectedReceipt}
        open={openDialog === "receipt"}
        onOpenChange={(open) => {
          setOpenDialog(open ? "receipt" : null);
          if (!open) setSelectedReceipt(undefined);
        }}
        onSubmit={handleReceiptSubmit}
        isLoading={isUpdating}
      />
      <SplitDialog
        key={`split-${selectedReceipt?._id as string}`}
        receipt={selectedReceipt}
        open={openDialog === "split"}
        onOpenChange={(open) => {
          setOpenDialog(open ? "split" : null);
          if (!open) setSelectedReceipt(undefined);
        }}
        onSubmit={handleSplitSubmit}
        isLoadingSplits={isLoading}
        isSplitting={isUpdating}
      />
    </div>
  );
}
