const FIREBASE_PROJECT = "studyos-4d50d";
const DEFAULT_BLOCKLIST = [
  "youtube.com",
  "instagram.com",
  "twitter.com",
  "reddit.com",
  "netflix.com"
];

let popupState = {
  focusStatus: null,
  highlightedBlock: null
};

function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function storageSet(items) {
  return chrome.storage.local.set(items);
}

function buildFirestoreBase(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map((entry) => toFirestoreValue(entry))
      }
    };
  }

  if (typeof value === "object") {
    return {
      mapValue: {
        fields: toFirestoreFields(value)
      }
    };
  }

  if (typeof value === "boolean") {
    return { booleanValue: value };
  }

  if (typeof value === "number") {
    if (Number.isInteger(value)) {
      return { integerValue: String(value) };
    }

    return { doubleValue: value };
  }

  return { stringValue: String(value) };
}

function toFirestoreFields(obj) {
  return Object.entries(obj || {}).reduce((fields, [key, value]) => {
    fields[key] = toFirestoreValue(value);
    return fields;
  }, {});
}

function fromFirestoreValue(value) {
  if (!value) {
    return null;
  }

  if ("stringValue" in value) {
    return value.stringValue;
  }

  if ("booleanValue" in value) {
    return value.booleanValue;
  }

  if ("integerValue" in value) {
    return Number(value.integerValue);
  }

  if ("doubleValue" in value) {
    return Number(value.doubleValue);
  }

  if ("timestampValue" in value) {
    return value.timestampValue;
  }

  if ("nullValue" in value) {
    return null;
  }

  if ("arrayValue" in value) {
    return (value.arrayValue.values || []).map((entry) => fromFirestoreValue(entry));
  }

  if ("mapValue" in value) {
    return fromFirestoreFields(value.mapValue.fields || {});
  }

  return null;
}

function fromFirestoreFields(fields) {
  return Object.entries(fields || {}).reduce((output, [key, value]) => {
    output[key] = fromFirestoreValue(value);
    return output;
  }, {});
}

function documentToData(document) {
  if (!document) {
    return null;
  }

  const parts = String(document.name || "").split("/");
  return {
    id: parts[parts.length - 1],
    ...fromFirestoreFields(document.fields || {})
  };
}

async function getFirestoreBase() {
  const { firebaseProjectId } = await storageGet(["firebaseProjectId"]);
  return buildFirestoreBase(firebaseProjectId || FIREBASE_PROJECT);
}

async function firestoreGet(path, idToken) {
  try {
    const firestoreBase = await getFirestoreBase();
    const response = await fetch(`${firestoreBase}/${path}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    if (response.status === 404) {
      return null;
    }

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error && json.error.message ? json.error.message : "Firestore GET failed");
    }

    return json;
  } catch (error) {
    console.error("firestoreGet failed", error);
    return null;
  }
}

async function firestoreSet(path, data, idToken) {
  try {
    const firestoreBase = await getFirestoreBase();
    const mask = Object.keys(data).join(",");
    const response = await fetch(`${firestoreBase}/${path}?updateMask.fieldPaths=${mask}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ fields: toFirestoreFields(data) })
    });

    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error && json.error.message ? json.error.message : "Firestore PATCH failed");
    }

    return true;
  } catch (error) {
    console.error("firestoreSet failed", error);
    return false;
  }
}

async function firestoreList(path, idToken, params) {
  try {
    const firestoreBase = await getFirestoreBase();
    const search = new URLSearchParams(params || {});
    const suffix = search.toString() ? `?${search.toString()}` : "";
    const response = await fetch(`${firestoreBase}/${path}${suffix}`, {
      headers: {
        Authorization: `Bearer ${idToken}`
      }
    });

    if (response.status === 404) {
      return [];
    }

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error && json.error.message ? json.error.message : "Firestore LIST failed");
    }

    return (json.documents || []).map((document) => documentToData(document));
  } catch (error) {
    console.error("firestoreList failed", error);
    return [];
  }
}

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function parseSessionTime(rawValue, dateKey) {
  if (!rawValue) {
    return "";
  }

  if (typeof rawValue === "string" && rawValue.includes("T")) {
    return rawValue;
  }

  if (typeof rawValue === "string" && /^\d{2}:\d{2}$/.test(rawValue)) {
    return `${dateKey}T${rawValue}:00.000Z`;
  }

  const parsed = new Date(rawValue);

  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString();
  }

  return "";
}

function formatTimeRange(startIso, endIso) {
  const formatter = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit"
  });

  return `${formatter.format(new Date(startIso))} - ${formatter.format(new Date(endIso))}`;
}

