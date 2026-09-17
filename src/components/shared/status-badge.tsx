import { Badge, badgeVariants } from "@/components/ui/badge";
import type { VariantProps } from "class-variance-authority";

type Variant = VariantProps<typeof badgeVariants>["variant"];

const STATUS_STYLES: Record<string, Variant> = {
  // profiles
  active: "default",
  invited: "secondary",
  disabled: "outline",
  // investments
  pending: "secondary",
  matured: "outline",
  exited: "secondary",
  cancelled: "destructive",
  // payouts
  scheduled: "secondary",
  processing: "secondary",
  paid: "default",
  failed: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  semi_annual: "Semi-annual",
  at_maturity: "At maturity",
};

function label(status: string) {
  return STATUS_LABELS[status] ?? status.charAt(0).toUpperCase() + status.slice(1);
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_STYLES[status] ?? "outline"}>{label(status)}</Badge>;
}
