"use client";

import { NavList } from "@/components/layout/nav-list";
import {
  ADMIN_NAV_ITEMS,
  INVESTOR_NAV_ITEMS,
  type NavItem,
} from "@/components/layout/nav-items";

export function SidebarNav({
  brand,
  role,
}: {
  brand: string;
  role: "investor" | "admin";
}) {
  const items: NavItem[] =
    role === "admin" ? ADMIN_NAV_ITEMS : INVESTOR_NAV_ITEMS;

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-sidebar text-sidebar-foreground md:flex">
      <div className="flex h-14 items-center border-b border-sidebar-border px-4">
        <span className="font-heading text-sm font-semibold tracking-tight">
          {brand}
        </span>
      </div>
      <NavList items={items} />
    </aside>
  );
}
