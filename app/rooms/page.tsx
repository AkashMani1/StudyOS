import { AppShell } from "@/components/app-shell";
import { ProGate } from "@/components/pro-gate";
import { RoomsPanel } from "@/components/rooms-panel";

export default function RoomsPage() {
  return (
    <AppShell
      title="Study Rooms"
      subtitle="Real-time accountability rooms backed by RTDB, with live members, lock control, and automatic cleanup on disconnect."
    >
      <ProGate>
        <RoomsPanel />
      </ProGate>
    </AppShell>
  );
}
