"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui";

export function HomeAuthCta() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard">
          <Button className="px-6 py-4">
            Open dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary" className="px-6 py-4">
            Continue sign in
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="w-full text-sm text-white/70 dark:text-slate-300">Checking your session in the background.</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard">
          <Button className="px-6 py-4">
            Go to dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <Link href="/planner">
          <Button variant="secondary" className="px-6 py-4">
            Open planner
            <Sparkles className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/login">
        <Button className="px-6 py-4">
          Sign in
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </Link>
      <Link href="/login">
        <Button variant="secondary" className="px-6 py-4">
          Create account
          <Sparkles className="ml-2 h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
