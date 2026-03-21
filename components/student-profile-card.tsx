"use client";

import { Badge, Card, SectionHeading } from "@/components/ui";
import type { AppUserProfile } from "@/types/domain";

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

  return (
    <Card className="space-y-5">
      <SectionHeading
        eyebrow="Student profile"
        title={profile.displayName}
        description="This is your personal study identity inside StudyOS."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
          <p className="mt-2 font-display text-2xl font-bold">{profile.displayName}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-2 break-all font-semibold">{profile.email}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
          <div className="mt-2">
            <Badge className="bg-indigo-600 text-white border-transparent">{profile.role}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-white/5 dark:bg-slate-800/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Notifications</p>
          <p className="mt-2 font-display text-2xl font-bold">
            {profile.preferences.notificationsEnabled ? "Enabled" : "Off"}
          </p>
        </div>
      </div>
    </Card>
  );
}
