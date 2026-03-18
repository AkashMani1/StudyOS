"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SubscriptionCard } from "@/components/subscription-card";
import { Button, Card, Input, SectionHeading } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";
import { getExploreProfile } from "@/lib/explore-data";
import { savePreferences } from "@/services/study-service";

export function SettingsPanel() {
  const { user, profile } = useAuth();
  const baseProfile = profile ?? getExploreProfile();
  const [blockedSites, setBlockedSites] = useState(baseProfile.preferences.blockedSites.join(", "));
  const [notificationsEnabled, setNotificationsEnabled] = useState(baseProfile.preferences.notificationsEnabled);
  const [hardModeEnabled, setHardModeEnabled] = useState(baseProfile.preferences.hardModeEnabled);
  const [publicFailureLogEnabled, setPublicFailureLogEnabled] = useState(
    baseProfile.preferences.publicFailureLogEnabled
  );

  useEffect(() => {
    const nextProfile = profile ?? getExploreProfile();
    setBlockedSites(nextProfile.preferences.blockedSites.join(", "));
    setNotificationsEnabled(nextProfile.preferences.notificationsEnabled);
    setHardModeEnabled(nextProfile.preferences.hardModeEnabled);
    setPublicFailureLogEnabled(nextProfile.preferences.publicFailureLogEnabled);
  }, [profile]);

  const handleSave = async () => {
    if (!user || !profile) {
      toast.error("Sign in to save your settings and compete with your own profile.");
      return;
    }

    await savePreferences({
      ...profile.preferences,
      blockedSites: blockedSites.split(",").map((entry) => entry.trim()).filter(Boolean),
      notificationsEnabled,
      hardModeEnabled,
      publicFailureLogEnabled
    });
    toast.success("Preferences saved.");
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
      <SubscriptionCard />
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Settings"
          title="Control the friction, not the excuses"
          description="Edit your blocklist, notification behavior, hard mode, and public failure log preference."
        />
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold">Blocked sites</label>
            <Input
              value={blockedSites}
              onChange={(event) => setBlockedSites(event.target.value)}
              placeholder="youtube.com, instagram.com"
            />
          </div>
          <label className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-4 dark:bg-white/5">
            <span className="text-sm font-semibold">Notifications enabled</span>
            <input checked={notificationsEnabled} onChange={() => setNotificationsEnabled((value) => !value)} type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-4 dark:bg-white/5">
            <span className="text-sm font-semibold">Hard mode stake</span>
            <input checked={hardModeEnabled} onChange={() => setHardModeEnabled((value) => !value)} type="checkbox" />
          </label>
          <label className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-4 dark:bg-white/5">
            <span className="text-sm font-semibold">Public failure log</span>
            <input
              checked={publicFailureLogEnabled}
              onChange={() => setPublicFailureLogEnabled((value) => !value)}
              type="checkbox"
            />
          </label>
        </div>
        <Button onClick={() => void handleSave()}>Save preferences</Button>
      </Card>
    </div>
  );
}
