import { 
  User, 
  GraduationCap, 
  Brain, 
  BookOpen, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  LucideIcon
} from "lucide-react";

export type AvatarId = "user" | "grad" | "brain" | "book" | "flame" | "shield" | "zap" | "sparkles";

export const AVATAR_MAP: Record<string, { icon: LucideIcon, color: string }> = {
  user: { icon: User, color: "bg-blue-500" },
  grad: { icon: GraduationCap, color: "bg-indigo-500" },
  brain: { icon: Brain, color: "bg-purple-500" },
  book: { icon: BookOpen, color: "bg-emerald-500" },
  flame: { icon: Flame, color: "bg-orange-500" },
  shield: { icon: ShieldCheck, color: "bg-slate-700" },
  zap: { icon: Zap, color: "bg-yellow-500" },
  sparkles: { icon: Sparkles, color: "bg-pink-500" },
};

export function getAvatar(id?: string) {
  return AVATAR_MAP[id || "user"] || AVATAR_MAP.user;
}
