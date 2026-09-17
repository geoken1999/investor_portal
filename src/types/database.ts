/**
 * Hand-written types for the application's tables.
 * As later modules add tables, extend this file (or switch to
 * `supabase gen types typescript` once a live project exists).
 *
 * NOTE: table row/insert/update shapes must be `type` aliases, not
 * `interface`s — supabase-js's generic Database plumbing resolves each
 * table against `Record<string, unknown>` inside a conditional type, and an
 * `interface` (no implicit index signature) fails that check silently,
 * collapsing every query's row type to `never`.
 */

export type UserRole = "investor" | "admin";
export type ProfileStatus = "invited" | "active" | "disabled";

export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type PaymentFrequency =
  | "monthly"
  | "quarterly"
  | "semi_annual"
  | "annual"
  | "at_maturity";
export type InvestmentStatus =
  | "pending"
  | "active"
  | "matured"
  | "cancelled"
  | "exited";

// Postgres `numeric` columns come back from postgrest as strings (to avoid
// float precision loss) — every money/rate field below is typed `string`
// and must go through src/lib/finance/calculations.ts (decimal.js), never
// native arithmetic.
export type Investment = {
  id: string;
  investor_id: string;
  investment_type: string;
  principal_amount: string;
  start_date: string;
  maturity_date: string | null;
  return_rate: string;
  payment_frequency: PaymentFrequency;
  status: InvestmentStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PayoutStatus =
  | "scheduled"
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled";

export type Payout = {
  id: string;
  investment_id: string;
  investor_id: string;
  amount: string;
  payout_date: string;
  status: PayoutStatus;
  reference_number: string | null;
  created_at: string;
  updated_at: string;
};

export type DocumentCategory =
  | "agreement"
  | "investment_statement"
  | "payout_statement"
  | "quarterly_report"
  | "annual_statement"
  | "tax_document";

export type Document = {
  id: string;
  investor_id: string;
  investment_id: string | null;
  category: DocumentCategory;
  title: string;
  storage_path: string;
  file_size: number | null;
  uploaded_by: string | null;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; email: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog> & { action: string };
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      investments: {
        Row: Investment;
        Insert: Partial<Investment> & {
          investor_id: string;
          investment_type: string;
          principal_amount: string;
          start_date: string;
          return_rate: string;
          payment_frequency: PaymentFrequency;
        };
        Update: Partial<Investment>;
        Relationships: [];
      };
      payouts: {
        Row: Payout;
        Insert: Partial<Payout> & {
          investment_id: string;
          investor_id: string;
          amount: string;
          payout_date: string;
        };
        Update: Partial<Payout>;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: Partial<Document> & {
          investor_id: string;
          category: DocumentCategory;
          title: string;
          storage_path: string;
        };
        Update: Partial<Document>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
};
