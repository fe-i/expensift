"use client";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn, CATEGORY_ICONS, calculateTotal, CATEGORIES } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeftRight,
  Calendar as CalendarIcon,
  DollarSign,
  Layers,
  Package,
  Percent,
  Trash2,
  Save,
  Loader2,
  Pencil,
  Plus,
} from "lucide-react";
import { zodReceiptSchema, type Receipt, type WithDocument } from "@/lib/types";
import currency from "currency.js";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ReceiptDialog({
  data,
  open,
  onOpenChange,
  onSubmit,
  isLoading = false,
}: {
  data?: WithDocument<Receipt>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Receipt) => void;
  isLoading?: boolean;
}) {
  function setDefaultValues(data?: WithDocument<Receipt>): Receipt {
    const {
      merchant = "",
      date = new Date().toLocaleDateString(),
      category = "",
      lineItems = [],
      surcharges = [],
      taxType = "fixed",
      taxValue = 0,
      tipType = "fixed",
      tipValue = 0,
      splitMode = "simple",
      splits = [],
      userId = "",
    } = data ?? {};

    return {
      merchant,
      date,
      category,
      lineItems,
      surcharges,
      taxType,
      taxValue,
      tipType,
      tipValue,
      splitMode,
      splits,
      userId,
    };
  }

  const form = useForm<Receipt>({
    resolver: zodResolver(zodReceiptSchema),
    defaultValues: setDefaultValues(data),
  });

  const taxType = useWatch({ control: form.control, name: "taxType" });
  const tipType = useWatch({ control: form.control, name: "tipType" });

  function clampNumber(val: number, min: number, max: number, decimals = 2) {
    if (isNaN(val)) val = min;
    if (val < min) val = min;
    if (val > max) val = max;
    return +val.toFixed(decimals);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) form.reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {data ? <Pencil /> : <Plus />}
            {data ? "Edit Receipt" : "Add Receipt"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            {data
              ? "Make receipt changes and split it with others."
              : "Manually fill out the receipt details."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="receipt-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col gap-4"
          >
            {/* Merchant and Date */}
            <div className="flex justify-evenly gap-4">
              <FormField
                control={form.control}
                name="merchant"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Merchant</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Expensift"
                        required
                        maxLength={50}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="w-full">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "flex justify-start gap-3",
                              !field.value && "text-muted-foreground",
                            )}
                          >
                            <CalendarIcon className="opacity-50" />
                            {field.value
                              ? new Date(field.value).toLocaleDateString()
                              : "Pick a date"}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                        <Calendar
                          mode="single"
                          selected={new Date(field.value)}
                          onSelect={(date) => {
                            if (date) {
                              field.onChange(date.toLocaleDateString());
                            }
                          }}
                          disabled={(date) => date > new Date()}
                          autoFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </FormItem>
                )}
              />
            </div>
            {/* Category */}
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map((category, _) => {
                        const Icon = CATEGORY_ICONS[category] ?? Package;
                        return (
                          <SelectItem key={_} value={category}>
                            <Icon className="size-4" />
                            {category}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            {/* Line Items */}
            <FormField
              control={form.control}
              name="lineItems"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Line Items</FormLabel>
                  <FormControl>
                    <div className="max-h-48 overflow-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Name</TableHead>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Unit Price</TableHead>
                            <TableHead>Total</TableHead>
                            <TableHead className="text-right">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                      field.onChange([
                                        ...field.value,
                                        {
                                          name: "",
                                          quantity: 1,
                                          unitPrice: 0,
                                          assignedTo: [],
                                        },
                                      ]);
                                    }}
                                  >
                                    <Plus />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Add new line item
                                </TooltipContent>
                              </Tooltip>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {field.value.length > 0 ? (
                            field.value.map((item, i) => (
                              <TableRow key={i}>
                                <TableCell>
                                  <Input
                                    placeholder="e.g., Coffee"
                                    required
                                    maxLength={100}
                                    value={item.name}
                                    onChange={(e) => {
                                      const updatedItem = {
                                        ...item,
                                        name: e.target.value,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step={1}
                                    min={1}
                                    max={1000}
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const updatedItem = {
                                        ...item,
                                        quantity: +e.target.value,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                    onBlur={(e) => {
                                      let val = parseInt(e.target.value, 10);
                                      val = clampNumber(val, 1, 1000, 0);
                                      const updatedItem = {
                                        ...item,
                                        quantity: val,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                  />
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    value={item.unitPrice}
                                    step={0.01}
                                    min={0}
                                    max={10000}
                                    onChange={(e) => {
                                      const updatedItem = {
                                        ...item,
                                        unitPrice: +e.target.value,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                    onBlur={(e) => {
                                      let val = parseFloat(e.target.value);
                                      val = clampNumber(val, 0, 10000);
                                      const updatedItem = {
                                        ...item,
                                        unitPrice: val,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="flex items-center gap-2">
                                  <Input
                                    type="number"
                                    step={0.01}
                                    min={0}
                                    max={10000000}
                                    value={clampNumber(
                                      item.quantity * item.unitPrice,
                                      0,
                                      10000000,
                                    )}
                                    onChange={(e) => {
                                      const updatedTotal = parseFloat(
                                        e.target.value,
                                      );
                                      if (
                                        !isNaN(updatedTotal) &&
                                        item.quantity > 0
                                      ) {
                                        const updatedPrice =
                                          updatedTotal / item.quantity;
                                        const updatedItem = {
                                          ...item,
                                          unitPrice: updatedPrice,
                                        };
                                        const updatedItems = [...field.value];
                                        updatedItems[i] = updatedItem;
                                        field.onChange(updatedItems);
                                      }
                                    }}
                                    onBlur={(e) => {
                                      let val = parseFloat(e.target.value);
                                      val = clampNumber(val, 0, 10000000);
                                      const updatedPrice = clampNumber(
                                        val / item.quantity,
                                        0,
                                        10000,
                                      );
                                      const updatedItem = {
                                        ...item,
                                        unitPrice: updatedPrice,
                                      };
                                      const updatedItems = [...field.value];
                                      updatedItems[i] = updatedItem;
                                      field.onChange(updatedItems);
                                    }}
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="text-destructive"
                                        onClick={() => {
                                          const updatedItems =
                                            field.value.filter(
                                              (_, idx) => idx !== i,
                                            );
                                          field.onChange(updatedItems);
                                        }}
                                      >
                                        <Trash2 />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Remove line item
                                    </TooltipContent>
                                  </Tooltip>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                No line items.
                                <FormMessage />
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </FormControl>
                </FormItem>
              )}
            />
            {/* Surcharges, Tax, Tip, Total */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="surcharges"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="leading-tight">Surcharges</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button type="button" variant="outline">
                            <Layers className="mr-auto" />
                            {field.value?.length ?? 0} item
                            {field.value?.length === 1 ? "" : "s"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="overflow-auto p-0"
                          align="start"
                        >
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Description</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead className="text-right">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        disabled={
                                          (field.value?.length ?? 0) >= 5
                                        }
                                        onClick={() => {
                                          field.onChange([
                                            ...(field.value ?? []),
                                            {
                                              description: "",
                                              type: "fixed",
                                              value: 0,
                                            },
                                          ]);
                                        }}
                                      >
                                        <Plus />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      Add new surcharge
                                    </TooltipContent>
                                  </Tooltip>
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {field.value?.length ? (
                                field.value.map((item, i) => (
                                  <TableRow key={i}>
                                    <TableCell>
                                      <Input
                                        placeholder="e.g., Fee"
                                        required
                                        maxLength={100}
                                        value={item.description}
                                        onChange={(e) =>
                                          field.onChange(
                                            (field.value ?? []).map((s, idx) =>
                                              idx === i
                                                ? {
                                                    ...s,
                                                    description: e.target.value,
                                                  }
                                                : s,
                                            ) ?? [],
                                          )
                                        }
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                              const updatedItems = [
                                                ...(field.value ?? []),
                                              ];
                                              updatedItems[i] = {
                                                ...item,
                                                type:
                                                  item.type === "percentage"
                                                    ? "fixed"
                                                    : "percentage",
                                              };
                                              field.onChange(updatedItems);
                                            }}
                                          >
                                            {item.type === "fixed" ? (
                                              <DollarSign />
                                            ) : (
                                              <Percent />
                                            )}
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Change to{" "}
                                          {item.type === "fixed"
                                            ? "percentage"
                                            : "fixed"}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        type="number"
                                        value={item.value}
                                        step={
                                          item.type === "fixed" ? 0.01 : 0.00001
                                        }
                                        min={
                                          item.type === "fixed" ? -10000 : -100
                                        }
                                        max={
                                          item.type === "fixed" ? 10000 : 100
                                        }
                                        onChange={(e) => {
                                          const updatedItems = (
                                            field.value ?? []
                                          ).map((s, idx) =>
                                            idx === i
                                              ? {
                                                  ...s,
                                                  value: +e.target.value,
                                                }
                                              : s,
                                          );
                                          field.onChange(updatedItems);
                                        }}
                                        onBlur={(e) => {
                                          let val = parseFloat(e.target.value);
                                          val = clampNumber(
                                            val,
                                            item.type === "fixed"
                                              ? -10000
                                              : -100,
                                            item.type === "fixed" ? 10000 : 100,
                                            item.type === "fixed" ? 2 : 5,
                                          );
                                          const updatedItems = [
                                            ...(field.value ?? []),
                                          ];
                                          updatedItems[i] = {
                                            ...item,
                                            value: val,
                                          };
                                          field.onChange(updatedItems);
                                        }}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="text-destructive"
                                            onClick={() => {
                                              const updatedItems = (
                                                field.value ?? []
                                              ).filter((_, idx) => idx !== i);
                                              field.onChange(updatedItems);
                                            }}
                                          >
                                            <Trash2 />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Remove surcharge
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                  </TableRow>
                                ))
                              ) : (
                                <TableRow>
                                  <TableCell
                                    colSpan={4}
                                    className="text-center"
                                  >
                                    No additional surcharges.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="leading-tight">
                      Tax
                      <FormField
                        control={form.control}
                        name="taxType"
                        render={({ field }) => (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-5"
                                onClick={() => {
                                  field.onChange(
                                    field.value === "percentage"
                                      ? "fixed"
                                      : "percentage",
                                  );
                                }}
                              >
                                <ArrowLeftRight className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Change tax type to{" "}
                              {field.value === "percentage"
                                ? "fixed"
                                : "percentage"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      />
                    </FormLabel>
                    <FormControl>
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          taxType === "percentage" && "flex-row-reverse",
                        )}
                      >
                        {taxType === "fixed" ? (
                          <DollarSign className="size-4" />
                        ) : (
                          <Percent className="size-4" />
                        )}
                        <Input
                          type="number"
                          step={taxType === "fixed" ? 0.01 : 0.00001}
                          min={0}
                          max={taxType === "fixed" ? 10000 : 100}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(+e.target.value)}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            val = clampNumber(
                              val,
                              0,
                              taxType === "fixed" ? 10000 : 100,
                              taxType === "fixed" ? 2 : 5,
                            );
                            field.onChange(val);
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tipValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="leading-tight">
                      Tip
                      <FormField
                        control={form.control}
                        name="tipType"
                        render={({ field }) => (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-5"
                                onClick={() => {
                                  field.onChange(
                                    field.value === "percentage"
                                      ? "fixed"
                                      : "percentage",
                                  );
                                }}
                              >
                                <ArrowLeftRight className="size-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              Change tip type to{" "}
                              {field.value === "percentage"
                                ? "fixed"
                                : "percentage"}
                            </TooltipContent>
                          </Tooltip>
                        )}
                      />
                    </FormLabel>
                    <FormControl>
                      <div
                        className={cn(
                          "flex items-center gap-2",
                          tipType === "percentage" && "flex-row-reverse",
                        )}
                      >
                        {tipType === "fixed" ? (
                          <DollarSign className="size-4" />
                        ) : (
                          <Percent className="size-4" />
                        )}
                        <Input
                          type="number"
                          step={tipType === "fixed" ? 0.01 : 0.00001}
                          min={0}
                          max={tipType === "fixed" ? 10000 : 100}
                          value={field.value ?? 0}
                          onChange={(e) => field.onChange(+e.target.value)}
                          onBlur={(e) => {
                            let val = parseFloat(e.target.value);
                            val = clampNumber(
                              val,
                              0,
                              tipType === "fixed" ? 10000 : 100,
                              tipType === "fixed" ? 2 : 5,
                            );
                            field.onChange(val);
                          }}
                        />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
              <FormItem>
                <FormLabel className="leading-tight">Total</FormLabel>
                <FormControl>
                  <Input
                    readOnly
                    value={currency(calculateTotal(form.watch())).format()}
                    type="text"
                  />
                </FormControl>
              </FormItem>
            </div>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild className="hidden sm:block">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="submit"
            form="receipt-form"
            disabled={
              isLoading ||
              !form.formState.isValid ||
              (data ? !form.formState.isDirty : false)
            }
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save />
                {data ? "Update Receipt" : "Add Receipt"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
