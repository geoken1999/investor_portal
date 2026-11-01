/** The day after a "YYYY-MM-DD" date, as "YYYY-MM-DD". */
export function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Shopify order search for a date range. A bare date in `created_at:<=2026-11-01` means the very start of that day,
 * which leaves out every order placed on the last day (including today's), so the end is "before the next day".
 */
export function createdAtQuery(from?: string, to?: string): string {
  const clauses: string[] = [];
  if (from) clauses.push(`created_at:>=${from}`);
  if (to) clauses.push(`created_at:<${nextDay(to)}`);
  return clauses.join(" ");
}
