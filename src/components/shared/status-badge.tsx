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
  // shopify fulfillment status (OrderDisplayFulfillmentStatus, lowercased)
  fulfilled: "default",
  unfulfilled: "destructive",
  partially_fulfilled: "secondary",
  in_progress: "secondary",
  on_hold: "secondary",
  restocked: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  semi_annual: "Semi-annual",
  at_maturity: "At maturity",
};

function label(status: string) {
  if (STATUS_LABELS[status]) return STATUS_LABELS[status];
  // Generic fallback for SCREAMING_SNAKE_CASE / snake_case values (e.g.
  // Shopify's fulfillment status enum) — "partially_fulfilled" -> "Partially fulfilled".
  return status
    .split("_")
    .map((word, i) => (i === 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_STYLES[status] ?? "outline"}>{label(status)}</Badge>;
}
