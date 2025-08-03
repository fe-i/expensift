"use client";
import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Image as ImageIcon,
  XCircle,
  FileUp,
  Receipt,
  UploadCloud,
} from "lucide-react";
import {
  extractReceiptData,
  type ExtractReceiptDataOutput,
} from "@/ai/flows/extract-receipt-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/trpc/react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useDropzone } from "react-dropzone";

const MAX_FILES = 3;
const MAX_RECEIPTS = 3;
const MAX_SIZE_MB = 20;

export function ReceiptUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  const utils = api.useUtils();
  const { mutateAsync: createMany } = api.receipt.createMany.useMutation({
    onSuccess: async () => await utils.receipt.list.invalidate(),
  });

  const handleFiles = useCallback(
    (files: FileList | File[] | null) => {
      if (!files) return;

      const filesArray = Array.isArray(files) ? files : Array.from(files);

      const validFiles = filesArray.filter((f) => {
        if (!f.type.startsWith("image/")) {
          toast.error("File type rejected", {
            description: `Only image files allowed. Rejected: ${f.name}`,
          });
          return false;
        }
        if (f.type === "image/heic" || f.type === "image/heif") {
          toast.error("Unsupported file type", {
            description: `${f.name} is in HEIC format, which is not supported.`,
          });
          return false;
        }
        if (f.size > MAX_SIZE_MB * 1024 * 1024) {
          toast.error("File size limit", {
            description: `Each image must be less than ${MAX_SIZE_MB}MB. Rejected: ${f.name}`,
          });
          return false;
        }
        return true;
      });

      const totalFiles = stagedFiles.length + validFiles.length;
      if (totalFiles > MAX_FILES) {
        toast.error("File limit exceeded", {
          description: `Max ${MAX_FILES} images at a time. Each image can have up to ${MAX_RECEIPTS} receipts.`,
        });
        return;
      }

      setStagedFiles((prev) => [...prev, ...validFiles]);
    },
    [stagedFiles],
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (isProcessing) return;
      handleFiles(event.clipboardData?.files ?? null);
    },
    [isProcessing, handleFiles],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    disabled: isProcessing || stagedFiles.length >= MAX_FILES,
    noDragEventsBubbling: true,
    onDrop: useCallback(
      (acceptedFiles: File[]) => handleFiles(acceptedFiles),
      [handleFiles],
    ),
  });

  const removeStagedFile = (idx: number) =>
    setStagedFiles((prev) => prev.filter((_, index) => index !== idx));

  const processFiles = useCallback(async () => {
    if (stagedFiles.length === 0) return;
    setIsProcessing(true);
    try {
      const allReceipts: ExtractReceiptDataOutput = [];
      const errorFiles: string[] = [];
      for (const file of stagedFiles) {
        try {
          const dataUri = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = (err) => {
              reject(
                new Error(
                  err instanceof Error && err.message
                    ? err.message
                    : "FileReader error",
                ),
              );
            };
            reader.readAsDataURL(file);
          });
          const receipts = await extractReceiptData({ photoDataUri: dataUri });
          allReceipts.push(...receipts);
        } catch {
          errorFiles.push(file.name);
        }
      }
      if (errorFiles.length > 0) {
        toast.error("Processing failed", {
          description: `Could not process: ${errorFiles.join(", ")}`,
        });
      }
      if (allReceipts.length > 0) {
        try {
          await createMany(allReceipts);
          toast.success(
            `Receipt${allReceipts.length === 1 ? "" : "s"} uploaded`,
            {
              description: `Uploaded ${allReceipts.length} receipt${allReceipts.length === 1 ? "" : "s"}.`,
            },
          );
        } catch {
          toast.error("Upload failed", {
            description: "An error occurred while uploading receipts.",
          });
        }
      }
    } finally {
      setStagedFiles([]);
      setIsProcessing(false);
    }
  }, [stagedFiles, createMany]);

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UploadCloud />
          Upload Receipt
        </CardTitle>
        <CardDescription>
          Select, drop, or paste one or more receipt images (max {MAX_FILES}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={cn(
            "border-muted-foreground flex h-72 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-all",
            isDragActive && "bg-muted",
            stagedFiles.length < MAX_FILES
              ? "cursor-pointer"
              : "cursor-not-allowed",
          )}
        >
          {isProcessing ? (
            <>
              <Receipt className="animate-bounce" />
              <span className="text-muted-foreground text-sm">
                Analyzing receipt
                {stagedFiles.length === 1 ? "" : "s"} and extracting data...
              </span>
            </>
          ) : stagedFiles.length > 0 ? (
            stagedFiles.map((file, _) => (
              <div
                key={_}
                className="bg-background/80 flex items-center gap-2 rounded border p-2 text-sm"
              >
                <span className="max-w-32 truncate" title={file.name}>
                  {file.name}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${file.name}`}
                      className="hover:text-destructive h-4 w-4 rounded-full transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeStagedFile(_);
                      }}
                    >
                      <XCircle />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove {file.name}</TooltipContent>
                </Tooltip>
              </div>
            ))
          ) : (
            <div className="text-muted-foreground flex flex-col items-center justify-center gap-2">
              <ImageIcon className="size-8" />
              <p className="flex items-center justify-center text-sm">
                {isDragActive
                  ? "Drop image here."
                  : "Drag & drop, paste, or click to select."}
              </p>
            </div>
          )}
          <Input
            {...getInputProps()}
            aria-label="Upload receipt image"
            accept="image/*"
            disabled={isProcessing || stagedFiles.length >= MAX_FILES}
          />
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
        <Button
          onClick={processFiles}
          disabled={isProcessing || stagedFiles.length === 0}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <FileUp />
              Process{" "}
              {stagedFiles.length > 1
                ? `${stagedFiles.length} Receipts`
                : "Receipt"}
            </>
          )}
        </Button>
        <CardDescription className="text-xs">
          Note: Images are not stored; only extracted receipt data is saved.
        </CardDescription>
      </CardFooter>
    </Card>
  );
}
