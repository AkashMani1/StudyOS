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
        <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Name</p>
          <p className="mt-2 font-display text-2xl font-bold">{profile.displayName}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Email</p>
          <p className="mt-2 break-all font-semibold">{profile.email}</p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Role</p>
          <div className="mt-2">
            <Badge className="bg-comet text-white">{profile.role}</Badge>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5">
          <p className="text-sm text-slate-500 dark:text-slate-400">Notifications</p>
          <p className="mt-2 font-display text-2xl font-bold">
            {profile.preferences.notificationsEnabled ? "Enabled" : "Off"}
          </p>
        </div>
      </div>
    </Card>
  );
}
