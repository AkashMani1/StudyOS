"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "./use-auth";
import { getPublicEnv } from "@/lib/env";

/**
 * Hook to synchronize StudyOS authentication and focus state with the Chrome extension.
 * It uses window.postMessage to communicate with the extension's content script bridge.
 */
export function useExtensionSync() {
  const { user, profile, session } = useAuth();
  const env = getPublicEnv();

  const syncToExtension = useCallback(async () => {
    const source = "studyos-web-app";
    const type = "STUDYOS_FOCUS_GUARD_SET";

    if (!user) {
      window.postMessage(
        {
          source,
          type,
          payload: {
            uid: "",
            userName: "",
            userPhotoUrl: "",
            firebaseIdToken: "",
            firebaseApiKey: env.firebaseApiKey,
            firebaseProjectId: env.firebaseProjectId,
            sessionActive: false,
            currentSessionId: "",
            currentTask: "",
            sessionEndTime: "",
            blocklist: []
          }
        },
        "*"
      );
      return;
    }

    try {
      // Get a fresh ID token for the extension to use
      const idToken = await user.getIdToken();

      window.postMessage(
        {
          source,
          type,
          payload: {
            uid: user.uid,
            userName: user.displayName || profile?.displayName || "",
            userPhotoUrl: user.photoURL || "",
            firebaseIdToken: idToken,
            firebaseApiKey: env.firebaseApiKey,
            firebaseProjectId: env.firebaseProjectId,
            sessionActive: !!profile?.sessionActive,
            currentSessionId: profile?.currentSessionId || "",
            currentTask: profile?.currentTask || "",
            sessionEndTime: profile?.sessionEndTime || "",
            blocklist: profile?.preferences?.blockedSites || []
          }
        },
        "*"
      );
    } catch (error) {
      console.error("Failed to sync with StudyOS extension", error);
    }
  }, [user, profile, env.firebaseApiKey, env.firebaseProjectId]);

  useEffect(() => {
    const handleExtensionMessage = (event: MessageEvent) => {
      // Only accept messages from our extension's content script
      if (
        event.source !== window ||
        !event.data ||
        event.data.source !== "studyos-focus-guard-extension"
      ) {
        return;
      }

      // When the extension bridge is ready, trigger an immediate sync
      if (event.data.type === "STUDYOS_FOCUS_GUARD_READY") {
        void syncToExtension();
      }

      // Extension might also request state explicitly
      if (event.data.type === "STUDYOS_FOCUS_GUARD_GET") {
        void syncToExtension();
      }
    };

    window.addEventListener("message", handleExtensionMessage);

    // Initial sync attempt
    void syncToExtension();

    return () => {
      window.removeEventListener("message", handleExtensionMessage);
    };
  }, [syncToExtension]);
}
