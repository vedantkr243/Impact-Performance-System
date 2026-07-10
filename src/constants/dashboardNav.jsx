import {
  Brain,
  Gift,
  HandHeart,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Target,
  Trophy,
  User,
  Users,
  Wallet
} from "lucide-react";
import { ROUTES } from "./config";

export const USER_NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, to: ROUTES.DASHBOARD },
  { label: "My Performance", icon: Target, to: ROUTES.PERFORMANCE },
  { label: "Draws", icon: Trophy, to: ROUTES.DRAWS },
  { label: "Rewards", icon: Gift, to: ROUTES.REWARDS },
  { label: "AI Insights", icon: Brain, to: ROUTES.AI_INSIGHTS },
  // { label: "Impact", icon: HandHeart, to: ROUTES.DASHBOARD },
  { label: "Subscription", icon: ShieldCheck, to: "/dashboard/subscription" },
  { label: "Profile", icon: User, to: ROUTES.PROFILE },
  // { label: "Settings", icon: Settings, to: ROUTES.DASHBOARD }
];

export const ADMIN_NAV_ITEMS = [
  { label: "Overview", icon: LayoutDashboard, to: ROUTES.ADMIN_DASHBOARD },
  { label: "Users", icon: Users, to: ROUTES.ADMIN_USERS },
  { label: "Prize Pool", icon: Wallet, to: ROUTES.ADMIN_PRIZE_POOL },
  { label: "Draws", icon: Trophy, to: ROUTES.DRAWS },
  { label: "Settings", icon: Settings, to: ROUTES.ADMIN_DASHBOARD }
];

export const getNavItemsForRole = (user) =>
  String(user?.role || "").toLowerCase() === "admin" ? ADMIN_NAV_ITEMS : USER_NAV_ITEMS;
