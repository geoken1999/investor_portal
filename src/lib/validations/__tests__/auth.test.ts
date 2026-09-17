import { describe, expect, it } from "vitest";
import {
  activateAccountSchema,
  addInvestorSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
} from "@/lib/validations/auth";

describe("loginSchema", () => {
  it("accepts a valid email/password pair", () => {
    const result = loginSchema.safeParse({
      email: "investor@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "anything",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an empty password", () => {
    const result = loginSchema.safeParse({
      email: "investor@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});

describe("forgotPasswordSchema", () => {
  it("rejects an invalid email", () => {
    expect(forgotPasswordSchema.safeParse({ email: "nope" }).success).toBe(
      false,
    );
  });
});

describe("resetPasswordSchema", () => {
  const strongPassword = "Str0ngPassw0rd";

  it("accepts matching strong passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects mismatched passwords", () => {
    const result = resetPasswordSchema.safeParse({
      password: strongPassword,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects a weak password (too short / missing character classes)", () => {
    const result = resetPasswordSchema.safeParse({
      password: "weak",
      confirmPassword: "weak",
    });
    expect(result.success).toBe(false);
  });
});

describe("activateAccountSchema", () => {
  const strongPassword = "Str0ngPassw0rd";

  it("accepts a valid activation payload without a phone number", () => {
    const result = activateAccountSchema.safeParse({
      fullName: "Jane Investor",
      phone: "",
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing full name", () => {
    const result = activateAccountSchema.safeParse({
      fullName: "",
      phone: "",
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(false);
  });
});

describe("addInvestorSchema", () => {
  it("accepts a valid payload", () => {
    const result = addInvestorSchema.safeParse({
      email: "new.investor@example.com",
      fullName: "New Investor",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid email", () => {
    const result = addInvestorSchema.safeParse({
      email: "invalid",
      fullName: "New Investor",
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  const strongPassword = "Str0ngPassw0rd";

  it("accepts matching strong passwords with a current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "whatever-it-was",
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a missing current password", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "",
      password: strongPassword,
      confirmPassword: strongPassword,
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "whatever-it-was",
      password: strongPassword,
      confirmPassword: "Different1",
    });
    expect(result.success).toBe(false);
  });
});
