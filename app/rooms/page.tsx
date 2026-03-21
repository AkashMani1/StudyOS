import { AppShell } from "@/components/app-shell";
import { ProGate } from "@/components/pro-gate";
import { RoomsPanel } from "@/components/rooms-panel";

export default function RoomsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <header className="mb-8 max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Live network</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Study Rooms</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Real-time accountability rooms backed by RTDB, with live members, lock control, and automatic cleanup on disconnect.</p>
      </header>
      <ProGate>
        <RoomsPanel />
      </ProGate>
    </div>
  );
}
