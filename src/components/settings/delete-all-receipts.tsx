"use client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { api } from "@/trpc/react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";

export function DeleteAllReceiptsButton() {
  const { mutateAsync: deleteAllReceipts, isPending: isDeletingReceipts } =
    api.receipt.deleteAll.useMutation({
      onSuccess: () => {
        toast.success("Receipts deleted", {
          description: "All receipts were deleted successfully.",
        });
      },
      onError: () => {
        toast.error("Delete failed", {
          description: "Could not delete receipts.",
        });
      },
    });

  async function handleDelete() {
    await deleteAllReceipts();
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" disabled={isDeletingReceipts}>
          {isDeletingReceipts ? (
            <>
              <Loader2 className="animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 />
              Delete All Receipts
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete All Receipts</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete all your receipts and associated
            splits? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 />
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
