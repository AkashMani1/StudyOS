"use client";

import { useEffect, useMemo, useState } from "react";
import { LockOpen, Plus, Pause, Play, Trophy, Link as LinkIcon, Users, Clock, ArrowRight, Trash2, LogOut, Copy } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { getExploreRooms } from "@/lib/explore-data";
import { createRoom, joinRoom, leaveRoom, subscribeToRooms, updateRoomState, deleteRoom, toggleRoomTimer } from "@/services/room-service";
import { Button, Card, Input, Badge } from "@/components/ui";
import type { RoomDoc, RoomMember } from "@/types/domain";

const gradients = [
  "from-rose-400 to-red-500", "from-blue-400 to-emerald-400",
  "from-violet-400 to-fuchsia-500", "from-amber-400 to-orange-500",
  "from-cyan-400 to-indigo-500", "from-teal-400 to-blue-500",
  "from-pink-400 to-rose-400", "from-indigo-400 to-purple-500"
];

function getDeterministicGradient(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % gradients.length;
  return gradients[index];
}

function LiveTimer({ member }: { member: RoomMember }) {
  const [elapsed, setElapsed] = useState<number | null>(null);

  useEffect(() => {
    const calc = () => {
      const baseAcc = member.totalTimePreviously ?? 0;
      let ms = 0;
      if (member.isOnline === false) {
        if (member.joinedAt && member.lastLeftAt && member.lastLeftAt > member.joinedAt) {
          ms = baseAcc + (member.lastLeftAt - member.joinedAt);
        } else {
          ms = baseAcc;
        }
      } else {
        ms = baseAcc + (Date.now() - member.joinedAt);
      }
      return Math.min(Math.max(0, Math.floor(ms / 1000)), 86400);
    };

    setElapsed(calc());
    
    if (member.isOnline === false) return;

    const interval = window.setInterval(() => {
      setElapsed(calc());
    }, 1000);
    return () => window.clearInterval(interval);
  }, [member]);

  if (elapsed === null) return <span>--:--:--</span>;

  const h = String(Math.floor(elapsed / 3600)).padStart(2, "0");
  const m = String(Math.floor((elapsed % 3600) / 60)).padStart(2, "0");
  const s = String(elapsed % 60).padStart(2, "0");

  return <span>{h}:{m}:{s}</span>;
}

