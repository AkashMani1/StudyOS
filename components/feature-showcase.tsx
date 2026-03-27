"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BrainCircuit,
  Coins,
  Flame,
  LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    description:
      "Your absolute command center. Track your exact focus score, completed sessions, and daily momentum without distraction.",
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
            <span className="text-xs text-white/50 uppercase tracking-wider mt-1">
              Sessions
            </span>
          </div>
          <div className="h-24 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-center p-4">
            <span className="text-3xl font-black text-white">12</span>
            <span className="text-xs text-white/50 uppercase tracking-wider mt-1">
              Day Streak
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "planner",
    title: "AI Planner",
    icon: BrainCircuit,
    color: "text-indigo-500",
    bg: "bg-indigo-500/10",
    description:
      "Stop guessing what to study. The Gemini-powered AI breaks your massive goals into microscopic, executable daily time blocks.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
            <BrainCircuit className="h-6 w-6 text-indigo-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              Neural Schedule Generation
            </div>
            <div className="text-sm text-indigo-400">Processing syllabus...</div>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          <div className="h-14 rounded-xl border border-indigo-500/30 bg-indigo-500/10 flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-white">
              08:00 AM - Differential Eq.
            </span>
            <span className="text-xs bg-indigo-500 text-white px-2 py-1 rounded-md font-bold">
              LOCKED IN
            </span>
          </div>
          <div className="h-14 rounded-xl border border-white/10 bg-white/5 flex items-center px-4 justify-between">
            <span className="text-sm font-semibold text-white/70">
              10:30 AM - Thermodynamics
            </span>
            <span className="text-xs bg-white/10 text-white/50 px-2 py-1 rounded-md font-bold">
              QUEUED
            </span>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: "stakes",
    title: "Consequences",
    icon: Coins,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    description:
      "Motivation is fake. Real progress requires stakes. You earn coins for completing sessions, and get aggressively penalized if you fail.",
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
          <span className="text-5xl font-black text-white tracking-tighter">
            1,250 <span className="text-amber-500 text-2xl">COINS</span>
          </span>
          <span className="mt-4 text-xs font-bold text-red-400 uppercase tracking-widest bg-red-500/10 px-3 py-1 pb-1.5 rounded-full ring-1 ring-red-500/30">
            -50 PENALTY IF MISSED
          </span>
        </div>
      </div>
    ),
  },
  {
    id: "rooms",
    title: "Live Pressure",
    icon: Flame,
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    description:
      "Join highly disciplined study rooms. Broadcast your focus state globally. If you slack off, everyone in the room knows.",
    mock: (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-rose-500/20 flex items-center justify-center">
            <Flame className="h-6 w-6 text-rose-500" />
          </div>
          <div>
            <div className="text-xl font-bold text-white">
              Global Study Room
            </div>
            <div className="text-sm text-rose-400">
              14 students locked in right now
            </div>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div
              key={i}
              className={cn(
                "h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs",
                i === 3
                  ? "border-rose-500 bg-rose-500/20 text-rose-200"
                  : "border-white/10 bg-white/5 text-white/50"
              )}
            >
              S{i}
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState(features[0]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      className="mt-20"
    >
      <div className="text-center mb-16">
        <h2 className="font-display text-4xl font-black tracking-tight">
          The Anatomy of Discipline
        </h2>
        <p className="mt-4 text-white/50 text-lg">
          Navigate the tabs to explore how the system holds you accountable.
        </p>
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
                  isActive
                    ? "text-white"
                    : "text-white/40 hover:text-white/80 hover:bg-white/5"
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
                  <div
                    className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                      isActive ? feature.bg : "bg-transparent"
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-5 w-5",
                        isActive ? feature.color : "text-white/40"
                      )}
                    />
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
        <div className="mt-8 lg:mt-0 relative min-h-[400px] sm:min-h-[450px] w-full bg-[#0a0a0a] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden flex flex-col">
          {/* Window Controls */}
          <div className="h-12 border-b border-white/10 flex items-center px-4 gap-2 bg-white/[0.02]">
            <div className="h-3 w-3 rounded-full bg-white/20" />
            <div className="h-3 w-3 rounded-full bg-white/20" />
            <div className="h-3 w-3 rounded-full bg-white/20" />
          </div>

          <div className="flex-1 p-6 sm:p-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="h-full flex flex-col"
              >
                <p className="text-base sm:text-lg font-medium text-white/70 leading-relaxed mb-10">
                  {activeTab.description}
                </p>
                <div className="mt-auto">{activeTab.mock}</div>
              </motion.div>
            </AnimatePresence>

            {/* Decorative Glow inside panel */}
            <div
              className={cn(
                "absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none transition-colors duration-700",
                activeTab.bg.replace("/10", "")
              )}
            />
          </div>
        </div>
      </div>
    </motion.section>
  );
}
