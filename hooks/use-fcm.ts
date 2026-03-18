"use client";

import { useEffect } from "react";
import { requestMessagingToken } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";

export function useFCMRegistration(): void {
  const { user, session } = useAuth();

  useEffect(() => {
    if (!user || !session) {
      return;
    }

    const syncToken = async () => {
      const token = await requestMessagingToken();

      if (!token) {
        return;
      }

      await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ fcmToken: token })
      });
    };

    void syncToken();
  }, [session, user]);
}