export function RoomsPanel() {
  const { user, profile } = useAuth();
  const [rooms, setRooms] = useState<RoomDoc[]>([]);
  const [roomName, setRoomName] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setRooms(getExploreRooms());
      return;
    }
    const unsubscribe = subscribeToRooms(setRooms);
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const rid = params.get("roomId");
      if (rid && rooms.some(r => r.id === rid)) {
        setSelectedRoomId(rid);
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [rooms]);

  const { myRooms, availableRooms } = useMemo(() => {
    if (!user || !profile) return { myRooms: [], availableRooms: rooms };
    return rooms.reduce(
      (acc, room) => {
        if (room.members?.[user.uid]) {
          acc.myRooms.push(room);
        } else {
          acc.availableRooms.push(room);
        }
        return acc;
      },
      { myRooms: [] as RoomDoc[], availableRooms: [] as RoomDoc[] }
    );
  }, [rooms, user, profile]);

  const handleCreateRoom = async () => {
    if (!user || !profile || !roomName.trim()) return;
    try {
      setCreatingRoom(true);
      const newRoomId = await createRoom(user.uid, profile.displayName, roomName.trim());
      setSelectedRoomId(newRoomId);
      setRoomName("");
      toast.success("Room created locally.");
    } catch {
      toast.error("Unable to create room.");
    } finally {
      setCreatingRoom(false);
    }
  };

  const handleJoin = async (roomId: string) => {
    if (!user || !profile) {
      setSelectedRoomId(roomId);
      toast.error("Sign in to join rooms and compete with other students.");
      return;
    }

    try {
      setJoiningRoomId(roomId);
      const activeRooms = rooms.filter(
        (r) => r.id !== roomId && r.members?.[user.uid]?.isOnline === true
      );
      for (const r of activeRooms) {
        await toggleRoomTimer(r.id, user.uid, true).catch(() => null);
      }

      await joinRoom(roomId, user.uid, profile.displayName, "Deep work");
      setSelectedRoomId(roomId);
      toast.success("Welcome to the lobby!");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to join room.");
    } finally {
      setJoiningRoomId(null);
    }
  };

  const handleLeave = async () => {
    if (!user || !selectedRoomId) {
      if (!user) toast.error("Sign in to leave rooms.");
      return;
    }
    try {
      await leaveRoom(selectedRoomId, user.uid);
      setSelectedRoomId(null);
      toast.success("You have dropped off the leaderboard.");
    } catch {
      toast.error("Unable to leave room.");
    }
  };

  const handleDeleteRoom = async () => {
    if (!user || !selectedRoomId) return;

    // Guard: only the host can delete
    const room = rooms.find((r) => r.id === selectedRoomId);
    if (!room || room.hostUid !== user.uid) {
      toast.error("Only the room host can delete this lobby.");
      return;
    }

    // Confirmation before destructive action
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete "${room.name}"? All members will be removed.`
    );
    if (!confirmed) return;

    try {
      await deleteRoom(selectedRoomId);
      setSelectedRoomId(null);
      toast.success("Lobby entirely wiped.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message.includes("PERMISSION_DENIED")
            ? "Access denied — you are not the host of this room."
            : error.message
          : "Unable to delete room.";
      toast.error(message);
    }
  };

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );
  const isHost = selectedRoom?.hostUid === user?.uid;

  return (
    <div className="grid gap-6 lg:grid-cols-[340px,1fr] h-[min(800px,calc(100vh-140px))]">
      {/* Sidebar Navigation */}
      <Card className="flex flex-col h-full overflow-hidden p-0 bg-white/40 dark:bg-slate-950/40 border-white/5 backdrop-blur-3xl shadow-2xl relative">
        <div className="absolute inset-0 bg-gradient-to-b from-white/60 to-transparent dark:from-white/5 pointer-events-none" />
        <div className="p-5 border-b border-slate-200/50 dark:border-white/10 shrink-0 bg-white/60 dark:bg-black/20 relative z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-comet to-indigo-500">
              Study Lobbies
            </h2>
          </div>
          <div className="flex gap-2">
            <Input 
              value={roomName} 
              onChange={(e) => setRoomName(e.target.value)} 
              placeholder="Create a new room..." 
              className="shadow-inner bg-white/70 dark:bg-black/40 ring-0 focus:ring-comet h-10" 
            />
            <Button 
              variant="primary" 
              disabled={creatingRoom || !roomName.trim()} 
              onClick={() => void handleCreateRoom()} 
              className="h-10 w-10 p-0 rounded-2xl shrink-0 font-bold bg-comet hover:bg-comet/90 transition-transform"
            >
              <Plus className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8 relative z-10 custom-scrollbar">
          {myRooms.length > 0 && (
            <div className="space-y-3">
              <p className="px-2 text-xs font-bold uppercase tracking-widest text-comet dark:text-comet flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-comet animate-pulse" /> Your Lobbies
              </p>
              {myRooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoomId(room.id)}
                  className={`w-full text-left rounded-3xl px-4 py-4 transition-all duration-300 relative overflow-hidden group ${
                    selectedRoomId === room.id
                      ? "bg-gradient-to-r from-comet/20 to-indigo-500/10 border border-comet/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                      : "hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-transparent bg-white/60 dark:bg-white/5"
                  }`}
                >
                  <div className="flex flex-col gap-1.5 relative z-10">
                    <p className={`font-bold transition-colors ${selectedRoomId === room.id ? "text-comet dark:text-indigo-300" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                      {room.name}
                    </p>
                    <div className="flex items-center justify-between">
                       <div className="flex items-center gap-1.5 bg-slate-100/80 dark:bg-slate-800/80 px-2 py-0.5 rounded-full">
                         <span className="flex h-1.5 w-1.5 relative">
                           {room.members?.[user?.uid ?? ""]?.isOnline !== false ? <><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span></> : <span className="h-1.5 w-1.5 rounded-full bg-slate-400/50"></span> }
                         </span>
                         <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 tracking-wide">{room.members?.[user?.uid ?? ""]?.isOnline !== false ? "Active" : "Paused"}</span>
                       </div>
                       <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                         <Users className="h-3 w-3" /> {Object.keys(room.members ?? {}).length}/20
                       </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-3">
            <p className="px-2 text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
              {myRooms.length > 0 ? "Explore Rooms" : "Available Rooms"}
            </p>
            {availableRooms.length === 0 ? (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-3xl mt-4">
                <p className="text-sm text-slate-500 font-medium">No public lobbies right now.</p>
              </div>
            ) : null}
            {availableRooms.map(room => (
              <button
                key={room.id}
                onClick={() => setSelectedRoomId(room.id)}
                className={`w-full text-left rounded-3xl px-4 py-4 transition-all duration-300 relative overflow-hidden group ${
                  selectedRoomId === room.id
                    ? "bg-gradient-to-r from-comet/20 to-indigo-500/10 border border-comet/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]"
                    : "hover:bg-white/90 dark:hover:bg-white/10 border border-slate-200/50 dark:border-transparent bg-white/60 dark:bg-white/5"
                }`}
              >
                <div className="flex flex-col gap-1.5 relative z-10">
                  <p className={`font-bold transition-colors line-clamp-1 ${selectedRoomId === room.id ? "text-comet dark:text-indigo-300" : "text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white"}`}>
                    {room.name}
                  </p>
                  <div className="flex items-center justify-between">
                     <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate w-3/4">Host: {Object.values(room.members ?? {})[0]?.name ?? "System"}</span>
                     <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
                       <Users className="h-3 w-3" /> {Object.keys(room.members ?? {}).length}/20
                     </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Main Panel Content */}
      <Card className="relative flex flex-col h-full overflow-hidden p-0 border-white/5 bg-white/60 dark:bg-slate-950/60 backdrop-blur-3xl shadow-2xl">
        {selectedRoom ? (
          <>
            {/* Dynamic Header Banner */}
            <div className={`shrink-0 p-6 md:p-8 bg-gradient-to-br ${getDeterministicGradient(selectedRoom.id)} relative overflow-hidden`}>
              <div className="absolute inset-0 bg-black/10 dark:bg-black/30" />
              {/* Pattern Overlay */}
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
              
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <Badge className="bg-white/20 text-white border-none mb-4 shadow-xl backdrop-blur-xl hover:bg-white/30 transition-colors">LIVE SESSION</Badge>
                  <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-md mb-2">{selectedRoom.name}</h1>
                  <p className="text-white/80 font-semibold drop-shadow-sm flex items-center gap-2 text-sm md:text-base">
                     <Clock className="w-4 h-4" /> 24H Daily Cycle Limit | Restarts strictly at Midnight
                  </p>
                </div>
              </div>
            </div>

            {/* Viewport content */}
            <div className="flex-1 relative overflow-y-auto bg-slate-50/60 dark:bg-black/20 p-4 md:p-8 custom-scrollbar">
              
              {!selectedRoom.members?.[user?.uid ?? ""] && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-xl bg-white/40 dark:bg-slate-950/60">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl p-8 rounded-[2.5rem] shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] text-center max-w-sm w-full border border-white/50 dark:border-white/10 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-comet/5 to-transparent pointer-events-none" />
                    <div className="relative z-10">
                      <div className="w-20 h-20 mx-auto bg-comet/10 rounded-full flex items-center justify-center mb-6 shadow-inner ring-4 ring-comet/5">
                        <LockOpen className="h-10 w-10 text-comet drop-shadow-md" />
                      </div>
                      <h2 className="text-2xl font-black mb-3 text-slate-800 dark:text-white">Ready to Focus?</h2>
                      <p className="text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">Join {Object.keys(selectedRoom.members ?? {}).length} others grinding locally. Time pauses dynamically across tabs.</p>
                      <Button disabled={joiningRoomId === selectedRoom.id} onClick={() => void handleJoin(selectedRoom.id)} className="w-full text-lg py-7 bg-gradient-to-r from-comet to-indigo-500 hover:from-comet/90 hover:to-indigo-500/90 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.6)] transition-all hover:scale-[1.02] rounded-2xl font-bold border-0 text-white">
                        {joiningRoomId === selectedRoom.id ? "Connecting..." : <span className="flex items-center justify-center">Join the Grind <ArrowRight className="ml-2 h-5 w-5" /></span>}
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className="max-w-4xl mx-auto space-y-4 relative z-10 pointer-events-auto pb-4">
                {Object.entries(selectedRoom.members ?? {})
                  .map(([uid, member]) => {
                    const baseAcc = member.totalTimePreviously ?? 0;
                    const currentSegment = member.isOnline === false 
                      ? ((member.lastLeftAt && member.joinedAt && member.lastLeftAt > member.joinedAt) ? member.lastLeftAt - member.joinedAt : 0)
                      : (Date.now() - member.joinedAt);
                    return { uid, member, sortScore: baseAcc + currentSegment };
                  })
                  .sort((a, b) => b.sortScore - a.sortScore)
                  .map(({ uid, member, sortScore }, index) => {
                    const isTop = index === 0 && sortScore > 0;
                    return (
                      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: index * 0.05 }} key={uid} 
                        className={`flex items-center justify-between rounded-3xl border ${
                          isTop 
                          ? "border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-orange-500/5 shadow-[0_0_30px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/20" 
                          : "border-slate-200 dark:border-white/5 bg-white dark:bg-white/5 shadow-lg hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
                        } p-4 md:p-5`}
                      >
                        <div className="flex items-center gap-4 md:gap-5 min-w-0">
                          <div className={`shrink-0 flex h-10 w-10 md:h-12 md:w-12 items-center justify-center rounded-2xl font-black ${
                            isTop 
                            ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)]" 
                            : "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}>
                            {isTop ? <Trophy className="h-5 w-5 md:h-6 md:w-6 drop-shadow-sm" /> : index + 1}
                          </div>
                          
                          <div className={`shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br ${getDeterministicGradient(uid)} flex items-center justify-center text-white/90 font-black shadow-inner border border-white/20 text-lg md:text-xl drop-shadow-sm`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>

                          <div className="min-w-0 pr-4">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className={`font-bold md:text-lg tracking-tight truncate ${isTop ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-slate-100"}`}>
                                {member.name}
                              </p>
                              {member.isOnline !== false ? (
                                <span className="flex h-2.5 w-2.5 relative shrink-0">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                </span>
                              ) : (
                                <span className="h-2.5 w-2.5 rounded-full bg-slate-400/50 shrink-0 shadow-inner"></span>
                              )}
                            </div>
                            <p className="text-xs md:text-sm font-semibold text-slate-600 dark:text-slate-400 truncate max-w-[150px] sm:max-w-xs">{member.currentTask}</p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <p className={`font-display text-xl md:text-3xl font-black tracking-tighter tabular-nums ${
                            member.isOnline !== false 
                              ? (isTop ? "text-amber-600 dark:text-amber-400" : "text-indigo-600 dark:text-indigo-400") 
                              : "text-slate-500 dark:text-slate-400"
                          }`}>
                            <LiveTimer member={member} />
                          </p>
                          <Badge className={`mt-1.5 border-none shadow-sm ${uid === selectedRoom.hostUid ? "bg-fuchsia-500/10 text-fuchsia-700 dark:bg-fuchsia-500/20 dark:text-fuchsia-300" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"}`}>
                            {uid === selectedRoom.hostUid ? "Host" : "Member"}
                          </Badge>
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            </div>

            {/* Footer Actions */}
            {selectedRoom.members?.[user?.uid ?? ""] && (
              <div className="shrink-0 border-t border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 backdrop-blur-2xl p-4 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 z-30 relative shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <Button
                    variant="secondary"
                    className="w-full sm:w-auto rounded-xl shadow-lg bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 font-bold text-slate-800 dark:text-slate-100"
                    onClick={async () => {
                      const currentlyPaused = selectedRoom.members![user!.uid].isOnline === false;
                      if (currentlyPaused) {
                        const activeOther = rooms.filter((r) => r.id !== selectedRoom.id && r.members?.[user!.uid]?.isOnline === true);
                        for (const r of activeOther) {
                          await toggleRoomTimer(r.id, user!.uid, true).catch(() => null);
                        }
                      }
                      await toggleRoomTimer(selectedRoom.id, user!.uid, !currentlyPaused);
                    }}
                  >
                    {selectedRoom.members[user!.uid].isOnline !== false ? (
                      <><Pause className="mr-2 h-4 w-4 text-amber-500" /> Pause Timer</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4 text-emerald-500" /> Resume Timer</>
                    )}
                  </Button>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" className="flex-1 sm:flex-none rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold" onClick={() => void handleLeave()}>
                      <LogOut className="mr-2 h-4 w-4" /> Leave
                    </Button>

                    {isHost && (
                      <Button variant="danger" className="flex-1 sm:flex-none rounded-xl shadow-lg font-semibold" onClick={() => void handleDeleteRoom()}>
                        <Trash2 className="mr-2 h-4 w-4" /> Delete Room
                      </Button>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  className="rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-bold border border-slate-200 dark:border-slate-700 shadow-sm"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/rooms?roomId=${selectedRoom.id}`);
                    toast.success("Invite link securely copied!");
                  }}
                >
                  <LinkIcon className="mr-2 h-4 w-4 text-comet dark:text-aurora" /> Share URI
                </Button>
              </div>
            )}
            
            {/* Non-Joined Footer UI overlay just for the link copier convenience */}
            {!selectedRoom.members?.[user?.uid ?? ""] && (
              <div className="shrink-0 h-16 bg-white/50 dark:bg-slate-950/50 backdrop-blur-xl border-t border-slate-200/50 dark:border-white/10 flex items-center justify-end px-6 z-30">
                <button title="Copy Link" className="text-xs font-bold text-slate-500 hover:text-comet dark:hover:text-aurora uppercase tracking-widest flex items-center gap-2 transition-colors active:scale-95" 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/rooms?roomId=${selectedRoom.id}`);
                    toast.success("Invite link copied to clipboard!");
                  }}>
                  <Copy className="h-4 w-4" /> Share Link
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 p-8 text-center bg-slate-50/50 dark:bg-black/10 relative">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="relative z-10 flex flex-col items-center justify-center">
              <div className="w-28 h-28 mb-6 rounded-full bg-slate-200/50 dark:bg-slate-800/50 flex items-center justify-center shadow-inner ring-8 ring-white/50 dark:ring-black/20">
                <Users className="h-12 w-12 opacity-40 mix-blend-overlay" />
              </div>
              <h3 className="text-3xl font-black mb-3 text-slate-800 dark:text-slate-200">Awaiting Deployment</h3>
              <p className="max-w-xs mx-auto font-medium leading-relaxed text-slate-600 dark:text-slate-400">Join an active lobby from the sidebar or host your own session to kick off the grind.</p>
            </motion.div>
          </div>
        )}
      </Card>
    </div>
  );
}
