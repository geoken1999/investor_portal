"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit/log";
import {
  activateAccountSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export async function login(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword(
    parsed.data,
  );

  if (error || !data.user) {
    return { error: GENERIC_LOGIN_ERROR };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .single();

  if (!profile) {
    await supabase.auth.signOut();
    return { error: GENERIC_LOGIN_ERROR };
  }

  if (profile.status === "disabled") {
    await supabase.auth.signOut();
    return { error: "This account has been disabled. Contact your administrator." };
  }

  await logAuditEvent(supabase, {
    userId: data.user.id,
    action: "login",
    entity: "profiles",
    entityId: data.user.id,
  });

  if (profile.status === "invited") {
    redirect("/activate");
  }

  redirect(profile.role === "admin" ? "/admin/dashboard" : "/dashboard");
}

export async function logout(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  await supabase.auth.signOut();

  if (user) {
    await logAuditEvent(supabase, {
      userId: user.id,
      action: "logout",
      entity: "profiles",
      entityId: user.id,
    });
  }

  redirect("/login");
}

export async function requestPasswordReset(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/reset-password`,
  });

  await logAuditEvent(supabase, {
    userId: null,
    action: "password_reset_requested",
    metadata: { email: parsed.data.email },
  });

  // Always report success — never reveal whether an email is registered.
  return { success: true };
}

export async function resetPassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "password_reset",
    entity: "profiles",
    entityId: user.id,
  });

  redirect("/login");
}

export async function activateAccount(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = activateAccountSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your invitation link has expired. Please ask an admin to resend it." };
  }

  const { error: authError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
      status: "active",
    })
    .eq("id", user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "investor_activated",
    entity: "profiles",
    entityId: user.id,
  });

  redirect("/dashboard");
}

export async function changePassword(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return { error: "Your session has expired. Please sign in again." };
  }

  // Require the current password before allowing a change — protects
  // against a briefly-unattended, already-authenticated session being used
  // to lock the real owner out via a silent password change.
  const { error: verifyError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });
  if (verifyError) {
    return { fieldErrors: { currentPassword: ["Current password is incorrect"] } };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (updateError) {
    return { error: updateError.message };
  }

  await logAuditEvent(supabase, {
    userId: user.id,
    action: "password_changed",
    entity: "profiles",
    entityId: user.id,
  });

  return { success: true };
}
