import Decimal from "decimal.js";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatCurrency } from "@/lib/finance/calculations";
import type { ProductSaleLine } from "@/lib/shopify/sales";

export function ShopifySalesTable({
  lines,
  emptyMessage,
}: {
  lines: ProductSaleLine[];
  emptyMessage: string;
}) {
  if (!lines.length) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">{emptyMessage}</p>
    );
  }

  const currencyCode = lines[0].currencyCode;
  const total = lines.reduce((sum, line) => sum.add(line.lineTotal), new Decimal(0));

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Order</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Qty</TableHead>
          <TableHead>Selling price</TableHead>
          <TableHead>Fulfillment status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lines.map((line, i) => (
          <TableRow key={`${line.orderName}-${i}`}>
            <TableCell className="font-medium">{line.orderName}</TableCell>
            <TableCell>{line.date}</TableCell>
            <TableCell>{line.quantity}</TableCell>
            <TableCell>{formatCurrency(line.lineTotal, line.currencyCode)}</TableCell>
            <TableCell>
              <StatusBadge status={line.fulfillmentStatus.toLowerCase()} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3} className="text-muted-foreground">
            {lines.length} {lines.length === 1 ? "order" : "orders"}
          </TableCell>
          <TableCell className="font-semibold">
            Total: {formatCurrency(total, currencyCode)}
          </TableCell>
          <TableCell />
        </TableRow>
      </TableFooter>
    </Table>
  );
}
