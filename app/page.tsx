import { strapi, type StrapiHero, StrapiFeature, StrapiStep } from "@/lib/strapi";
import HomePageClient from "./page.client";
import { BrainCircuit, Coins, Flame, LayoutDashboard } from "lucide-react";

// Fallback data if Strapi is unavailable
const FALLBACK_HERO: StrapiHero = {
  title: "Rely on systems. Not motivation.",
  subtitle: "StudyOS is an uncompromising workspace designed to force discipline. Stop waiting to \"feel like it.\" Generate an exact plan, broadcast your focus, and put real stakes on the line.",
  badge: "Kill Excuses. Build Routine.",
};

const FALLBACK_STEPS: StrapiStep[] = [
  { step: "01", title: "Generate your plan", description: "Drop your syllabus. The AI builds your daily schedule in seconds.", accent: "text-indigo-400", line: "bg-indigo-500" },
  { step: "02", title: "Lock in with stakes", description: "Put coins on the line. Miss a session? You pay the price.", accent: "text-amber-400", line: "bg-amber-500" },
  { step: "03", title: "Execute publicly", description: "Join study rooms. Broadcast your focus. Disappoint no one.", accent: "text-rose-400", line: "bg-rose-500" },
];

const FEATURE_MOCKS: Record<string, React.ReactNode> = {
  dashboard: (
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
  ),
  planner: (
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
  ),
  stakes: (
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
  ),
  rooms: (
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
          <div key={i} className={"h-12 w-12 rounded-full border-2 flex items-center justify-center font-bold text-xs border-white/10 bg-white/5 text-white/50"}>
            S{i}
          </div>
        ))}
      </div>
    </div>
  ),
};

const FALLBACK_FEATURES: StrapiFeature[] = [
  { id: "dashboard", title: "Dashboard", description: "Your absolute command center. Track your exact focus score, completed sessions, and daily momentum without distraction.", icon: "LayoutDashboard", color: "text-emerald-500", bg: "bg-emerald-500/10" },
  { id: "planner", title: "AI Planner", description: "Stop guessing what to study. The Gemini-powered AI breaks your massive goals into microscopic, executable daily time blocks.", icon: "BrainCircuit", color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { id: "stakes", title: "Consequences", description: "Motivation is fake. Real progress requires stakes. You earn coins for completing sessions, and get aggressively penalized if you fail.", icon: "Coins", color: "text-amber-500", bg: "bg-amber-500/10" },
  { id: "rooms", title: "Live Pressure", description: "Join highly disciplined study rooms. Broadcast your focus state globally. If you slack off, everyone in the room knows.", icon: "Flame", color: "text-rose-500", bg: "bg-rose-500/10" },
];

export default async function HomePage() {
  const [hero, features, steps, quote] = await Promise.all([
    strapi.getHero(),
    strapi.getFeatures(),
    strapi.getSteps(),
    strapi.getQuote(),
  ]);

  const finalHero = hero || FALLBACK_HERO;
  const rawFeatures = features || FALLBACK_FEATURES;
  const finalSteps = steps || FALLBACK_STEPS;
  const finalQuote = quote || { text: "Motivation gets you going, but discipline keeps you growing. Your goals don't care how you feel today. Execute anyway." };

  const finalFeatures = rawFeatures.map(f => ({
    ...f,
    mock: FEATURE_MOCKS[f.id] || FEATURE_MOCKS.dashboard
  }));

  return (
    <HomePageClient 
      hero={finalHero}
      features={finalFeatures}
      steps={finalSteps}
      quote={finalQuote}
    />
  );
}
