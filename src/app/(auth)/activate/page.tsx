import type { Metadata } from "next";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ActivateForm } from "@/components/auth/activate-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Activate your account" };

export default async function ActivatePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activate your account</CardTitle>
        <CardDescription>
          Confirm your details and create a password to get started.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ActivateForm email={user.email ?? ""} />
      </CardContent>
    </Card>
  );
}
