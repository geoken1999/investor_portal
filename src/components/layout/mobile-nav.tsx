"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { NavList } from "@/components/layout/nav-list";
import {
  ADMIN_NAV_ITEMS,
  INVESTOR_NAV_ITEMS,
  type NavItem,
} from "@/components/layout/nav-items";

export function MobileNav({
  brand,
  role,
}: {
  brand: string;
  role: "investor" | "admin";
}) {
  const [open, setOpen] = useState(false);
  const items: NavItem[] =
    role === "admin" ? ADMIN_NAV_ITEMS : INVESTOR_NAV_ITEMS;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
            <Menu />
          </Button>
        }
      />
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b border-sidebar-border">
          <SheetTitle className="font-heading text-sm font-semibold tracking-tight">
            {brand}
          </SheetTitle>
        </SheetHeader>
        <NavList items={items} onLinkClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
