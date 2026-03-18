import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  LayoutDashboard,
  ListTodo,
  Medal,
  Settings,
  Shield,
  Users
} from "lucide-react";

export const SESSION_COOKIE_NAME = "studyo_session";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const primaryNavItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/planner", label: "Planner", icon: ListTodo },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/rooms", label: "Rooms", icon: Users }
];

export const secondaryNavItems: NavItem[] = [
  { href: "/leaderboard", label: "Leaderboard", icon: Medal },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield }
];

export const protectedRoutePrefixes = [
  "/dashboard",
  "/planner",
  "/analytics",
  "/rooms",
  "/leaderboard",
  "/admin",
  "/settings"
];

export const premiumRoutePrefixes = ["/analytics", "/rooms", "/leaderboard"];