function formatDuration(seconds) {
  const minutes = Math.round(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const leftover = minutes % 60;
  return leftover ? `${hours}h ${leftover}m` : `${hours}h`;
}

function formatCountdown(endIso) {
  if (!endIso) {
    return "End time unavailable";
  }

  const remainingMs = Date.parse(endIso) - Date.now();

  if (remainingMs <= 0) {
    return "Ending now";
  }

  const minutes = Math.floor(remainingMs / 60000);
  const seconds = Math.floor((remainingMs % 60000) / 1000);
  return `${minutes}m ${String(seconds).padStart(2, "0")}s left`;
}

function normalizeDomain(domain) {
  return String(domain || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .trim();
}

function getInitials(name) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (!parts.length) {
    return "SO";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function normalizePlanBlocks(planDoc, dateKey) {
  const rawBlocks = (planDoc && (planDoc.timeBlocks || planDoc.blocks || planDoc.sessions)) || [];

  if (!Array.isArray(rawBlocks)) {
    return [];
  }

  return rawBlocks
    .map((block, index) => {
      const startTime = parseSessionTime(block.startTime || block.plannedStart || block.start, dateKey);
      const endTime = parseSessionTime(block.endTime || block.plannedEnd || block.end, dateKey);

      if (!startTime || !endTime) {
        return null;
      }

      return {
        id: block.sessionId || block.id || `${dateKey}-${index}`,
        subject: block.subject || "Study",
        taskName: block.taskName || block.task || block.title || "Focus block",
        startTime,
        endTime
      };
    })
    .filter(Boolean)
    .sort((left, right) => Date.parse(left.startTime) - Date.parse(right.startTime));
}

function getCurrentOrNextBlock(blocks) {
  const now = Date.now();
  let nextBlock = null;

  for (const block of blocks) {
    const startMs = Date.parse(block.startTime);
    const endMs = Date.parse(block.endTime);

    if (now >= startMs && now <= endMs) {
      return { ...block, state: "current" };
    }

    if (startMs > now && !nextBlock) {
      nextBlock = { ...block, state: "next" };
    }
  }

  return nextBlock;
}

function renderAuthStatus(auth, userDoc) {
  const node = document.getElementById("auth-status");

  if (!auth.uid || !auth.idToken) {
    node.innerHTML = `
      <div class="section-body">
        <div class="session-title">Open StudyOS to sign in</div>
        <div class="muted">Your Firebase ID token needs to be written into extension storage by the web app.</div>
      </div>
    `;
    return;
  }

  const name = userDoc.displayName || userDoc.name || auth.userName || auth.uid;
  node.innerHTML = `
    <div class="auth-row">
      <div class="avatar">${getInitials(name)}</div>
      <div>
        <div class="session-title">${name}</div>
        <div class="muted">${auth.uid}</div>
      </div>
    </div>
  `;
}

function renderSessions(blocks, highlightedBlock) {
  const node = document.getElementById("sessions-list");
  const startButton = document.getElementById("start-focus-button");

  if (!blocks.length) {
    node.innerHTML = `<div class="empty">No daily plan found for today.</div>`;
    startButton.disabled = true;
    return;
  }

  node.innerHTML = blocks
    .map((block) => {
      const cardClass =
        highlightedBlock && highlightedBlock.id === block.id
          ? `session-card ${highlightedBlock.state}`
          : "session-card";

      return `
        <div class="${cardClass}">
          <div class="session-title">${block.subject}: ${block.taskName}</div>
          <div class="session-meta">${formatTimeRange(block.startTime, block.endTime)}</div>
        </div>
      `;
    })
    .join("");

  startButton.disabled = !highlightedBlock;
}

function renderFocusStatus(focusStatus) {
  const node = document.getElementById("focus-status");
  const endButton = document.getElementById("end-focus-button");

  if (!focusStatus || !focusStatus.sessionActive) {
    node.innerHTML = `<div class="empty">No active focus session right now.</div>`;
    endButton.disabled = true;
    return;
  }

  node.innerHTML = `
    <div class="status-pill"><span class="status-dot"></span> Focus session active</div>
    <div class="session-title">${focusStatus.currentTask || "Current StudyOS task"}</div>
    <div class="session-meta">${formatCountdown(focusStatus.sessionEndTime)}</div>
  `;
  endButton.disabled = false;
}

function renderDistractionReport(siteUsage) {
  const node = document.getElementById("distraction-report");
  const entries = Object.entries(siteUsage || {})
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);

  if (!entries.length) {
    node.innerHTML = `<div class="empty">No tracked site usage yet today.</div>`;
    return;
  }

  node.innerHTML = entries
    .map(([domain, seconds]) => {
      const minutes = seconds / 60;
      const tone = minutes < 5 ? "good" : minutes <= 15 ? "warn" : "bad";

      return `
        <div class="report-item ${tone}">
          <span>${domain}</span>
          <span>${minutes.toFixed(minutes < 10 ? 1 : 0)} min</span>
        </div>
      `;
    })
    .join("");
}

function renderBlocklist(blocklist) {
  const node = document.getElementById("blocklist-tags");
  const list = blocklist.length ? blocklist : DEFAULT_BLOCKLIST;

  node.innerHTML = list
    .map(
      (domain) => `
        <span class="tag">
          ${domain}
          <button type="button" data-domain="${domain}" aria-label="Remove ${domain}">x</button>
        </span>
      `
    )
    .join("");
}

function renderStatsStrip(stats) {
  const node = document.getElementById("stats-strip");

  node.innerHTML = `
    <div class="stat-item"><span>Today's focus time</span><strong>${stats.focusTime}</strong></div>
    <div class="stat-item"><span>Coins balance</span><strong>${stats.coins}</strong></div>
    <div class="stat-item"><span>Current streak</span><strong>${stats.streak}</strong></div>
  `;
}

async function fetchPopupData() {
  const auth = await storageGet([
    "blocklist",
    "currentSessionId",
    "currentSessionSubject",
    "currentTask",
    "firebaseIdToken",
    "firebaseProjectId",
    "sessionActive",
    "sessionEndTime",
    "todaySiteUsage",
    "uid",
    "userName"
  ]);

  const isConfigured = auth.firebaseIdToken && auth.uid && (auth.firebaseProjectId || FIREBASE_PROJECT) !== "YOUR_PROJECT_ID";
  let userDoc = {};
  let dailyPlan = null;
  let sessions = [];
  let walletDoc = {};

  if (isConfigured) {
    const todayKey = getUtcDateKey();
    const [rawUserDoc, rawPlanDoc, rawSessions, rawWalletDoc] = await Promise.all([
      firestoreGet(`users/${auth.uid}`, auth.firebaseIdToken),
      firestoreGet(`users/${auth.uid}/dailyPlans/${todayKey}`, auth.firebaseIdToken),
      firestoreList(`users/${auth.uid}/sessions`, auth.firebaseIdToken, { pageSize: "50" }),
      firestoreGet(`users/${auth.uid}/wallet/summary`, auth.firebaseIdToken)
    ]);

    userDoc = documentToData(rawUserDoc) || {};
    dailyPlan = documentToData(rawPlanDoc);
    sessions = rawSessions || [];
    walletDoc = documentToData(rawWalletDoc) || {};
  }

  const blocks = normalizePlanBlocks(dailyPlan, getUtcDateKey());
  const highlightedBlock = getCurrentOrNextBlock(blocks);
  const focusStatus = {
    sessionActive: Boolean(auth.sessionActive || userDoc.sessionActive),
    currentTask: auth.currentTask || userDoc.currentTask || "",
    sessionEndTime: auth.sessionEndTime || userDoc.sessionEndTime || "",
    currentSessionId: auth.currentSessionId || userDoc.currentSessionId || "",
    currentSessionSubject: auth.currentSessionSubject || userDoc.currentSessionSubject || ""
  };
  const todaysSessions = sessions.filter((session) => {
    if (!session.actualEnd || !session.completed) {
      return false;
    }

    return String(session.actualEnd).slice(0, 10) === getUtcDateKey();
  });
  const totalFocusSeconds = todaysSessions.reduce((sum, session) => {
    if (session.actualDurationSeconds) {
      return sum + Number(session.actualDurationSeconds || 0);
    }

    if (session.startedAt && session.actualEnd) {
      return sum + Math.max(0, Math.round((Date.parse(session.actualEnd) - Date.parse(session.startedAt)) / 1000));
    }

    return sum;
  }, 0);

  popupState = {
    focusStatus,
    highlightedBlock
  };

  renderAuthStatus(auth, userDoc);
  renderSessions(blocks, highlightedBlock);
  renderFocusStatus(focusStatus);
  renderDistractionReport(auth.todaySiteUsage || {});
  renderBlocklist(Array.isArray(auth.blocklist) && auth.blocklist.length ? auth.blocklist : DEFAULT_BLOCKLIST);
  renderStatsStrip({
    focusTime: formatDuration(totalFocusSeconds),
    coins: String(walletDoc.coinsBalance || userDoc.coinsBalance || userDoc.walletBalance || 0),
    streak: `${userDoc.currentStreak || userDoc.streak || walletDoc.currentStreak || 0} days`
  });
}

async function startFocusSession() {
  const auth = await storageGet(["firebaseIdToken", "firebaseProjectId", "uid"]);
  const block = popupState.highlightedBlock;

  if (!auth.firebaseIdToken || !auth.uid || !block || (auth.firebaseProjectId || FIREBASE_PROJECT) === "YOUR_PROJECT_ID") {
    return;
  }

  const startedAt = new Date().toISOString();
  await Promise.all([
    firestoreSet(
      `users/${auth.uid}`,
      {
        currentSessionId: block.id,
        currentSessionSubject: block.subject,
        currentTask: block.taskName,
        sessionActive: true,
        sessionEndTime: block.endTime
      },
      auth.firebaseIdToken
    ),
    firestoreSet(
      `users/${auth.uid}/sessions/${block.id}`,
      {
        completed: false,
        plannedEnd: block.endTime,
        plannedStart: block.startTime,
        startedAt,
        subject: block.subject,
        taskName: block.taskName
      },
      auth.firebaseIdToken
    ),
    storageSet({
      currentSessionId: block.id,
      currentSessionSubject: block.subject,
      currentTask: block.taskName,
      sessionActive: true,
      sessionEndTime: block.endTime
    })
  ]);

  await fetchPopupData();
}

async function endFocusSession() {
  const auth = await storageGet([
    "currentSessionId",
    "firebaseIdToken",
    "firebaseProjectId",
    "sessionEndTime",
    "uid"
  ]);

  if (!auth.firebaseIdToken || !auth.uid || (auth.firebaseProjectId || FIREBASE_PROJECT) === "YOUR_PROJECT_ID") {
    return;
  }

  const actualEnd = new Date().toISOString();
  const sessionId = popupState.focusStatus.currentSessionId || auth.currentSessionId;
  const startedSession = sessionId
    ? await firestoreGet(`users/${auth.uid}/sessions/${sessionId}`, auth.firebaseIdToken)
    : null;
  const sessionDoc = documentToData(startedSession) || {};
  const durationSeconds =
    sessionDoc.startedAt && actualEnd
      ? Math.max(0, Math.round((Date.parse(actualEnd) - Date.parse(sessionDoc.startedAt)) / 1000))
      : 0;

  await Promise.all([
    firestoreSet(
      `users/${auth.uid}`,
      {
        sessionActive: false,
        sessionEndTime: "",
        currentTask: "",
        currentSessionId: "",
        currentSessionSubject: ""
      },
      auth.firebaseIdToken
    ),
    sessionId
      ? firestoreSet(
          `users/${auth.uid}/sessions/${sessionId}`,
          {
            actualDurationSeconds: durationSeconds,
            actualEnd,
            completed: true
          },
          auth.firebaseIdToken
        )
      : Promise.resolve(false),
    storageSet({
      sessionActive: false,
      sessionEndTime: "",
      currentTask: "",
      currentSessionId: "",
      currentSessionSubject: ""
    })
  ]);

  await fetchPopupData();
}

async function addDomainToBlocklist(rawDomain) {
  const normalized = normalizeDomain(rawDomain);

  if (!normalized) {
    return;
  }

  const state = await storageGet(["blocklist"]);
  const next = Array.isArray(state.blocklist) ? state.blocklist.slice() : DEFAULT_BLOCKLIST.slice();

  if (!next.includes(normalized)) {
    next.push(normalized);
    await storageSet({ blocklist: next });
    renderBlocklist(next);
  }
}

async function removeDomainFromBlocklist(domain) {
  const state = await storageGet(["blocklist"]);
  const current = Array.isArray(state.blocklist) ? state.blocklist : DEFAULT_BLOCKLIST.slice();
  const next = current.filter((entry) => entry !== domain);
  await storageSet({ blocklist: next });
  renderBlocklist(next);
}

function bindEvents() {
  document.getElementById("start-focus-button").addEventListener("click", startFocusSession);
  document.getElementById("end-focus-button").addEventListener("click", endFocusSession);

  const blocklistInput = document.getElementById("blocklist-input");
  blocklistInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    const value = blocklistInput.value;
    blocklistInput.value = "";
    await addDomainToBlocklist(value);
  });

  document.getElementById("blocklist-tags").addEventListener("click", (event) => {
    if (event.target instanceof HTMLButtonElement && event.target.dataset.domain) {
      removeDomainFromBlocklist(event.target.dataset.domain);
    }
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") {
      return;
    }

    if (
      changes.blocklist ||
      changes.currentTask ||
      changes.firebaseIdToken ||
      changes.sessionActive ||
      changes.sessionEndTime ||
      changes.todaySiteUsage ||
      changes.uid
    ) {
      fetchPopupData();
    }
  });

  window.setInterval(() => {
    renderFocusStatus(popupState.focusStatus);
  }, 1000);
}

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await storageSet({ extensionInstalled: true });
  await fetchPopupData();
});
