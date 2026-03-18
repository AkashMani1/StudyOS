"use client";

import {
  child,
  get,
  onDisconnect,
  onValue,
  push,
  ref,
  remove,
  set,
  update,
  type Unsubscribe
} from "firebase/database";
import { rtdb } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";
import type { RoomDoc } from "@/types/domain";

export function subscribeToRooms(onRooms: (rooms: RoomDoc[]) => void): Unsubscribe {
  const roomsRef = ref(rtdb, "rooms");

  return onValue(roomsRef, (snapshot) => {
    const value = snapshot.val() as Record<string, Omit<RoomDoc, "id">> | null;
    const rooms = Object.entries(value ?? {}).map(([id, room]) => ({ id, ...room }));
    onRooms(rooms.filter((room) => room.isLive));
  });
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
        joinedAt: Date.now()
      }
    }
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
  const members = snapshot.val() as Record<string, { joinedAt: number }> | null;

  if (members && Object.keys(members).length >= 20) {
    throw new Error("This room is full.");
  }

  const memberRef = child(roomMembersRef, uid);
  await set(memberRef, {
    name,
    currentTask,
    joinedAt: Date.now()
  });
  await onDisconnect(memberRef).remove();
  await trackEvent("room_joined", { roomId });
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
