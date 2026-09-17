import {
  LayoutDashboard,
  Landmark,
  Wallet,
  FileText,
  FolderOpen,
  User,
  Users,
  ScrollText,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

// Defined here (rather than passed as props from the server layouts) because
// icon component references cannot cross the Server -> Client Component
// boundary — only plain serializable data can.
export const INVESTOR_NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/investments", label: "My Investments", icon: Landmark },
  { href: "/payouts", label: "Payouts", icon: Wallet },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/profile", label: "Profile", icon: User },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/investors", label: "Investors", icon: Users },
  { href: "/admin/investments", label: "Investments", icon: Landmark },
  { href: "/admin/payouts", label: "Payouts", icon: Wallet },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/documents", label: "Documents", icon: FolderOpen },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
