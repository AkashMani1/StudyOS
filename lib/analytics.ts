"use client";

import mixpanel from "mixpanel-browser";
import { getPublicEnv } from "@/lib/env";
import { logFirebaseEvent } from "@/lib/firebase";

export type AnalyticsProperty = string | number | boolean | undefined;

let initialized = false;

export async function initAnalytics(): Promise<void> {
  if (initialized || typeof window === "undefined") {
    return;
  }

  const { mixpanelToken } = getPublicEnv();

  if (mixpanelToken) {
    mixpanel.init(mixpanelToken, {
      persistence: "localStorage",
      track_pageview: false
    });
  }

  initialized = true;
}

export async function trackEvent(
  eventName: string,
  properties: Record<string, AnalyticsProperty> = {}
): Promise<void> {
  await initAnalytics();
  mixpanel.track(eventName, properties);
  await logFirebaseEvent(eventName, properties);
}

export async function trackScreenView(screenName: string): Promise<void> {
  await trackEvent("screen_view", { screenName });
}
