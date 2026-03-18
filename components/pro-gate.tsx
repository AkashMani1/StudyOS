"use client";

import type { ReactNode } from "react";
import { useSubscription } from "@/hooks/use-subscription";

export function ProGate({
  children
}: {
  children: ReactNode;
}) {
  const { hasLaunchAccess } = useSubscription();

  if (!hasLaunchAccess) {
    return null;
  }

  return <>{children}</>;
}
