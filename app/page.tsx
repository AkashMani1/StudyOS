"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { BrainCircuit, Coins, Flame, Sparkles, LayoutDashboard, ArrowRight, Target, ShieldCheck, Zap } from "lucide-react";
import { HeaderAuth } from "@/components/header-auth";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description: "Your absolute command center. Track your exact focus score, completed sessions, and daily momentum without distraction.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
             <LayoutDashboard className="h-6 w-6 text-emerald-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Focus Score: 94%</div>
            <div className="text-sm text-emerald-400">Peak cognitive state</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center p-4">
            <span className="text-3xl font-black text-white">4</span>
            <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Sessions</span>
          </div>
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center p-4">
            <span className="text-3xl font-black text-white">12</span>
            <span className="text-xs text-white/50 uppercase tracking-wider mt-1">Day Streak</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "planner",
    title: "AI Planner",
    icon: BrainCircuit,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    description: "Stop guessing what to study. The Gemini-powered AI breaks your massive goals into microscopic, executable daily time blocks.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
             <BrainCircuit className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Neural Schedule Generation</div>
            <div className="text-sm text-indigo-400">Processing syllabus...</div>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-14 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-white">08:00 AM - Differential Eq.</span>
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-md font-bold">LOCKED IN</span>
          </div>
          <div className="h-14 rounded-xl border border-white/10 bg-white/5 flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-white/70">10:30 AM - Thermodynamics</span>
            <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-md font-bold">QUEUED</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "stakes",
    title: "Consequences",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description: "Motivation is fake. Real progress requires stakes. You earn coins for completing sessions, and get aggressively penalized if you fail.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
             <Coins className="h-6 w-6 text-amber-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Wallet at Risk</div>
            <div className="text-sm text-amber-400">Hard Mode Enabled</div>
          </div>
        </div>
        <div className="mt-8 flex flex-col items-center justify-center bg-black/40 rounded-3xl py-8 border border-red-500/20 shadow-[0_0_40px_rgba(239,68,68,0.1)]">
           <span className="text-5xl font-black text-white tracking-tighter">1,250 <span className="text-amber-500 text-2xl">COINS</span></span>
           <span className="mt-4 text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1 pb-1.5 rounded-full ring-1 ring-red-500/30">-50 PENALTY IF MISSED</span>
        </div>
      </div>
    )
  },
  {
    id: "rooms",
    title: "Live Pressure",
    icon: Flame,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    description: "Join highly disciplined study rooms. Broadcast your focus state globally. If you slack off, everyone in the room knows.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center">
             <Flame className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">Global Study Room</div>
            <div className="text-sm text-rose-400">14 students locked in right now</div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {[1,2,3,4,5,6,7].map((i) => (
            <div key={i} className={cn("h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs", i === 3 ? "border-rose-500 bg-rose-500/20 text-rose-200" : "border-white/10 bg-white/5 text-white/50")}>
              S{i}
            </div>
          ))}
        </div>
      </div>
    )
  }
];

