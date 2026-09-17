import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Settings" };

export default async function AdminSettingsPage() {
  const profile = await requireAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Settings
        </h1>
        <p className="text-sm text-muted-foreground">{profile.email}</p>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Update your admin account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
