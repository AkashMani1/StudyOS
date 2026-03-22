"use client";

import { useCallback, useEffect } from "react";
import { useAuth } from "./use-auth";
import { getPublicEnv } from "@/lib/env";
import { useStudyData } from "./use-study-data";

/**
 * Hook to synchronize StudyOS authentication and focus state with the Chrome extension.
 */
export function useExtensionSync() {
  const { user, profile } = useAuth();
  const { tasks, sessions } = useStudyData();
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
            firebaseApiKey: env.firebaseApiKey || "AIzaSyAbH_UQWoQnwgA_1-RcMOxEnZLVottWBGM",
            firebaseProjectId: env.firebaseProjectId || "studyos-4d50d",
            sessionActive: false,
            currentSessionId: "",
            currentTask: "",
            sessionEndTime: "",
            blocklist: [],
            coinsBalance: 0,
            streak: 0,
            focusTimeToday: "0m"
          }
        },
        "*"
      );
      return;
    }

    try {
      const idToken = await user.getIdToken();
      const today = new Date().toISOString().slice(0, 10);
      
      const todaySessions = sessions.filter(s => 
        s.completed && s.actualEnd && (s.actualEnd as any).toDate?.().toISOString().slice(0, 10) === today
      );

      const totalSeconds = todaySessions.reduce((acc, s) => {
        if (s.actualStart && s.actualEnd) {
          const start = (s.actualStart as any).toDate?.() || new Date(s.actualStart as any);
          const end = (s.actualEnd as any).toDate?.() || new Date(s.actualEnd as any);
          return acc + (end.getTime() - start.getTime()) / 1000;
        }
        return acc;
      }, 0);

      const focusTimeToday = `${Math.floor(totalSeconds / 60)}m`;

      const payload = {
        uid: user.uid,
        userName: user.displayName || profile?.displayName || "",
        userPhotoUrl: user.photoURL || "",
        firebaseIdToken: idToken,
        firebaseRefreshToken: (user as any).refreshToken || "",
        firebaseApiKey: "AIzaSyAbH_UQWoQnwgA_1-RcMOxEnZLVottWBGM",
        firebaseProjectId: "studyos-4d50d",
        sessionActive: !!profile?.sessionActive,
        currentSessionId: profile?.currentSessionId || "",
        currentSessionSubject: profile?.currentSessionSubject || "",
        currentTask: profile?.currentTask || "",
        sessionEndTime: profile?.sessionEndTime 
          ? (typeof profile.sessionEndTime === "string" 
              ? profile.sessionEndTime 
              : (profile.sessionEndTime as any).toDate?.().toISOString() || String(profile.sessionEndTime))
          : "",
        blocklist: profile?.preferences?.blockedSites || [],
        coinsBalance: profile?.wallet?.coins || 0,
        streak: (profile as any)?.streak || 0,
        focusTimeToday,
        todayTasks: (tasks || [])
          .filter(t => t.suggestedDay === today && !t.completed)
          .map(t => ({
            id: t.id,
            subject: t.subject,
            taskName: t.taskName,
            estimatedMinutes: t.estimatedMinutes
          }))
      };

      window.postMessage({ source, type, payload }, "*");
    } catch (error) {
      console.error("Failed to sync with StudyOS extension", error);
    }
  }, [user, profile, tasks, sessions, env.firebaseApiKey, env.firebaseProjectId]);

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
