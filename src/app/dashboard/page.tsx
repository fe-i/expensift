import { generateMetadata } from "@/lib/metadata";
import { ProtectedPage } from "@/components/protected-page";
import { ReceiptUploader } from "@/components/receipts/receipt-uploader";
import { AddManualButton } from "@/components/receipts/add-manual-button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ReceiptsList } from "@/components/receipts/receipts-list";
import { ReceiptSplitsList } from "@/components/receipts/receipt-splits-list";

export const metadata = generateMetadata({
  title: "Dashboard",
  description: "Manage your expenses and split your receipts",
});

export default function Dashboard() {
  return (
    <ProtectedPage>
      <div className="bg-background flex min-h-[calc(100vh-4rem)] w-full grid-cols-1 flex-col items-center justify-center gap-4 p-4 xl:grid xl:grid-cols-[2fr_3fr] xl:items-start xl:gap-12 xl:px-32">
        <section className="flex w-full flex-col gap-2 sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <ReceiptUploader />
          <div className="flex w-full items-center">
            <hr className="border-muted flex-1 border-t" />
            <span className="text-muted-foreground mx-2 font-semibold">OR</span>
            <hr className="border-muted flex-1 border-t" />
          </div>
          <AddManualButton />
        </section>
        <section className="flex w-full flex-col sm:max-w-lg md:max-w-xl lg:max-w-2xl">
          <Tabs defaultValue="receipts">
            <TabsList className="mb-2 w-full">
              <TabsTrigger value="receipts">Receipts</TabsTrigger>
              <TabsTrigger value="splits">Splits</TabsTrigger>
            </TabsList>
            <TabsContent value="receipts">
              <ReceiptsList />
            </TabsContent>
            <TabsContent value="splits">
              <ReceiptSplitsList />
            </TabsContent>
          </Tabs>
        </section>
      </div>
    </ProtectedPage>
  );
}
