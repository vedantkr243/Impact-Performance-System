import {
  BarChart3,
  Brain,
  BrainCircuit,
  Gift,
  Globe2,
  HeartHandshake,
  ShieldCheck,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Ticket
} from "lucide-react";

const ICON_MAP = {
  Users,
  Trophy,
  Gift,
  HeartHandshake,
  Globe2,
  BarChart3,
  BrainCircuit,
  ShieldCheck,
  Target,
  TrendingUp,
  Brain,
  Ticket
};

export const resolveIcon = (name, fallback = BarChart3) => ICON_MAP[name] || fallback;

export const withIcons = (items, iconKey = "icon") =>
  (items || []).map((item) => ({
    ...item,
    icon: typeof item.icon === "function" ? item.icon : resolveIcon(item[iconKey], BarChart3)
  }));
