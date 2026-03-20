"use client";

import {
  child,
  get,
  limitToFirst,
  onDisconnect,
  onValue,
  orderByChild,
  push,
  query,
  ref,
  remove,
  set,
  update,
  serverTimestamp,
  equalTo,
  type Unsubscribe
} from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";
import type { RoomDoc } from "@/types/domain";

const MAX_ROOMS = 50;

export function subscribeToRooms(onRooms: (rooms: RoomDoc[]) => void): Unsubscribe {
  const roomsQuery = query(
    ref(rtdb, "rooms"),
    orderByChild("isLive"),
    equalTo(true),
    limitToFirst(MAX_ROOMS)
  );

  return onValue(roomsQuery, (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<RoomDoc, "id">> | null;
    const rooms = Object.entries(value ?? {}).map(([id, room]) => ({ id, ...room }));
    onRooms(rooms);
  });
}

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function createRoom(hostUid: string, hostName: string, roomName: string): Promise<string> {
  const roomRef = push(ref(rtdb, "rooms"));
  const roomId = roomRef.key;

  if (!roomId) {
    throw new Error("Unable to create room.");
  }

  await set(roomRef, {
    name: roomName,
    hostUid,
    isLive: true,
    isLocked: false,
    members: {
      [hostUid]: {
        name: hostName,
        currentTask: "Planning next block",
        joinedAt: Date.now(),
        isOnline: true,
        totalTimePreviously: 0,
        lastActiveDay: getTodayString()
      }
    }
  });

  const memberRef = child(roomRef, `members/${hostUid}`);
  await onDisconnect(memberRef).update({
    isOnline: false,
    lastLeftAt: serverTimestamp()
  });

  return roomId;
}

export async function joinRoom(
  roomId: string,
  uid: string,
  name: string,
  currentTask: string
): Promise<void> {
  const roomMembersRef = ref(rtdb, `rooms/${roomId}/members`);
  const snapshot = await get(roomMembersRef);
  const members = snapshot.val() as Record<string, { joinedAt: number; lastLeftAt?: number; totalTimePreviously?: number; lastActiveDay?: string; name?: string; currentTask?: string }> | null;

  if (members && Object.keys(members).length >= 20 && !members[uid]) {
    throw new Error("This room is full.");
  }

  const existing = members?.[uid];
  const today = getTodayString();
  let totalPrev = existing?.totalTimePreviously ?? 0;

  if (existing?.lastActiveDay !== today) {
    totalPrev = 0;
  } else if (existing?.lastLeftAt && existing?.joinedAt) {
    if (existing.lastLeftAt > existing.joinedAt) {
      totalPrev += (existing.lastLeftAt - existing.joinedAt);
    }
  }

  const memberRef = child(roomMembersRef, uid);
  await set(memberRef, {
    name: existing?.name ?? name,
    currentTask: existing?.currentTask ?? currentTask,
    joinedAt: Date.now(),
    isOnline: true,
    totalTimePreviously: totalPrev,
    lastLeftAt: null,
    lastActiveDay: today
  });

  await onDisconnect(memberRef).update({
    isOnline: false,
    lastLeftAt: serverTimestamp()
  });
  
  await trackEvent("room_joined", { roomId });
}

export async function toggleRoomTimer(roomId: string, uid: string, isPaused: boolean): Promise<void> {
  const memberRef = ref(rtdb, `rooms/${roomId}/members/${uid}`);
  const snapshot = await get(memberRef);
  const member = snapshot.val() as { joinedAt: number; lastLeftAt?: number; totalTimePreviously?: number; isOnline?: boolean; lastActiveDay?: string } | null;

  if (!member) return;

  if (isPaused && member.isOnline !== false) {
    await update(memberRef, {
      isOnline: false,
      lastLeftAt: Date.now()
    });
    await onDisconnect(memberRef).cancel();
  } else if (!isPaused && member.isOnline === false) {
    const today = getTodayString();
    let totalPrev = member.totalTimePreviously ?? 0;
    
    if (member.lastActiveDay !== today) {
      totalPrev = 0;
    } else if (member.lastLeftAt && member.joinedAt && member.lastLeftAt > member.joinedAt) {
      totalPrev += (member.lastLeftAt - member.joinedAt);
    }
    
    await update(memberRef, {
      isOnline: true,
      joinedAt: Date.now(),
      lastLeftAt: null,
      totalTimePreviously: totalPrev,
      lastActiveDay: today
    });

    await onDisconnect(memberRef).update({
      isOnline: false,
      lastLeftAt: serverTimestamp()
    });
  }
}

export async function leaveRoom(roomId: string, uid: string): Promise<void> {
  await remove(ref(rtdb, `rooms/${roomId}/members/${uid}`));
}

export async function updateRoomState(roomId: string, isLocked: boolean): Promise<void> {
  await update(ref(rtdb, `rooms/${roomId}`), {
    isLocked,
    updatedAt: Date.now()
  });
}

export async function deleteRoom(roomId: string): Promise<void> {
  await remove(ref(rtdb, `rooms/${roomId}`));
}
