(function () {
  const ALLOWED_KEYS = new Set([
    "blocklist",
    "currentSessionId",
    "currentSessionSubject",
    "currentTask",
    "extensionInstalled",
    "firebaseApiKey",
    "firebaseIdToken",
    "firebaseProjectId",
    "firebaseRefreshToken",
    "sessionActive",
    "sessionEndTime",
    "studyOsAppUrl",
    "uid",
    "userName",
    "userPhotoUrl"
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
  postState("STUDYOS_FOCUS_GUARD_READY", { extensionInstalled: true });

  window.addEventListener("message", async (event) => {
    if (event.source !== window || !event.data) {
      return;
    }

    if (event.data.source === "studyos-web-app" && event.data.type === "STUDYOS_FOCUS_GUARD_SET") {
      const payload = sanitizePayload(event.data.payload);

      if (Object.keys(payload).length) {
        chrome.storage.local.set({ ...payload, extensionInstalled: true }).catch(() => {});
      }
    }

    if (event.data.source === "studyos-web-app" && event.data.type === "STUDYOS_FOCUS_GUARD_GET") {
      chrome.storage.local.get(null).then((items) => {
        postState("STUDYOS_FOCUS_GUARD_STATE", sanitizePayload(items));
      });
    }
  });
})();
