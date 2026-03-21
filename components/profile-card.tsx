"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { 
  User, 
  GraduationCap, 
  Brain, 
  BookOpen, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Sparkles,
  Check,
  Save
} from "lucide-react";
import { Card, SectionHeading, Button, Input } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { updateProfile } from "@/services/study-service";
import { cn } from "@/lib/utils";

const AVATARS = [
  { id: "user", icon: User, color: "bg-blue-500" },
  { id: "grad", icon: GraduationCap, color: "bg-indigo-500" },
  { id: "brain", icon: Brain, color: "bg-purple-500" },
  { id: "book", icon: BookOpen, color: "bg-emerald-500" },
  { id: "flame", icon: Flame, color: "bg-orange-500" },
  { id: "shield", icon: ShieldCheck, color: "bg-slate-700" },
  { id: "zap", icon: Zap, color: "bg-yellow-500" },
  { id: "sparkles", icon: Sparkles, color: "bg-pink-500" },
];

export function ProfileCard() {
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [school, setSchool] = useState(profile?.school || "");
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatarId || "user");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setBio(profile.bio || "");
      setSchool(profile.school || "");
      setSelectedAvatar(profile.avatarId || "user");
    }
  }, [profile]);

  const cooldownDays = profile?.lastProfileUpdate ? (() => {
    const lastUpdate = (profile.lastProfileUpdate as any).toDate?.() || new Date(profile.lastProfileUpdate as string);
    const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    const diff = Date.now() - lastUpdate.getTime();
    return diff < thirtyDaysMs ? Math.ceil((thirtyDaysMs - diff) / (24 * 60 * 60 * 1000)) : 0;
  })() : 0;

  const handleSave = async () => {
    if (cooldownDays > 0) {
      toast.error(`Profile locked. Please wait ${cooldownDays} more days to update again.`);
      return;
    }

    if (!user) {
      toast.error("Please sign in to save your profile.");
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        displayName,
        bio,
        school,
        avatarId: selectedAvatar
      });
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="space-y-6 overflow-hidden">
      <SectionHeading
        eyebrow="Identity"
        title="Scholarly Presence"
        description={cooldownDays > 0 
          ? `Profile locked for ${cooldownDays} more days.` 
          : "Craft your public persona. Updates are limited to once per month."
        }
      />

      <div className="space-y-4">
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Choose your Avatar {cooldownDays > 0 && "(Locked)"}
          </label>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {AVATARS.map((avatar) => {
              const Icon = avatar.icon;
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  disabled={cooldownDays > 0}
                  onClick={() => setSelectedAvatar(avatar.id)}
                  className={cn(
                    "relative flex aspect-square items-center justify-center rounded-2xl transition-all duration-200 hover:scale-105 active:scale-95",
                    avatar.color,
                    isSelected ? "ring-4 ring-indigo-600 ring-offset-4 dark:ring-offset-slate-900" : "opacity-60 grayscale-[0.5] hover:opacity-100 hover:grayscale-0",
                    cooldownDays > 0 && "cursor-not-allowed opacity-40 grayscale"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                  {isSelected && (
                    <div className="absolute -right-1 -top-1 rounded-full bg-white p-0.5 shadow-lg">
                      <Check className="h-3 w-3 text-indigo-600" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">User Name</label>
            <Input 
              placeholder="Your display name" 
              value={displayName}
              disabled={cooldownDays > 0}
              onChange={(e) => setDisplayName(e.target.value)}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Institute / School</label>
            <Input 
              placeholder="e.g. Stanford University" 
              value={school}
              disabled={cooldownDays > 0}
              onChange={(e) => setSchool(e.target.value)}
              className="disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">Academic Bio</label>
          <textarea
            className="flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/5 dark:bg-slate-900 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
            placeholder="Tell us about your study goals..."
            value={bio}
            disabled={cooldownDays > 0}
            onChange={(e) => setBio(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {cooldownDays > 0 ? (
          <div className="text-sm font-medium text-amber-600 dark:text-amber-400">
            Next update available in {cooldownDays} days.
          </div>
        ) : (
          <div className="text-xs text-slate-500 italic">
            Note: You can only update your profile once every 30 days.
          </div>
        )}
        <Button 
          className="w-full sm:w-auto" 
          onClick={handleSave}
          disabled={loading || cooldownDays > 0}
        >
          {loading ? "Saving..." : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {cooldownDays > 0 ? "Profile Locked" : "Save Profile"}
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
