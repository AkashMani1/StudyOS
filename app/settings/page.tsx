import { AppShell } from "@/components/app-shell";
import { SettingsPanel } from "@/components/settings-panel";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-8 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">System configuration</p>
        <h1 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Tune blocklists, push preferences, hard mode stakes, and your public failure visibility.</p>
      </header>
      <SettingsPanel />
    </div>
  );
}
