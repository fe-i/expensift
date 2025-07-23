"use client";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { ReceiptDialog } from "@/components/receipts/receipt-dialog";

export function AddManualButton() {
  return (
    <ReceiptDialog>
      <Button variant="outline" className="w-full">
        <PlusCircle />
        Add Manually
      </Button>
    </ReceiptDialog>
  );
}
