"use client";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ReceiptDialog } from "@/components/receipts/receipt-dialog";
import { useState } from "react";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import type { ReceiptInput } from "@/lib/types";

export function AddManualButton() {
  const [open, setOpen] = useState(false);

  const utils = api.useUtils();
  const { mutateAsync: createReceipt, isPending } =
    api.receipt.create.useMutation({
      onSuccess: async () => {
        await utils.receipt.list.invalidate();
        toast.success("Receipt created", {
          description: "Your receipt was added successfully.",
        });
        setOpen(false);
      },
      onError: () => {
        toast.error("Create failed", {
          description: "Could not create receipt.",
        });
      },
    });

  async function handleReceiptSubmit(data: ReceiptInput) {
    await createReceipt(data);
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => setOpen(true)}
        aria-label="Add receipt manually"
      >
        <Plus />
        Add Manually
      </Button>
      <ReceiptDialog
        open={open}
        onOpenChange={(open) => setOpen(open)}
        onSubmit={handleReceiptSubmit}
        isLoading={isPending}
      />
    </>
  );
}
