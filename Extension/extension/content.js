(function () {
  const ALLOWED_KEYS = new Set([
    "blocklist",
    "coinsBalance",
    "currentSessionId",
    "currentSessionSubject",
    "currentStreak",
    "currentTask",
    "extensionInstalled",
    "firebaseApiKey",
    "firebaseIdToken",
    "firebaseProjectId",
    "firebaseRefreshToken",
    "focusTimeToday",
    "sessionActive",
    "sessionEndTime",
    "streak",
    "studyOsAppUrl",
    "todaySiteUsage",
    "todayTasks",
    "profileTasks",
    "uid",
    "userName",
    "userPhotoUrl",
    "walletBalance"
  ]);

  function sanitizePayload(payload) {
    return Object.entries(payload || {}).reduce((clean, [key, value]) => {
      if (ALLOWED_KEYS.has(key)) {
        clean[key] = value;
      }

      return clean;
    }, {});
  }

  function postState(type, payload) {
    window.postMessage(
      {
        source: "studyos-focus-guard-extension",
        type,
        payload
      },
      "*"
    );
  }

  function postBridgeResponse(type, payload, requestId) {
    window.postMessage(
      {
        source: "studyos-focus-guard-extension-bridge",
        type,
        payload,
        requestId
      },
      "*"
    );
  }

  chrome.storage.local.set({ extensionInstalled: true }).catch(() => {});
  
  // Send READY message multiple times to ensure the React app catches it during boot
  let readyAttempts = 0;
  const sendReady = () => {
    postState("STUDYOS_FOCUS_GUARD_READY", { extensionInstalled: true });
    readyAttempts++;
    if (readyAttempts < 5) {
      setTimeout(sendReady, 1000);
    }
  };
  sendReady();

  window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) {
      return;
    }

    if (event.data.source === "studyos-web-app" && event.data.type === "STUDYOS_FOCUS_GUARD_SET") {
      console.log("[StudyOS Focus Guard] Received SET message from web app:", event.data.payload);
      const payload = sanitizePayload(event.data.payload);
      console.log("[StudyOS Focus Guard] Sanitized payload:", payload);

      if (Object.keys(payload).length) {
        try {
          chrome.storage.local.set({ ...payload, extensionInstalled: true })
            .then(() => console.log("[StudyOS Focus Guard] Successfully saved to storage."))
            .catch((err) => {
              if (err.message.includes("Extension context invalidated")) {
                console.warn("[StudyOS Focus Guard] Extension context invalidated. Please refresh the page.");
              } else {
                console.error("[StudyOS Focus Guard] Storage save error:", err);
              }
            });
        } catch (err) {
          if (!err.message.includes("Extension context invalidated")) {
            console.error("[StudyOS Focus Guard] Sync error:", err);
          }
        }
      } else {
        console.warn("[StudyOS Focus Guard] Payload empty after sanitization.");
      }
    }

    if (event.data.source === "studyos-web-app" && event.data.type === "STUDYOS_FOCUS_GUARD_GET") {
      console.log("[StudyOS Focus Guard] Received GET message from web app");
      chrome.storage.local.get(null).then((items) => {
        postState("STUDYOS_FOCUS_GUARD_STATE", sanitizePayload(items));
      });
    }
  });
})();