export default function HomePage() {
  const [activeTab, setActiveTab] = useState(features[0]);

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
            <span className="font-display text-lg font-bold tracking-tight">StudyOS</span>
          </div>
          <div className="flex items-center gap-6">
            <HeaderAuth />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        
        {/* Extreme Hero Section */}
        <section className="mx-auto max-w-5xl text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-500/30 bg-rose-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-400 mb-8"
          >
            <Zap className="h-4 w-4" />
            <span>Kill Excuses. Build Routine.</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
            className="font-display text-6xl font-black tracking-tighter sm:text-7xl lg:text-8xl leading-[0.9]"
          >
            Rely on systems. <br />
            <span className="block mt-2 text-transparent bg-clip-text bg-gradient-to-br from-white via-white to-white/40">
              Not motivation.
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-8 max-w-2xl text-xl font-medium text-white/60 leading-relaxed"
          >
            StudyOS is an uncompromising workspace designed to force discipline. Stop waiting to &quot;feel like it.&quot; Generate an exact plan, broadcast your focus, and put real stakes on the line.
          </motion.p>

          {/* How It Works — 3 Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto"
          >
            {[
              { step: "01", title: "Generate your plan", desc: "Drop your syllabus. The AI builds your daily schedule in seconds.", accent: "text-indigo-400", line: "bg-indigo-500" },
              { step: "02", title: "Lock in with stakes", desc: "Put coins on the line. Miss a session? You pay the price.", accent: "text-amber-400", line: "bg-amber-500" },
              { step: "03", title: "Execute publicly", desc: "Join study rooms. Broadcast your focus. Disappoint no one.", accent: "text-rose-400", line: "bg-rose-500" },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
                className="relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 text-left"
              >
                <div className={cn("h-1 w-8 rounded-full mb-4", item.line)} />
                <span className={cn("text-xs font-black uppercase tracking-widest", item.accent)}>Step {item.step}</span>
                <h3 className="mt-2 text-lg font-bold text-white">{item.title}</h3>
                <p className="mt-2 text-sm text-white/50 leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </section>

        {/* Motivational Quote Separator */}
        <motion.div 
          initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.8 }}
          className="my-32 mx-auto max-w-3xl text-center"
        >
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mb-10" />
          <h2 className="font-display text-2xl sm:text-3xl font-bold italic text-white/80 leading-relaxed">
             &quot;Motivation gets you going, but discipline keeps you growing. Your goals don&apos;t care how you feel today. Execute anyway.&quot;
          </h2>
          <div className="h-px w-24 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto mt-10" />
        </motion.div>

        {/* Interactive Feature Showcase */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.7 }}
          className="mt-20"
        >
          <div className="text-center mb-16">
             <h2 className="font-display text-4xl font-black tracking-tight">The Anatomy of Discipline</h2>
             <p className="mt-4 text-white/50 text-lg">Navigate the tabs to explore how the system holds you accountable.</p>
          </div>

          <div className="lg:grid lg:grid-cols-[1fr,1.3fr] lg:gap-16 items-center bg-white/[0.02] border border-white/5 rounded-[40px] p-4 sm:p-8 lg:p-12 backdrop-blur-sm">
            
            {/* Nav Tabs */}
            <div className="flex flex-col gap-2 relative z-10">
              {features.map((feature) => {
                const isActive = activeTab.id === feature.id;
                const Icon = feature.icon;
                return (
                  <button
                    key={feature.id}
                    onClick={() => setActiveTab(feature)}
                    className={cn(
                      "relative text-left px-6 py-5 rounded-2xl transition-all duration-300 overflow-hidden",
                      isActive ? "text-white" : "text-white/40 hover:text-white/80 hover:bg-white/5"
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabBg"
                        className="absolute inset-0 bg-white/10 rounded-2xl -z-10 border border-white/10"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <div className="flex items-center gap-4 relative z-10">
                      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center transition-colors", isActive ? feature.bg : "bg-transparent")}>
                        <Icon className={cn("h-5 w-5", isActive ? feature.color : "text-white/40")} />
                      </div>
                      <div>
                        <div className="font-bold text-lg">{feature.title}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Display Panel */}
            <div className="mt-8 lg:mt-0 relative h-[450px] w-full bg-[#0a0a0a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
              {/* Window Controls */}
              <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/[0.02]">
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
                <div className="h-3 w-3 rounded-full bg-white/20" />
              </div>
              
              <div className="flex-1 p-8 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="h-full flex flex-col"
                  >
                    <p className="text-lg font-medium text-white/70 leading-relaxed mb-10">
                      {activeTab.description}
                    </p>
                    <div className="mt-auto">
                      {activeTab.mock}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Decorative Glow inside panel */}
                <div className={cn("absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-700", activeTab.bg.replace('/10', ''))} />
              </div>
            </div>

          </div>
        </motion.section>

        {/* Final CTA */}
        <motion.section 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} whileInView={{ opacity: 1, scale: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.6 }}
          className="mt-32 mb-16 relative overflow-hidden rounded-[40px] border border-indigo-500/30 bg-indigo-950/20 px-6 py-24 text-center"
        >
           <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-transparent to-transparent pointer-events-none" />
           <div className="relative z-10">
             <Target className="h-16 w-16 text-indigo-400 mx-auto mb-8" />
             <h2 className="font-display text-5xl font-black tracking-tight text-white mb-6">Stop wasting tomorrow.</h2>
             <p className="text-xl text-indigo-200/70 max-w-2xl mx-auto mb-10">
               Lock in your goals, put your reputation on the line, and execute with absolute precision.
             </p>
             <div className="mt-10 flex flex-wrap items-center justify-center gap-4 relative z-20">
               <Link href="/login" className="inline-flex items-center justify-center h-14 rounded-full bg-white px-10 text-lg font-bold text-black transition-transform hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.2)]">
                 Fire It Up <ArrowRight className="ml-2 h-5 w-5" />
               </Link>
               <Link href="/dashboard" className="inline-flex items-center justify-center h-14 rounded-full px-10 text-lg font-bold text-white/70 border border-white/10 bg-white/5 hover:bg-white/10 transition-all hover:scale-105">
                 Explore Dashboard <LayoutDashboard className="ml-2 h-5 w-5" />
               </Link>
             </div>
           </div>
        </motion.section>

      </main>

      {/* Basic Footer */}
      <footer className="border-t border-white/10 bg-black py-12 text-center text-sm font-medium text-white/40">
        <div className="flex items-center justify-center gap-2 font-bold mb-4 opacity-70">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-indigo-600 text-[10px] text-white">SO</div>
          <span className="text-white">StudyOS Foundation</span>
        </div>
        <p>© 2026 StudyOS. Built for unstoppable momentum.</p>
      </footer>
    </div>
  );
}
