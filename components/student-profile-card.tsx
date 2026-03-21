"use client";

import { Badge, Card, SectionHeading } from "@/components/ui";
import type { AppUserProfile } from "@/types/domain";
import { getAvatar } from "@/lib/avatars";

export function StudentProfileCard({ profile }: { profile: AppUserProfile | null | undefined }) {
  if (!profile) {
    return (
      <Card className="space-y-4">
        <SectionHeading
          eyebrow="Student profile"
          title="Your profile is still syncing"
          description="StudyOS is connecting your name, settings, and progress."
        />
      </Card>
    );
  }

  const { icon: AvatarIcon, color: avatarColor } = getAvatar(profile.avatarId);

  return (
    <Card className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className={`flex h-20 w-20 shrink-0 items-center justify-center rounded-[28px] ${avatarColor} text-white shadow-xl`}>
          <AvatarIcon className="h-10 w-10" />
        </div>
        <div>
          <SectionHeading
            eyebrow="Student identity"
            title={profile.displayName}
            description={profile.school || "Focused Student @ StudyOS"}
          />
        </div>
      </div>

      {profile.bio && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">Academic Bio</p>
          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">{profile.bio}</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Email Reference</p>
          <p className="mt-2 break-all font-semibold text-sm">{profile.email}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Account Role</p>
          <div className="mt-2">
            <Badge className="bg-indigo-600 text-white border-transparent">{profile.role}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Alerts</p>
          <p className="mt-2 text-sm font-bold">
            {profile.preferences?.notificationsEnabled ? "Push Enabled" : "Silent Mode"}
          </p>
        </div>
      </div>
    </Card>
  );
}
