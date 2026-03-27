import Link from "next/link";
import { Zap, Target, ArrowRight, LayoutDashboard } from "lucide-react";
import { HeaderAuth } from "@/components/header-auth";
import { FeatureShowcase } from "@/components/feature-showcase";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#020202] text-white selection:bg-indigo-500/30 overflow-x-hidden font-body">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-rose-600/10 blur-[120px]" />
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-emerald-600/5 blur-[100px]" />
      </div>

      {/* Modern Sticky Header */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#020202]/60 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 font-bold text-white shadow-[0_0_20px_rgba(79,70,229,0.4)] transition-transform hover:scale-105">
              SO
            </div>
            <span className="font-display text-lg font-bold tracking-tight">
              StudyOS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <HeaderAuth />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        {/* Hero Section */}
        <section className="mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-400 mb-8">
            <Zap className="h-4 w-4" />
            <span>Built by students who were tired of losing streaks.</span>
          </div>

          <h1 className="font-display text-5xl font-black tracking-tighter sm:text-6xl lg:text-8xl leading-[0.9]">
            Your study life, <br />
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
              finally on auto-pilot.
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-lg sm:text-xl font-medium text-white/60 leading-relaxed">
            StudyOS generates your study plan with AI, blocks distractions in
            real-time, and makes sure you actually show up — every single day.
          </p>

          {/* How It Works — 3 Steps */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {[
              {
                step: "01",
                title: "Generate your plan",
                desc: "Drop your syllabus. The AI builds your daily schedule in seconds.",
                accent: "text-indigo-400",
                line: "bg-indigo-500",
              },
              {
                step: "02",
                title: "Lock in with stakes",
                desc: "Put coins on the line. Miss a session? You pay the price.",
                accent: "text-amber-400",
                line: "bg-amber-500",
              },
              {
                step: "03",
                title: "Execute publicly",
                desc: "Join study rooms. Broadcast your focus. Disappoint no one.",
                accent: "text-rose-400",
                line: "bg-rose-500",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left"
              >
                <div className={cn("h-1 w-8 rounded-full mb-4", item.line)} />
                <span
                  className={cn(
                    "text-xs font-black uppercase tracking-widest",
                    item.accent
                  )}
                >
                  Step {item.step}
                </span>
                <h3 className="mt-2 text-lg font-bold text-white">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Motivational Quote Separator */}
        <div className="my-32 mx-auto max-w-3xl text-center">
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-10" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold italic text-white/80 leading-relaxed">
            &quot;Motivation gets you going, but discipline keeps you growing.
            Your goals don&apos;t care how you feel today. Execute
            anyway.&quot;
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mt-10" />
        </div>

        {/* Interactive Feature Showcase (Client Island) */}
        <FeatureShowcase />

        {/* Final CTA */}
        <section className="mt-32 mb-16 relative overflow-hidden rounded-[40px] border border-indigo-500/30 bg-indigo-950/20 px-6 py-24 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />
          <div className="relative z-10">
            <Target className="h-16 w-16 text-indigo-400 mx-auto mb-8" />
            <h2 className="font-display text-4xl sm:text-5xl font-black tracking-tight text-white mb-6">
              Stop wasting tomorrow.
            </h2>
            <p className="text-lg sm:text-xl text-indigo-200/70 max-w-2xl mx-auto mb-10">
              Lock in your goals, put your reputation on the line, and execute
              with absolute precision.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 relative z-20">
              <Link
                href="/login"
                className="inline-flex items-center justify-center h-14 w-full sm:w-auto rounded-full bg-white px-10 text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Start Studying Free{" "}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/login?redirect=/dashboard"
                className="inline-flex items-center justify-center h-14 w-full sm:w-auto rounded-full px-10 text-lg font-bold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105"
              >
                Explore Dashboard{" "}
                <LayoutDashboard className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black py-12 text-center text-sm font-medium text-white/40">
        <div className="flex items-center justify-center gap-2 font-bold mb-4 opacity-70">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] text-white">
            SO
          </div>
          <span className="text-white">StudyOS Foundation</span>
        </div>
        <p>© 2026 StudyOS. Made for students who show up.</p>
      </footer>
    </div>
  );
}
