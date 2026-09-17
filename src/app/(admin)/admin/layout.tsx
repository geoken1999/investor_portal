import { requireAdmin } from "@/lib/auth/guards";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireAdmin();

  return (
    <div className="flex min-h-screen">
      <SidebarNav brand="Investor Portal Admin" role="admin" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          name={profile.full_name}
          email={profile.email}
          roleLabel="Administrator"
          brand="Investor Portal Admin"
          role="admin"
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
