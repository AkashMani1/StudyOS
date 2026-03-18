"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";

export function useSubscription() {
  const { profile } = useAuth();
  const subscription = profile?.subscription;

  return useMemo(
    () => ({
      subscription,
      isPro: false,
      hasLaunchAccess: true,
      validUntil: subscription?.validUntil ?? null
    }),
    [subscription]
  );
}
