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
import { splitEvenly, splitAdvanced, cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  FileQuestion,
  Pencil,
  Share2,
  UserCheck,
  UserX,
} from "lucide-react";
import { SplitDialog } from "@/components/receipts/split-dialog";
import { toast } from "sonner";
import type { LineItem, Receipt, Split, WithDocument } from "@/lib/types";
import React, { useState } from "react";
import currency from "currency.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReceiptSplitsList() {
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<
    WithDocument<Receipt> | undefined
  >();

  const { data, isLoading } = api.receipt.listSplits.useQuery({
    page,
    pageSize: 25,
  });

  const receipts = data?.receipts ?? [];
  const totalPages = data?.totalPages ?? 1;

  const utils = api.useUtils();
  const { mutateAsync: updateReceipt, isPending: isUpdating } =
    api.receipt.update.useMutation({
      onSuccess: async () => {
        await utils.receipt.invalidate();
        toast.success("Split updated", {
          description: "Details of split updated.",
        });
        setOpen(false);
        setSelectedReceipt(undefined);
      },
      onError: () => {
        toast.error("Update failed", {
          description: "Could not update split.",
        });
      },
    });

  const allSplits = receipts
    .flatMap((receipt) => {
      const splitsWithUser = [
        {
          name: "Me",
          isPaying: true,
          paid: false,
        },
        ...(receipt.splits ?? []),
      ];

      const splitResults =
        receipt.splitMode === "advanced"
          ? splitAdvanced({ ...receipt, splits: splitsWithUser })
          : splitEvenly({ ...receipt, splits: splitsWithUser });

      return splitsWithUser.map((split) => {
        const res = splitResults.find((r) => r.name === split.name);
        return {
          name: split.name,
          merchant: receipt.merchant,
          date: receipt.date,
          total: res?.breakdown.total ?? 0,
          isPaying: split.isPaying,
          paid: split.paid,
          receipt,
        };
      });
    })
    .filter((split) => split.name !== "Me" && split.isPaying)
    .sort((a, b) => Number(a.paid) - Number(b.paid));

  function handleEditSplit(receipt: WithDocument<Receipt>) {
    setSelectedReceipt(receipt);
    setOpen(true);
  }

  async function handleTogglePaid(
    receipt: WithDocument<Receipt>,
    splitName: string,
  ) {
    if (!receipt._id) return;
    const updatedSplits = (receipt.splits ?? []).map((split) =>
      split.name === splitName ? { ...split, paid: !split.paid } : split,
    );
    await updateReceipt({
      id: receipt._id as string,
      data: {
        splits: updatedSplits,
      },
    });
  }

  async function handleShareSplit(split: {
    name: string;
    merchant: string;
    date: string;
    total: number;
  }) {
    const message = `Hey ${split.name}, you owe me ${currency(split.total).format()} for our expense at ${split.merchant} on ${new Date(split.date).toLocaleDateString()}. Sent from Expensift.`;
    await navigator.clipboard.writeText(message);
    toast.success("Message copied to clipboard.", {
      description: message,
    });
  }

  async function handleSplitSubmit(
    splitMode: "simple" | "advanced",
    splits: Split[],
    lineItems?: LineItem[],
  ) {
    if (!selectedReceipt?._id) return;

    let updatedLineItems: LineItem[];
    let updatedSplits: Split[];

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
    <>
      <Card className="h-[calc(100vh-12rem)] shadow">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="mb-1 text-xl">Your Splits</CardTitle>
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <CardDescription>
                  Overview of all your receipt splits.
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
          ) : allSplits.length === 0 ? (
            <div className="flex size-full flex-col items-center justify-center text-center">
              <FileQuestion className="text-muted-foreground mb-4 h-16 w-16" />
              <h4 className="text-lg font-extrabold">No splits found</h4>
              <p className="text-muted-foreground text-sm">
                Start by splitting a receipt.
                <br />
                Your splits will appear here once added.
              </p>
            </div>
          ) : (
            <div className="size-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Merchant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allSplits.map((split, _) => (
                    <TableRow
                      key={_}
                      className={cn(split.paid && "line-through")}
                    >
                      <TableCell>{split.name}</TableCell>
                      <TableCell>{split.merchant}</TableCell>
                      <TableCell>
                        {new Date(split.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {currency(split.total).format()}
                      </TableCell>
                      <TableCell className="flex items-center justify-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit split"
                              onClick={() => handleEditSplit(split.receipt)}
                            >
                              <Pencil />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Edit split</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={
                                split.paid ? "Mark as unpaid" : "Mark as paid"
                              }
                              className={cn(
                                "transition-all",
                                split.paid
                                  ? "hover:bg-red-400"
                                  : "hover:bg-green-400",
                              )}
                              disabled={isUpdating}
                              onClick={() =>
                                handleTogglePaid(split.receipt, split.name)
                              }
                            >
                              {split.paid ? <UserX /> : <UserCheck />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {split.paid ? "Mark as unpaid" : "Mark as paid"}
                          </TooltipContent>
                        </Tooltip>
                        {!split.paid && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label="Share split"
                                onClick={() => handleShareSplit(split)}
                              >
                                <Share2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Share split</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <SplitDialog
        key={`split-${selectedReceipt?._id as string}`}
        receipt={selectedReceipt}
        open={open}
        onOpenChange={(open) => {
          setOpen(open);
          if (!open) setSelectedReceipt(undefined);
        }}
        onSubmit={handleSplitSubmit}
        isLoadingSplits={isLoading}
        isSplitting={isUpdating}
      />
    </>
  );
}
