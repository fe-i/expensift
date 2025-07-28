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
import { deleteUser } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function DeleteAccountButton() {
  const router = useRouter();

  const { mutateAsync: deleteAllReceipts, isPending: isDeletingReceipts } =
    api.receipt.deleteAll.useMutation({
      onSuccess: async () => {
        await deleteUser({
          fetchOptions: {
            onSuccess: () => {
              void router.push("/");
              toast.success("Account deleted", {
                description: "Your account was deleted successfully.",
              });
            },
            onError: () => {
              toast.error("Delete failed", {
                description: "Could not delete your account.",
              });
            },
          },
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
              Delete Account
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Account</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete your account and all associated
            data? This action cannot be undone.
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
