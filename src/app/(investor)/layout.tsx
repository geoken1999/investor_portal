import { requireInvestor } from "@/lib/auth/guards";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { AppHeader } from "@/components/layout/app-header";

export default async function InvestorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await requireInvestor();

  return (
    <div className="flex min-h-screen">
      <SidebarNav brand="Investor Portal" role="investor" />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          name={profile.full_name}
          email={profile.email}
          roleLabel="Investor"
          brand="Investor Portal"
          role="investor"
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
