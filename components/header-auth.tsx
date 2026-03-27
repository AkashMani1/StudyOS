"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2 } from "lucide-react";

export function HeaderAuth() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-white/30" />;
  }
  
  if (user) {
    return (
      <Link href="/dashboard" className="rounded-full bg-indigo-600/20 px-4 py-2 text-sm font-bold text-indigo-300 transition-colors hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center gap-2">
        Workspace <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }
  
  return (
    <>
      <Link href="/login" className="text-sm font-semibold text-white/60 transition-colors hover:text-white hidden sm:block">
        Log in
      </Link>
      <Link href="/login" className="relative group overflow-hidden rounded-full bg-white px-5 py-2 text-sm font-bold text-black transition-transform hover:scale-105">
        <span className="relative z-10">Start Studying Free</span>
        <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
      </Link>
    </>
  );
}
