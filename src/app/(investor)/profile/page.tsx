import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { requireInvestor } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Profile" };

export default async function InvestorProfilePage() {
  const profile = await requireInvestor();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Profile
        </h1>
        <p className="text-sm text-muted-foreground">
          Your account details.
        </p>
      </div>
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Contact information</CardTitle>
          <CardDescription>
            Editing your name and phone arrives in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm">
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-muted-foreground">Full name</span>
            <span className="font-medium">{profile.full_name || "—"}</span>
          </div>
          <div className="flex justify-between border-b border-border pb-2">
            <span className="text-muted-foreground">Email</span>
            <span className="font-medium">{profile.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Phone</span>
            <span className="font-medium">{profile.phone || "—"}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>
            If an admin set up your account, change your temporary password here.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
