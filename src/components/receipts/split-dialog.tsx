"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Save,
  Loader2,
  Pencil,
  X,
  UserCheck,
  Gift,
  User,
  Plus,
  Info,
  SplitIcon,
  ListTodo,
  ArrowLeftRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn, splitAdvanced, splitEvenly } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import {
  type LineItem,
  type Split,
  type Receipt,
  type WithDocument,
} from "@/lib/types";
import currency from "currency.js";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function SplitDialog({
  receipt,
  open,
  onOpenChange,
  onSubmit,
  isLoadingSplits = false,
  isSplitting = false,
}: {
  receipt?: WithDocument<Receipt>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    splitMode: "simple" | "advanced",
    splits: Split[],
    lineItems?: LineItem[],
  ) => void;
  isLoadingSplits?: boolean;
  isSplitting?: boolean;
}) {
  const [splitMode, setSplitMode] = useState<"simple" | "advanced">(
    receipt?.splitMode ?? "simple",
  );
  const [splitUsers, setSplitUsers] = useState<Split[]>(receipt?.splits ?? []);
  const [localLineItems, setLocalLineItems] = useState<LineItem[]>(
    receipt?.lineItems ?? [],
  );

  const initialState = useRef({
    splitMode: receipt?.splitMode ?? "simple",
    splitUsers: receipt?.splits ?? [],
    localLineItems: receipt?.lineItems ?? [],
  });

  useEffect(() => {
    if (open) {
      setSplitMode(receipt?.splitMode ?? "simple");
      setSplitUsers(receipt?.splits ?? []);
      setLocalLineItems(receipt?.lineItems ?? []);
      initialState.current = {
        splitMode: receipt?.splitMode ?? "simple",
        splitUsers: receipt?.splits ?? [],
        localLineItems: receipt?.lineItems ?? [],
      };
    }
  }, [open, receipt]);

  const isDirty =
    JSON.stringify(splitUsers) !==
      JSON.stringify(initialState.current.splitUsers) ||
    splitMode !== initialState.current.splitMode ||
    (splitMode === "advanced" &&
      JSON.stringify(localLineItems) !==
        JSON.stringify(initialState.current.localLineItems));

  const [newUserName, setNewUserName] = useState<string>("");

  function handleAddUser(name: string) {
    if (
      !name ||
      name === SELF_NAME ||
      splitUsers.some((u) => u.name === name)
    ) {
      toast.error("Add user failed", {
        description: "Invalid or duplicate user name.",
      });
      return;
    }
    if (splitUsers.length >= 20) {
      toast.error("Add user failed", {
        description: "You can only add up to 20 people to a split.",
      });
      return;
    }
    setSplitUsers((prev) => [
      ...prev,
      {
        name,
        isPaying: true,
        paid: false,
      },
    ]);
    setNewUserName("");
  }

  const SELF_NAME = "Me";
  const splits: Split[] = [
    {
      name: SELF_NAME,
      isPaying: true,
      paid: false,
    },
    ...splitUsers,
  ];

  const splitResults =
    splitMode === "simple"
      ? splitEvenly({
          ...receipt,
          lineItems: receipt?.lineItems ?? [],
          splits,
        } as Receipt)
      : splitAdvanced({
          ...receipt,
          lineItems: localLineItems,
          splits,
        } as Receipt);

  function handleToggleIsPaying(idx: number) {
    setSplitUsers((prev) =>
      prev.map((u, i) =>
        i === idx
          ? {
              ...u,
              isPaying: !u.isPaying,
              paid: !u.isPaying ? false : u.paid,
            }
          : u,
      ),
    );
  }

  function handleTogglePaid(idx: number) {
    setSplitUsers((prev) =>
      prev.map((u, i) =>
        i === idx
          ? {
              ...u,
              paid: !u.paid,
            }
          : u,
      ),
    );
  }

  function handleRenameUser(idx: number) {
    const currentName = splitUsers[idx]?.name;
    const newName = window.prompt(
      "Enter a unique non-empty name for this user.",
      currentName,
    );
    if (
      !newName ||
      newName.trim().toLowerCase() === SELF_NAME.toLowerCase() ||
      splitUsers.some(
        (u, i) =>
          i !== idx && u.name.toLowerCase() === newName.trim().toLowerCase(),
      )
    ) {
      toast.error("Invalid user name", {
        description: "Name must be unique and not empty.",
      });
      return;
    }
    setSplitUsers((prev) =>
      prev.map((u, i) => (i === idx ? { ...u, name: newName.trim() } : u)),
    );
    setLocalLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        assignedTo:
          item.assignedTo?.map((n) =>
            n === currentName ? newName.trim() : n,
          ) ?? [],
      })),
    );
  }

  function handleRemoveUser(idx: number) {
    const userName = splitUsers[idx]?.name;
    setSplitUsers((prev) => prev.filter((_, i) => i !== idx));
    setLocalLineItems((prev) =>
      prev.map((item) => ({
        ...item,
        assignedTo: (item.assignedTo ?? []).filter((n) => n !== userName),
      })),
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto md:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SplitIcon />
            Split Receipt
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Split your receipt equally or assign items individually.
          </DialogDescription>
        </DialogHeader>
        <div
          className={cn(
            "grid gap-6",
            splitMode === "advanced" && "md:grid-cols-2",
          )}
        >
          <div className="flex flex-col gap-2">
            <Label>Add User</Label>
            <div className="flex justify-between gap-2">
              <Input
                placeholder="e.g. John Doe"
                value={newUserName}
                maxLength={50}
                onChange={(e) => setNewUserName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddUser(newUserName.trim());
                }}
              />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    type="button"
                    disabled={splitUsers.length >= 20 || !newUserName.trim()}
                    onClick={() => handleAddUser(newUserName.trim())}
                  >
                    <Plus />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add user</TooltipContent>
              </Tooltip>
            </div>
            <span className="my-0.5" />
            <Label>Split Users & Totals</Label>
            {isLoadingSplits ? (
              <Skeleton className="h-48 w-full" />
            ) : (
              <div className="flex max-h-48 flex-col gap-2 overflow-auto pr-2">
                {splits.map((user, idx) => {
                  const isMe = user.name === SELF_NAME;
                  const splitResult = splitResults.find(
                    (r) => r.name === user.name,
                  );
                  return (
                    <div
                      key={user.name}
                      className="flex items-center justify-between gap-2"
                    >
                      {isMe ? (
                        <Badge
                          variant="outline"
                          className="flex cursor-not-allowed items-center rounded-full p-2"
                        >
                          <User />
                          <span className="max-w-24 truncate">{user.name}</span>
                        </Badge>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Badge
                              variant="outline"
                              className={cn(
                                "flex cursor-pointer items-center rounded-full p-2",
                                {
                                  "border-red-600 bg-red-500/80":
                                    !user.isPaying,
                                  "border-green-600 bg-green-500/90": user.paid,
                                  "hover:bg-muted": user.isPaying && !user.paid,
                                },
                              )}
                            >
                              <User />
                              <span className="max-w-24 truncate">
                                {user.name}
                              </span>
                            </Badge>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem
                              onClick={() => handleToggleIsPaying(idx - 1)}
                              disabled={user.paid}
                            >
                              <Gift />
                              {user.isPaying ? "Treat" : "Stop Treating"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePaid(idx - 1)}
                              disabled={!user.isPaying}
                            >
                              <UserCheck />
                              {user.paid ? "Mark as Unpaid" : "Mark as Paid"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRenameUser(idx - 1)}
                            >
                              <Pencil />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleRemoveUser(idx - 1)}
                              className="text-destructive"
                            >
                              <X className="text-destructive" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <div className="flex items-center gap-1">
                        {splitResult && splitResult.breakdown.total !== 0 && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                className="size-6 rounded-full"
                                variant="ghost"
                                size="icon"
                                aria-label="Show breakdown"
                              >
                                <Info className="size-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className="max-w-56 text-sm"
                              align="start"
                            >
                              <div className="space-y-1.5">
                                <h4 className="truncate font-semibold">
                                  Cost Breakdown for {user.name}
                                </h4>
                                <Separator />
                                {splitResult?.breakdown.subtotal !== 0 && (
                                  <div className="flex justify-between">
                                    Subtotal
                                    <span className="font-mono">
                                      {currency(
                                        splitResult.breakdown.subtotal,
                                      ).format()}
                                    </span>
                                  </div>
                                )}
                                {splitResult?.breakdown.surcharge !== 0 && (
                                  <div className="flex justify-between">
                                    Surcharge
                                    <span className="font-mono">
                                      {currency(
                                        splitResult.breakdown.surcharge,
                                      ).format()}
                                    </span>
                                  </div>
                                )}
                                {splitResult?.breakdown.tax !== 0 && (
                                  <div className="flex justify-between">
                                    Tax
                                    <span className="font-mono">
                                      {currency(
                                        splitResult.breakdown.tax,
                                      ).format()}
                                    </span>
                                  </div>
                                )}
                                {splitResult?.breakdown.tip !== 0 && (
                                  <div className="flex justify-between">
                                    Tip
                                    <span className="font-mono">
                                      {currency(
                                        splitResult.breakdown.tip,
                                      ).format()}
                                    </span>
                                  </div>
                                )}
                                {splitResult?.breakdown.treat &&
                                splitResult?.breakdown.treat !== 0 ? (
                                  <div className="flex justify-between text-red-300">
                                    Treat Share
                                    <span className="font-mono">
                                      {currency(
                                        splitResult.breakdown.treat,
                                      ).format()}
                                    </span>
                                  </div>
                                ) : null}
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                        <span className="font-mono font-semibold">
                          {currency(splitResult?.breakdown.total ?? 0).format()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {splitMode === "advanced" && (
            <div className="flex flex-col gap-2">
              <Label>Line Items</Label>
              <div className="flex max-h-68 flex-col gap-2 overflow-auto pr-2">
                {localLineItems.map((item, i) => (
                  <Card key={i} className="p-4">
                    <CardContent className="flex justify-between gap-4 p-0">
                      <div className="flex flex-col justify-center gap-2">
                        <CardTitle className="text-xs">{item.name}</CardTitle>
                        <CardDescription className="text-xs">
                          Qty: {item.quantity} &nbsp;|&nbsp; Price:{" "}
                          {currency(item.unitPrice).format()}
                        </CardDescription>
                      </div>
                      <div className="flex flex-col items-center justify-around gap-2">
                        {item.quantity > 1 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="icon"
                                variant="outline"
                                onClick={() => {
                                  const newItems = [...localLineItems];
                                  newItems[i] = {
                                    ...item,
                                    quantity: item.quantity - 1,
                                  };
                                  newItems.splice(i + 1, 0, {
                                    ...item,
                                    quantity: 1,
                                  });
                                  setLocalLineItems(newItems);
                                }}
                              >
                                <SplitIcon />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Separate items</TooltipContent>
                          </Tooltip>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="icon" variant="outline">
                                  <ListTodo />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                Assign item to users
                              </TooltipContent>
                            </Tooltip>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="max-w-3xs">
                            <DropdownMenuLabel>
                              {item.name} (x{item.quantity})
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {[SELF_NAME, ...splitUsers.map((u) => u.name)].map(
                              (user) => {
                                const assigned = item.assignedTo ?? [];
                                const isDefaultMe =
                                  user === SELF_NAME && assigned.length === 0;
                                const isChecked =
                                  assigned.includes(user) || isDefaultMe;

                                return (
                                  <DropdownMenuCheckboxItem
                                    key={user}
                                    checked={isChecked}
                                    onCheckedChange={(checked) => {
                                      const newItems = [...localLineItems];
                                      const assignedSet = new Set(
                                        item.assignedTo ?? [SELF_NAME],
                                      );

                                      if (checked) assignedSet.add(user);
                                      else assignedSet.delete(user);

                                      if (assignedSet.size === 0)
                                        assignedSet.add(SELF_NAME);

                                      newItems[i] = {
                                        ...item,
                                        assignedTo: Array.from(assignedSet),
                                      };
                                      setLocalLineItems(newItems);
                                    }}
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    {user}
                                  </DropdownMenuCheckboxItem>
                                );
                              },
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="sm:mr-auto"
            onClick={() => {
              const nextMode = splitMode === "simple" ? "advanced" : "simple";
              setSplitMode(nextMode);
              if (nextMode === "simple") {
                setLocalLineItems(
                  initialState.current.localLineItems.map((item) => ({
                    ...item,
                    assignedTo: [],
                  })),
                );
              }
            }}
          >
            <ArrowLeftRight />
            Switch to {splitMode === "simple" ? "Advanced" : "Simple"} Split
          </Button>
          <DialogClose asChild className="hidden sm:block">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </DialogClose>
          <Button
            type="button"
            disabled={isSplitting || !isDirty}
            onClick={() => onSubmit(splitMode, splitUsers, localLineItems)}
          >
            {isSplitting ? (
              <>
                <Loader2 className="animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Save />
                Save Split
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
