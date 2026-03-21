"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function HomeAuthCta({ hideSubtext }: { hideSubtext?: boolean }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 w-full">
        <div className="flex gap-4">
           <div className="h-[56px] w-[140px] rounded-full bg-white/5 border border-white/10 animate-pulse" />
           <div className="h-[56px] w-[180px] rounded-full bg-white/5 border border-white/10 animate-pulse" />
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-col items-center gap-4 w-full">
        <Link href="/dashboard" className="inline-flex items-center justify-center h-[56px] rounded-full px-8 text-lg font-bold bg-white text-black hover:bg-slate-200 transition-transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
          Open Workspace
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        {!hideSubtext && (
          <p className="mt-2 text-sm font-bold text-emerald-400/80 uppercase tracking-widest flex items-center gap-2 animate-in fade-in duration-500">
            <Sparkles className="h-4 w-4" /> Session active. Ready to execute.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link href="/login" className="inline-flex items-center justify-center h-[56px] rounded-full px-8 text-lg font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-transform hover:scale-105 shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-500">
          Sign in
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
        <Link href="/login" className="inline-flex items-center justify-center h-[56px] rounded-full px-8 text-lg font-bold bg-white/5 text-white border border-white/10 hover:bg-white/10 transition-transform hover:scale-105">
          Create account
          <Sparkles className="ml-2 h-5 w-5 text-indigo-400" />
        </Link>
      </div>
      {!hideSubtext && (
        <p className="mt-4 text-sm font-bold text-white/40 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck className="h-4 w-4" /> No credit card required. Pure execution.
        </p>
      )}
    </div>
  );
}
