function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function formatLocalTime(isoValue) {
  if (!isoValue) {
    return "Unknown";
  }

  const date = new Date(isoValue);

  if (isNaN(date.getTime())) {
    return "Unknown";
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: "numeric",
      minute: "2-digit"
    }).format(date);
  } catch (e) {
    return "Scheduled Time";
  }
}

function formatRemaining(endTime) {
  if (!endTime) {
    return "Session end time unavailable.";
  }

  const endMs = Date.parse(endTime);
  if (isNaN(endMs)) {
    return "Study session in progress.";
  }

  const remainingMs = endMs - Date.now();

  if (remainingMs <= 0) {
    return "This focus block is ending now.";
  }

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}m ${String(seconds).padStart(2, "0")}s remaining`;
}

async function loadBlockedState() {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain") || "this site";
  const returnUrl = params.get("returnUrl") || "";
  const state = await storageGet(["currentTask", "sessionActive", "sessionEndTime"]);

  document.getElementById("blocked-domain").textContent = domain;
  document.getElementById("task-name").textContent = state.currentTask
    ? `Current task: ${state.currentTask}`
    : "Current task: Stay on your StudyOS focus session";
  document.getElementById("session-end").textContent = state.sessionEndTime
    ? `Focus block ends at ${formatLocalTime(state.sessionEndTime)}`
    : "Focus block is active.";

  if (!state.sessionActive && returnUrl) {
    window.location.replace(returnUrl);
    return;
  }

  const countdownNode = document.getElementById("countdown");

  function updateCountdown() {
    countdownNode.textContent = formatRemaining(state.sessionEndTime);
  }

  updateCountdown();
  window.setInterval(updateCountdown, 1000);

  const overrideButton = document.getElementById("override-button");
  overrideButton.addEventListener("click", () => {
    overrideButton.disabled = true;

    chrome.runtime.sendMessage(
      {
        type: "focus-guard-override",
        domain,
        returnUrl
      },
      (response) => {
        if (!response || !response.ok) {
          overrideButton.disabled = false;
        }
      }
    );
  });
}

loadBlockedState();
