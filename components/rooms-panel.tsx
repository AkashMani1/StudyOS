"use client";

import { useEffect, useMemo, useState } from "react";
import { Lock, LockOpen, Plus } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { getExploreRooms } from "@/lib/explore-data";
import { createRoom, joinRoom, leaveRoom, subscribeToRooms, updateRoomState } from "@/services/room-service";
import { Button, Card, Input, SectionHeading } from "@/components/ui";
import type { RoomDoc } from "@/types/domain";

export function RoomsPanel() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRooms(getExploreRooms());
      return;
    }

    return subscribeToRooms(setRooms);
  }, [user]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const handleCreateRoom = async () => {
    if (!user || !profile || !roomName.trim()) {
      if (!user) {
        toast.error("Sign in to create a room and compete live.");
      }
      return;
    }

    const id = await createRoom(user.uid, profile.displayName, roomName.trim());
    setRoomName("");
    setSelectedRoomId(id);
    toast.success("Room created and set live.");
  };

  const handleJoin = async (roomId: string) => {
    if (!user || !profile) {
      setSelectedRoomId(roomId);
      toast.error("Sign in to join rooms and compete with other students.");
      return;
    }

    try {
      await joinRoom(roomId, user.uid, profile.displayName, "Deep work");
      setSelectedRoomId(roomId);
      toast.success("Joined room.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join room.");
    }
  };

  const handleLeave = async () => {
    if (!user || !selectedRoomId) {
      if (!user) {
        toast.error("Sign in to leave or manage live rooms.");
      }
      return;
    }

    await leaveRoom(selectedRoomId, user.uid);
    setSelectedRoomId(null);
  };

  const isHost = selectedRoom?.hostUid === user?.uid;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr,1.05fr]">
      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Live rooms"
          title="Study with visible pressure"
          description="Rooms stay updated in real time through RTDB. Everyone sees who is present and what they claim to be working on."
        />

        <div className="flex gap-3">
          <Input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Create a room name"
          />
          <Button onClick={() => void handleCreateRoom()}>
            <Plus className="mr-2 h-4 w-4" />
            Create
          </Button>
        </div>

        <div className="space-y-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/70 p-4 dark:bg-white/5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <h4 className="font-display text-xl font-bold">{room.name}</h4>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {Object.keys(room.members ?? {}).length} members · {room.isLocked ? "Locked" : "Open"}
                </p>
              </div>
              <Button variant="ghost" onClick={() => void handleJoin(room.id)}>
                {user ? "Join room" : "View room"}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      <Card className="space-y-5">
        <SectionHeading
          eyebrow="Room state"
          title={selectedRoom?.name ?? "No room selected"}
          description="When you close the tab, onDisconnect removes you automatically."
        />
        {selectedRoom ? (
          <>
            <div className="space-y-3">
              {Object.entries(selectedRoom.members ?? {}).map(([uid, member]) => (
                <div
                  key={uid}
                  className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/70 px-4 py-4 dark:bg-white/5"
                >
                  <div>
                    <p className="font-semibold">{member.name}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{member.currentTask}</p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
                    {uid === selectedRoom.hostUid ? "host" : "member"}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="ghost" onClick={() => void handleLeave()}>
                Leave room
              </Button>
              {isHost ? (
                <Button
                  onClick={() => {
                    if (!user) {
                      toast.error("Sign in to control room state.");
                      return;
                    }

                    void updateRoomState(selectedRoom.id, !selectedRoom.isLocked);
                  }}
                  variant="secondary"
                >
                  {selectedRoom.isLocked ? (
                    <>
                      <LockOpen className="mr-2 h-4 w-4" />
                      Unlock room
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Lock room
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 px-5 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            Pick a room from the left to inspect or join it.
          </div>
        )}
      </Card>
    </div>
  );
}
