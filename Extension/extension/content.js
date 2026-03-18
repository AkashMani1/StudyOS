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

  function injectPageBridge() {
    const script = document.createElement("script");
    script.textContent = `
      (() => {
        const pending = new Map();
        let nextRequestId = 0;

        function request(type, payload, callback) {
          const requestId = "studyos-focus-guard-" + Date.now() + "-" + (++nextRequestId);

          if (typeof callback === "function") {
            pending.set(requestId, callback);
          }

          window.postMessage(
            {
              source: "studyos-focus-guard-page",
              type,
              payload,
              requestId
            },
            "*"
          );

          return Promise.resolve();
        }

        window.addEventListener("message", (event) => {
          if (
            event.source !== window ||
            !event.data ||
            event.data.source !== "studyos-focus-guard-extension-bridge"
          ) {
            return;
          }

          const callback = pending.get(event.data.requestId);

          if (callback) {
            callback(event.data.payload);
            pending.delete(event.data.requestId);
          }
        });

        window.chrome = window.chrome || {};
        window.chrome.storage = window.chrome.storage || {};

        const existingLocal = window.chrome.storage.local || {};

        window.chrome.storage.local = {
          ...existingLocal,
          get(keys, callback) {
            return new Promise((resolve) => {
              request("STUDYOS_FOCUS_GUARD_GET", { keys }, (result) => {
                if (typeof callback === "function") {
                  callback(result);
                }

                resolve(result);
              });
            });
          },
          set(items, callback) {
            return new Promise((resolve) => {
              request("STUDYOS_FOCUS_GUARD_SET", items, (result) => {
                if (typeof callback === "function") {
                  callback(result);
                }

                resolve(result);
              });
            });
          }
        };
      })();
    `;

    const parent = document.documentElement || document.head || document.body;

    if (parent) {
      parent.appendChild(script);
      script.remove();
    }
  }

  injectPageBridge();
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

    if (event.data.source === "studyos-focus-guard-page" && event.data.type === "STUDYOS_FOCUS_GUARD_SET") {
      const payload = sanitizePayload(event.data.payload);

      if (Object.keys(payload).length) {
        await chrome.storage.local.set({ ...payload, extensionInstalled: true });
      }

      postBridgeResponse("STUDYOS_FOCUS_GUARD_SET_RESULT", { ok: true }, event.data.requestId);
    }

    if (event.data.source === "studyos-focus-guard-page" && event.data.type === "STUDYOS_FOCUS_GUARD_GET") {
      const keys = event.data.payload && "keys" in event.data.payload ? event.data.payload.keys : null;
      const items = await chrome.storage.local.get(keys);
      postBridgeResponse("STUDYOS_FOCUS_GUARD_GET_RESULT", sanitizePayload(items), event.data.requestId);
    }
  });
})();
