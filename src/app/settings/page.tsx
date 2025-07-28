import { generateMetadata } from "@/lib/metadata";
import { ProtectedPage } from "@/components/protected-page";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DeleteAllReceiptsButton } from "@/components/settings/delete-all-receipts";
import { DeleteAccountButton } from "@/components/settings/delete-account-button";
import { ColorMode } from "@/components/settings/color-mode";
import { Label } from "@/components/ui/label";

export const metadata = generateMetadata({
  title: "Settings",
  description: "Manage your account settings and preferences",
});

export default function Settings() {
  return (
    <ProtectedPage>
      <section className="bg-background my-8 flex min-h-[calc(100vh-4rem)] w-full flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <h1 className="text-3xl font-bold">Settings</h1>
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>
                Customize how the application looks on your device.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Label>Color Mode</Label>
              <ColorMode />
            </CardContent>
          </Card>
          <Card className="border-destructive">
            <CardHeader className="text-destructive">
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>
                Irreversible and destructive actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Card>
                <CardHeader>
                  <CardTitle>Delete All Receipts</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Delete all your receipts and splits. This action cannot be
                    undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="self-end">
                  <DeleteAllReceiptsButton />
                </CardContent>
              </Card>
              <Card className="flex">
                <CardHeader>
                  <CardTitle>Delete Account</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm">
                    Delete your account and all associated data. This action
                    cannot be undone.
                  </CardDescription>
                </CardHeader>
                <CardContent className="self-end">
                  <DeleteAccountButton />
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </section>
    </ProtectedPage>
  );
}
