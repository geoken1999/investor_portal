import { LogOut } from "lucide-react";
import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MobileNav } from "@/components/layout/mobile-nav";

function initials(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  return trimmed
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function AppHeader({
  name,
  email,
  roleLabel,
  brand,
  role,
}: {
  name: string;
  email: string;
  roleLabel: string;
  brand: string;
  role: "investor" | "admin";
}) {
  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 sm:px-6">
      <div className="flex items-center gap-2">
        <MobileNav brand={brand} role={role} />
        <div className="text-sm text-muted-foreground">{roleLabel}</div>
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 outline-none hover:bg-muted">
          <Avatar size="sm">
            <AvatarFallback>{initials(name || email)}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">
            {name || email}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex flex-col">
              <span className="font-medium">{name || "—"}</span>
              <span className="truncate text-xs font-normal text-muted-foreground">
                {email}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <form action={logout}>
            <DropdownMenuItem
              nativeButton
              render={
                <button type="submit" className="flex w-full items-center gap-1.5">
                  <LogOut />
                  Log out
                </button>
              }
            />
          </form>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
