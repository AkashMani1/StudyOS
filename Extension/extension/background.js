const FIREBASE_PROJECT = "studyos-4d50d";
const DEFAULT_BLOCKLIST = [
  "youtube.com",
  "instagram.com",
  "twitter.com",
  "reddit.com",
  "netflix.com"
];
const ALARMS = {
  SITE_USAGE_SYNC: "focus-guard-site-usage-sync",
  FOCUS_POLL: "focus-guard-focus-poll",
  TOKEN_REFRESH: "focus-guard-token-refresh",
  SESSION_REMINDERS: "focus-guard-session-reminders",
  DISTRACTION_CHECK: "focus-guard-distraction-check"
};
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const STUDY_OVERRIDE_MS = 5 * 60 * 1000;

let cachedFocusState = {
  sessionActive: false,
  currentTask: "",
  sessionEndTime: "",
  currentSessionId: "",
  currentSessionSubject: ""
};

function storageGet(keys) {
  return chrome.storage.local.get(keys);
}

function storageSet(items) {
  return chrome.storage.local.set(items);
}

function storageRemove(keys) {
  return chrome.storage.local.remove(keys);
}

function getUtcDateKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function normalizeDomain(hostname) {
  return String(hostname || "")
    .toLowerCase()
    .replace(/^www\./, "")
    .trim();
}

function extractHostname(url) {
  try {
    const parsed = new URL(url);
    return normalizeDomain(parsed.hostname);
  } catch (error) {
    return "";
  }
}

function isTrackableUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch (error) {
    return false;
  }
}

function buildFirestoreBase(projectId) {
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
}

async function getFirestoreBase() {
  const { firebaseProjectId } = await storageGet(["firebaseProjectId"]);
  return buildFirestoreBase(firebaseProjectId || FIREBASE_PROJECT);
}

