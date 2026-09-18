import { Loader2Icon } from "lucide-react";

/**
 * Used by every route's `loading.tsx` — shown by Next.js in place of the
 * page content while its Server Component's data fetching is in flight
 * (the surrounding layout, sidebar and header included, stays mounted).
 */
export function PageLoading() {
  return (
    <div className="flex flex-1 items-center justify-center py-24 text-muted-foreground">
      <Loader2Icon className="size-5 animate-spin" />
    </div>
  );
}
