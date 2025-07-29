"use client";
import { useState, useRef, useCallback, useEffect } from "react";
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

const MAX_FILES = 3;
const MAX_FILE_SIZE_MB = 20;

export function ReceiptUploader() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = api.useUtils();
  const { mutateAsync: createMany } = api.receipt.createMany.useMutation({
    onSuccess: async () => await utils.receipt.list.invalidate(),
  });

  const handleFilesSelected = useCallback(
    (files: FileList | null) => {
      if (files) {
        const filesArray = Array.from(files);
        const totalFiles = stagedFiles.length + filesArray.length;
        if (totalFiles > MAX_FILES) {
          toast.error("Upload limit", {
            description: `Max ${MAX_FILES} images at a time. Each image can have up to 5 receipts.`,
          });
          return;
        }
        const nonImageFiles = filesArray.filter(
          (f) => !f.type.startsWith("image/"),
        );
        if (nonImageFiles.length > 0) {
          toast.error("File type rejected", {
            description: `Only image files allowed. Rejected: ${nonImageFiles.map((f) => f.name).join(", ")}`,
          });
          return;
        }
        const oversizedFiles = filesArray.filter(
          (f) => f.size > MAX_FILE_SIZE_MB * 1024 * 1024,
        );
        if (oversizedFiles.length > 0) {
          toast.error("File size limit", {
            description: `Each image must be less than ${MAX_FILE_SIZE_MB}MB. Too large: ${oversizedFiles.map((f) => f.name).join(", ")}`,
          });
          return;
        }
        setStagedFiles((prev) => [...prev, ...filesArray]);
      }
    },
    [stagedFiles],
  );

  const removeStagedFile = (idx: number) => {
    setStagedFiles((prev) => prev.filter((_, index) => index !== idx));
  };

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
      if (allReceipts.length > 0) {
        await createMany(allReceipts);
      }
      if (allReceipts.length > 0) {
        toast.success("Receipts uploaded", {
          description: `Uploaded ${allReceipts.length} receipt${allReceipts.length === 1 ? "" : "s"}.`,
        });
      }
      if (errorFiles.length > 0) {
        toast.error("Upload failed", {
          description: `Could not process: ${errorFiles.join(", ")}`,
        });
      }
    } finally {
      setStagedFiles([]);
      setIsProcessing(false);
    }
  }, [stagedFiles, createMany]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleFilesSelected(event.target.files);
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleButtonClick = () => fileInputRef.current?.click();

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isProcessing) setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (isProcessing) return;
    handleFilesSelected(e.dataTransfer.files);
  };

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      if (isProcessing) return;
      handleFilesSelected(event.clipboardData?.files ?? null);
    },
    [isProcessing, handleFilesSelected],
  );

  useEffect(() => {
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handlePaste]);

  return (
    <Card className="shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <UploadCloud />
          Upload Receipt
        </CardTitle>
        <CardDescription>
          Upload, drop, or paste one or more receipt images (max {MAX_FILES}).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDragOver={
            stagedFiles.length < MAX_FILES && !isProcessing
              ? handleDragOver
              : undefined
          }
          onDragLeave={
            stagedFiles.length < MAX_FILES && !isProcessing
              ? handleDragLeave
              : undefined
          }
          onDrop={
            stagedFiles.length < MAX_FILES && !isProcessing
              ? handleDrop
              : undefined
          }
          onClick={
            stagedFiles.length < MAX_FILES && !isProcessing
              ? handleButtonClick
              : undefined
          }
          className={cn(
            "border-muted-foreground flex h-72 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center transition-all",
            isDraggingOver && "bg-muted",
            stagedFiles.length < MAX_FILES && "cursor-pointer",
            (stagedFiles.length >= MAX_FILES || isProcessing) &&
              "cursor-not-allowed",
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
              <ImageIcon className="h-8 w-8" />
              <p className="flex items-center justify-center text-sm">
                {isDraggingOver
                  ? "Drop image here."
                  : "Drag & drop, paste, or click to upload."}
              </p>
            </div>
          )}
          <Input
            aria-label="Upload receipt image"
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isProcessing}
            multiple
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
              <span>Processing...</span>
            </>
          ) : (
            <>
              <FileUp />
              {stagedFiles.length > 1
                ? `Process ${stagedFiles.length} Receipts`
                : "Process Receipt"}
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