function toFirestoreValue(value) {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }

  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
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

  const data = fromFirestoreFields(document.fields || {});
  const segments = String(document.name || "").split("/");

  return {
    id: segments[segments.length - 1],
    ...data
  };
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
    const mask = Object.keys(data).map(key => `updateMask.fieldPaths=${encodeURIComponent(key)}`).join("&");
    const response = await fetch(`${firestoreBase}/${path}?${mask}`, {
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

async function firestoreCreate(path, data, idToken, documentId) {
  try {
    const firestoreBase = await getFirestoreBase();
    const query = documentId ? `?documentId=${encodeURIComponent(documentId)}` : "";
    const response = await fetch(`${firestoreBase}/${path}${query}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`
      },
      body: JSON.stringify({ fields: toFirestoreFields(data) })
    });

    if (!response.ok) {
      const json = await response.json();
      throw new Error(json.error && json.error.message ? json.error.message : "Firestore POST failed");
    }

    return response.json();
  } catch (error) {
    console.error("firestoreCreate failed", error);
    return null;
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

async function getAuthContext() {
  const auth = await storageGet([
    "firebaseApiKey",
    "firebaseIdToken",
    "firebaseProjectId",
    "firebaseRefreshToken",
    "uid"
  ]);

  return {
    apiKey: auth.firebaseApiKey || "",
    idToken: auth.firebaseIdToken || "",
    projectId: auth.firebaseProjectId || FIREBASE_PROJECT,
    refreshToken: auth.firebaseRefreshToken || "",
    uid: auth.uid || ""
  };
}

async function ensureDefaultStorage() {
  const current = await storageGet([
    "blocklist",
    "extensionInstalled",
    "focusGuardGracePeriods",
    "pendingSiteUsageByDate",
    "todaySiteUsage",
    "todaySiteUsageDate"
  ]);

  const patch = {};
  const todayKey = getUtcDateKey();

  if (!Array.isArray(current.blocklist)) {
    patch.blocklist = DEFAULT_BLOCKLIST.slice();
  }

  if (!current.extensionInstalled) {
    patch.extensionInstalled = true;
  }

  if (!current.focusGuardGracePeriods || typeof current.focusGuardGracePeriods !== "object") {
    patch.focusGuardGracePeriods = {};
  }

  if (!current.pendingSiteUsageByDate || typeof current.pendingSiteUsageByDate !== "object") {
    patch.pendingSiteUsageByDate = {};
  }

  if (!current.todaySiteUsage || typeof current.todaySiteUsage !== "object") {
    patch.todaySiteUsage = {};
  }

  if (!current.todaySiteUsageDate) {
    patch.todaySiteUsageDate = todayKey;
  }

  if (Object.keys(patch).length) {
    await storageSet(patch);
  }
}

async function ensureTodayUsageBucket() {
  const todayKey = getUtcDateKey();
  const { todaySiteUsageDate } = await storageGet(["todaySiteUsageDate"]);

  if (todaySiteUsageDate !== todayKey) {
    await storageSet({
      todaySiteUsage: {},
      todaySiteUsageDate: todayKey
    });
  }
}

function getUtcMidnightAfter(timestampMs) {
  const date = new Date(timestampMs);
  return Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate() + 1,
    0,
    0,
    0,
    0
  );
}

async function addUsageAcrossDays(domain, startMs, endMs) {
  if (!domain || !Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    return;
  }

  await ensureTodayUsageBucket();

  const state = await storageGet([
    "pendingSiteUsageByDate",
    "todaySiteUsage",
    "todaySiteUsageDate"
  ]);
  const pendingSiteUsageByDate = state.pendingSiteUsageByDate || {};
  const todaySiteUsage = state.todaySiteUsage || {};
  const todayKey = getUtcDateKey();
  let cursor = startMs;

  while (cursor < endMs) {
    const dateKey = getUtcDateKey(new Date(cursor));
    const nextBoundary = getUtcMidnightAfter(cursor);
    const segmentEnd = Math.min(endMs, nextBoundary);
    const seconds = Math.max(1, Math.round((segmentEnd - cursor) / 1000));

    pendingSiteUsageByDate[dateKey] = pendingSiteUsageByDate[dateKey] || {};
    pendingSiteUsageByDate[dateKey][domain] = (pendingSiteUsageByDate[dateKey][domain] || 0) + seconds;

    if (dateKey === todayKey) {
      todaySiteUsage[domain] = (todaySiteUsage[domain] || 0) + seconds;
    }

    cursor = segmentEnd;
  }

  await storageSet({
    pendingSiteUsageByDate,
    todaySiteUsage,
    todaySiteUsageDate: todayKey
  });
}

async function finalizeActiveTracking() {
  const { activeTracking } = await storageGet(["activeTracking"]);

  if (!activeTracking || !activeTracking.domain || !activeTracking.startTime) {
    return;
  }

  const endTime = Date.now();
  const startTime = Number(activeTracking.startTime);

  if (endTime > startTime) {
    await addUsageAcrossDays(activeTracking.domain, startTime, endTime);
  }

  await storageRemove(["activeTracking"]);
}

async function startTrackingTab(tabId, url) {
  if (!isTrackableUrl(url)) {
    await storageRemove(["activeTracking"]);
    return;
  }

  await storageSet({
    activeTracking: {
      domain: extractHostname(url),
      startTime: Date.now(),
      tabId,
      url
    }
  });
}

async function handleActiveTabChange(tabId) {
  await finalizeActiveTracking();

  try {
    const tab = await chrome.tabs.get(tabId);

    if (tab && tab.active) {
      await maybeBlockTab(tab.id, tab.url);
      await startTrackingTab(tab.id, tab.url);
    }
  } catch (error) {
    if (!String(error && error.message).includes("No tab with id")) {
      console.error("handleActiveTabChange failed", error);
    }
  }
}

async function handleActiveTabNavigation(tabId, url) {
  const { activeTracking } = await storageGet(["activeTracking"]);
  const currentUrl = activeTracking && activeTracking.tabId === tabId ? activeTracking.url : "";

  if (currentUrl && currentUrl !== url) {
    await finalizeActiveTracking();
  }

  try {
    const tab = await chrome.tabs.get(tabId);

    if (tab && tab.active) {
      await startTrackingTab(tab.id, url || tab.url);
    }
  } catch (error) {
    if (!String(error && error.message).includes("No tab with id")) {
      console.error("handleActiveTabNavigation failed", error);
    }
  }
}

function domainsMatch(hostname, blockEntry) {
  const normalizedHost = normalizeDomain(hostname);
  const normalizedBlock = normalizeDomain(blockEntry);

  if (!normalizedHost || !normalizedBlock) {
    return false;
  }

  // If the block entry doesn't have a dot, treat it as a keyword
  if (!normalizedBlock.includes(".")) {
    return normalizedHost.includes(normalizedBlock);
  }

  // Otherwise, do strict domain matching
  return normalizedHost === normalizedBlock || normalizedHost.endsWith(`.${normalizedBlock}`);
}

async function getGracePeriods() {
  const { focusGuardGracePeriods } = await storageGet(["focusGuardGracePeriods"]);
  const gracePeriods = focusGuardGracePeriods || {};
  const now = Date.now();
  const filtered = Object.entries(gracePeriods).reduce((output, [key, value]) => {
    if (Date.parse(value) > now) {
      output[key] = value;
    }

    return output;
  }, {});

  if (Object.keys(filtered).length !== Object.keys(gracePeriods).length) {
    await storageSet({ focusGuardGracePeriods: filtered });
  }

  return filtered;
}

async function addGracePeriod(domain) {
  const gracePeriods = await getGracePeriods();
  gracePeriods[normalizeDomain(domain)] = new Date(Date.now() + STUDY_OVERRIDE_MS).toISOString();
  await storageSet({ focusGuardGracePeriods: gracePeriods });
}

async function clearGracePeriods() {
  await storageSet({ focusGuardGracePeriods: {} });
}

async function getFocusState() {
  const state = await storageGet([
    "currentSessionId",
    "currentSessionSubject",
    "currentTask",
    "sessionActive",
    "sessionEndTime"
  ]);

  cachedFocusState = {
    sessionActive: Boolean(state.sessionActive),
    currentTask: state.currentTask || "",
    sessionEndTime: state.sessionEndTime || "",
    currentSessionId: state.currentSessionId || "",
    currentSessionSubject: state.currentSessionSubject || ""
  };

  return cachedFocusState;
}

async function maybeBlockTab(tabId, url) {
  try {
    if (!isTrackableUrl(url)) {
      return;
    }

    const focusState = await getFocusState();

    if (!focusState.sessionActive) {
      return;
    }

    const { blocklist } = await storageGet(["blocklist"]);
    const hostname = extractHostname(url);
    const list = Array.isArray(blocklist) && blocklist.length ? blocklist : DEFAULT_BLOCKLIST;
    const matchedEntry = list.find((entry) => domainsMatch(hostname, entry));

    if (!matchedEntry) {
      return;
    }

    const gracePeriods = await getGracePeriods();

    if (gracePeriods[normalizeDomain(hostname)] || gracePeriods[normalizeDomain(matchedEntry)]) {
      return;
    }

    const blockedUrl = chrome.runtime.getURL(
      `blocked.html?domain=${encodeURIComponent(hostname)}&returnUrl=${encodeURIComponent(url)}`
    );

    await chrome.tabs.update(tabId, { url: blockedUrl });
  } catch (error) {
    console.error("maybeBlockTab failed", error);
  }
}

async function restoreBlockedTabs() {
  try {
    const blockedPrefix = chrome.runtime.getURL("blocked.html");
    const tabs = await chrome.tabs.query({});

    await Promise.all(
      tabs
        .filter((tab) => typeof tab.url === "string" && tab.url.startsWith(blockedPrefix))
        .map(async (tab) => {
          try {
            const parsed = new URL(tab.url);
            const returnUrl = parsed.searchParams.get("returnUrl");

            if (returnUrl) {
              await chrome.tabs.update(tab.id, { url: returnUrl });
            }
          } catch (error) {
            console.error("restoreBlockedTabs tab failed", error);
          }
        })
    );
  } catch (error) {
    console.error("restoreBlockedTabs failed", error);
  }
}

async function syncSiteUsageToFirestore() {
  const auth = await getAuthContext();

  if (!auth.uid || !auth.idToken || !auth.projectId) {
    return;
  }

  const { pendingSiteUsageByDate } = await storageGet(["pendingSiteUsageByDate"]);
  const usageByDate = pendingSiteUsageByDate || {};
  const remaining = { ...usageByDate };
  const dates = Object.keys(usageByDate);

  if (!dates.length) {
    return;
  }

  for (const dateKey of dates) {
    const usage = usageByDate[dateKey];

    if (!usage || !Object.keys(usage).length) {
      delete remaining[dateKey];
      continue;
    }

    const path = `users/${auth.uid}/focusSessions/${dateKey}`;
    const existing = documentToData(await firestoreGet(path, auth.idToken)) || {};
    const mergedUsage = { ...(existing.siteUsage || {}) };

    Object.entries(usage).forEach(([domain, seconds]) => {
      mergedUsage[domain] = (mergedUsage[domain] || 0) + Number(seconds || 0);
    });

    const success = await firestoreSet(
      path,
      {
        siteUsage: mergedUsage,
        lastUsageSync: new Date().toISOString()
      },
      auth.idToken
    );

    if (success) {
      delete remaining[dateKey];
    }
  }

  await storageSet({ pendingSiteUsageByDate: remaining });
}

async function refreshFirebaseToken() {
  const auth = await getAuthContext();

  if (!auth.refreshToken || !auth.apiKey) {
    return false;
  }

  try {
    const response = await fetch(`https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(auth.apiKey)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(auth.refreshToken)}`
    });
    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error && json.error.message ? json.error.message : "Token refresh failed");
    }

    await storageSet({
      firebaseIdToken: json.id_token,
      firebaseRefreshToken: json.refresh_token || auth.refreshToken,
      uid: json.user_id || auth.uid
    });

    return true;
  } catch (error) {
    console.error("refreshFirebaseToken failed", error);
    return false;
  }
}

