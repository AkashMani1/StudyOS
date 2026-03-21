"use client";

import { Card, SectionHeading } from "@/components/ui";

export function SubscriptionCard() {
  return (
    <Card className="space-y-5 bg-gradient-to-br from-indigo-950 to-indigo-800 text-white">
      <SectionHeading
        eyebrow="Free launch"
        title="Everything is open right now"
        description="StudyOS is launching as a free product. Planning, analytics, rooms, leaderboard, and coaching are available to every signed-in student."
      />
      <div className="rounded-xl bg-white/10 px-4 py-4 text-sm text-white/80">
        There is no upgrade flow or paywall in the current release. The focus right now is reliability, retention, and real student outcomes.
      </div>
    </Card>
  );
}
