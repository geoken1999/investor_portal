import type { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { getAllProfiles, toProfileMap } from "@/lib/admin/lookups";

export const metadata: Metadata = { title: "Audit Logs" };

const LOG_LIMIT = 200;

export default async function AdminAuditLogsPage() {
  const supabase = await createClient();
  const [{ data: logs }, profiles] = await Promise.all([
    supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(LOG_LIMIT),
    getAllProfiles(supabase),
  ]);
  const profileMap = toProfileMap(profiles);

  const rows = logs ?? [];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">
          Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Login, data changes, and document activity across the portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent activity</CardTitle>
          <CardDescription>Most recent {LOG_LIMIT} events</CardDescription>
        </CardHeader>
        <CardContent>
          {!rows.length ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No activity recorded yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((log) => {
                  const user = log.user_id ? profileMap.get(log.user_id) : null;
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {user?.full_name || user?.email || "System"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {log.entity ? `${log.entity}${log.entity_id ? ` (${log.entity_id.slice(0, 8)})` : ""}` : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