async function fetchUserDoc() {
  const auth = await getAuthContext();

  if (!auth.uid || !auth.idToken || !auth.projectId) {
    return null;
  }

  return documentToData(await firestoreGet(`users/${auth.uid}`, auth.idToken));
}

async function maybeNotifySessionMiss(previousState) {
  if (!previousState.currentSessionId || !previousState.sessionEndTime) {
    return;
  }

  if (Date.parse(previousState.sessionEndTime) > Date.now()) {
    return;
  }

  const { lastMissedSessionNotification } = await storageGet(["lastMissedSessionNotification"]);

  if (lastMissedSessionNotification === previousState.currentSessionId) {
    return;
  }

  const auth = await getAuthContext();
  let completed = false;

  if (auth.uid && auth.idToken && auth.projectId) {
    const sessionDoc = documentToData(
      await firestoreGet(`users/${auth.uid}/sessions/${previousState.currentSessionId}`, auth.idToken)
    );
    completed = Boolean(sessionDoc && sessionDoc.completed);
  }

  if (!completed) {
    const subject = previousState.currentSessionSubject || "scheduled";
    await chrome.notifications.create(`missed-${previousState.currentSessionId}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "StudyOS Focus Guard",
      message: `You missed your ${subject} session. It's been rescheduled.`
    });
    await storageSet({ lastMissedSessionNotification: previousState.currentSessionId });
  }
}

