import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth/guards";

export default async function RootPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.status === "invited") redirect("/activate");
  redirect(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
}