async function applyRemoteFocusState(nextState) {
  const previousState = await getFocusState();

  cachedFocusState = {
    sessionActive: Boolean(nextState.sessionActive),
    currentTask: nextState.currentTask || "",
    sessionEndTime: nextState.sessionEndTime || "",
    currentSessionId: nextState.currentSessionId || "",
    currentSessionSubject: nextState.currentSessionSubject || "",
    coinsBalance: nextState.coinsBalance || 0,
    streak: nextState.streak || 0
  };

  await storageSet({
    currentSessionId: cachedFocusState.currentSessionId,
    currentSessionSubject: cachedFocusState.currentSessionSubject,
    currentTask: cachedFocusState.currentTask,
    sessionActive: cachedFocusState.sessionActive,
    sessionEndTime: cachedFocusState.sessionEndTime,
    coinsBalance: cachedFocusState.coinsBalance,
    streak: cachedFocusState.streak
  });

  if (previousState.sessionActive && !cachedFocusState.sessionActive) {
    await clearGracePeriods();
    await restoreBlockedTabs();
    await maybeNotifySessionMiss(previousState);
  }
}

async function pollFocusSessionState() {
  const userDoc = await fetchUserDoc();

  if (!userDoc) {
    return;
  }

  await applyRemoteFocusState({
    sessionActive: Boolean(userDoc.sessionActive),
    currentTask: userDoc.currentTask || "",
    sessionEndTime: userDoc.sessionEndTime || "",
    currentSessionId: userDoc.currentSessionId || "",
    currentSessionSubject: userDoc.currentSessionSubject || "",
    userName: userDoc.displayName || userDoc.name || "",
    userPhotoUrl: userDoc.photoUrl || userDoc.avatarUrl || "",
    coinsBalance: userDoc.wallet?.coins || 0,
    streak: userDoc.streak || 0
  });

  await storageSet({
    userName: userDoc.displayName || userDoc.name || "",
    userPhotoUrl: userDoc.photoUrl || userDoc.avatarUrl || "",
    coinsBalance: userDoc.wallet?.coins || 0,
    streak: userDoc.streak || 0,
    extensionInstalled: true
  });
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

function normalizePlanBlocks(planDoc, dateKey) {
  if (!planDoc) {
    return [];
  }

  const rawBlocks = planDoc.timeBlocks || planDoc.blocks || planDoc.sessions || [];

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

async function sendUpcomingSessionReminder() {
  const auth = await getAuthContext();

  if (!auth.uid || !auth.idToken || !auth.projectId) {
    return;
  }

  const dateKey = getUtcDateKey();
  const plan = documentToData(await firestoreGet(`users/${auth.uid}/dailyPlans/${dateKey}`, auth.idToken));
  const blocks = normalizePlanBlocks(plan, dateKey);
  const now = Date.now();
  const { reminderLog } = await storageGet(["reminderLog"]);
  const log = reminderLog || {};
  let changed = false;

  for (const block of blocks) {
    const minutesUntilStart = Math.round((Date.parse(block.startTime) - now) / 60000);
    const reminderKey = `${block.id}:${block.startTime}`;

    if (minutesUntilStart >= 0 && minutesUntilStart <= 15 && !log[reminderKey]) {
      await chrome.notifications.create(`upcoming-${block.id}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "StudyOS Focus Guard",
        message: `${block.subject} session starts in ${minutesUntilStart} minutes. Get ready.`
      });
      log[reminderKey] = true;
      changed = true;
      break;
    }
  }

  if (changed) {
    await storageSet({ reminderLog: log });
  }
}

async function sendDistractionSummary() {
  await ensureTodayUsageBucket();
  const state = await storageGet(["blocklist", "lastDistractionNotificationHour", "todaySiteUsage"]);
  const blocklist = Array.isArray(state.blocklist) && state.blocklist.length ? state.blocklist : DEFAULT_BLOCKLIST;
  const usage = state.todaySiteUsage || {};
  const totalSeconds = Object.entries(usage).reduce((sum, [domain, seconds]) => {
    const matches = blocklist.some((entry) => domainsMatch(domain, entry));
    return matches ? sum + Number(seconds || 0) : sum;
  }, 0);
  const hourKey = new Date().toISOString().slice(0, 13);

  if (totalSeconds < 30 * 60 || state.lastDistractionNotificationHour === hourKey) {
    return;
  }

  await chrome.notifications.create(`distraction-${hourKey}`, {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "StudyOS Focus Guard",
    message: `You've spent ${Math.round(totalSeconds / 60)} minutes on distracting sites today.`
  });

  await storageSet({ lastDistractionNotificationHour: hourKey });
}

async function getStudyOsAppUrl() {
  const { studyOsAppUrl } = await storageGet(["studyOsAppUrl"]);
  return studyOsAppUrl || "https://studyos.app";
}

async function initializeExtension() {
  await ensureDefaultStorage();

  await chrome.alarms.clearAll();
  await chrome.alarms.create(ALARMS.SITE_USAGE_SYNC, { periodInMinutes: 5 });
  await chrome.alarms.create(ALARMS.FOCUS_POLL, { periodInMinutes: 0.5 });
  await chrome.alarms.create(ALARMS.TOKEN_REFRESH, { periodInMinutes: 55 });
  await chrome.alarms.create(ALARMS.SESSION_REMINDERS, { periodInMinutes: 1 });
  await chrome.alarms.create(ALARMS.DISTRACTION_CHECK, { periodInMinutes: 60 });

  await storageSet({ extensionInstalled: true });
  await pollFocusSessionState();

  try {
    const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });

    if (tabs[0]) {
      await maybeBlockTab(tabs[0].id, tabs[0].url);
      await startTrackingTab(tabs[0].id, tabs[0].url);
    }
  } catch (error) {
    console.error("initializeExtension tab bootstrap failed", error);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  initializeExtension();
});

chrome.runtime.onStartup.addListener(() => {
  initializeExtension();
});

chrome.tabs.onActivated.addListener((activeInfo) => {
  pollFocusSessionState();
  handleActiveTabChange(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    await pollFocusSessionState();
  }

  if (changeInfo.url || tab.url) {
    await maybeBlockTab(tabId, changeInfo.url || tab.url);
  }

  if (tab.active && changeInfo.url) {
    handleActiveTabNavigation(tabId, changeInfo.url);
  }
});

chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    maybeBlockTab(details.tabId, details.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  storageGet(["activeTracking"]).then((state) => {
    if (state.activeTracking && state.activeTracking.tabId === tabId) {
      finalizeActiveTracking();
    }
  });
});

chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    finalizeActiveTracking();
    return;
  }

  chrome.tabs.query({ active: true, windowId }).then((tabs) => {
    if (tabs[0]) {
      handleActiveTabChange(tabs[0].id);
    }
  });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm || !alarm.name) {
    return;
  }

  if (alarm.name === ALARMS.SITE_USAGE_SYNC) {
    syncSiteUsageToFirestore();
  }

  if (alarm.name === ALARMS.FOCUS_POLL) {
    pollFocusSessionState();
  }

  if (alarm.name === ALARMS.TOKEN_REFRESH) {
    refreshFirebaseToken();
  }

  if (alarm.name === ALARMS.SESSION_REMINDERS) {
    sendUpcomingSessionReminder();
  }

  if (alarm.name === ALARMS.DISTRACTION_CHECK) {
    sendDistractionSummary();
  }
});

chrome.notifications.onClicked.addListener(async () => {
  const url = await getStudyOsAppUrl();
  chrome.tabs.create({ url });
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") {
    return;
  }

  if (
    changes.sessionActive ||
    changes.currentTask ||
    changes.sessionEndTime ||
    changes.currentSessionId ||
    changes.currentSessionSubject
  ) {
    getFocusState().then((state) => {
      if (state.sessionActive && (changes.sessionActive?.newValue === true || !changes.sessionActive)) {
        // If session just became active, immediately check all open tabs
        chrome.tabs.query({}).then((tabs) => {
          tabs.forEach((tab) => {
            if (tab.url) maybeBlockTab(tab.id, tab.url);
          });
        });
      }
    });
  }

  if (changes.firebaseIdToken || changes.uid) {
    pollFocusSessionState();
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return false;
  }

  if (message.type === "focus-guard-override") {
    (async () => {
      const domain = normalizeDomain(message.domain);
      const returnUrl = message.returnUrl;

      if (!domain || !returnUrl || !sender.tab) {
        sendResponse({ ok: false });
        return;
      }

      await addGracePeriod(domain);

      const auth = await getAuthContext();

      if (auth.uid && auth.idToken && auth.projectId) {
        await firestoreCreate(
          `users/${auth.uid}/focusOverrides`,
          {
            createdAt: new Date().toISOString(),
            currentTask: cachedFocusState.currentTask || "",
            domain,
            expiresAt: new Date(Date.now() + STUDY_OVERRIDE_MS).toISOString(),
            returnUrl
          },
          auth.idToken
        );
      }

      await chrome.tabs.update(sender.tab.id, { url: returnUrl });
      sendResponse({ ok: true });
    })();

    return true;
  }

  return false;
});
