"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { Button, Card, Input, SectionHeading } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const redirectTarget = params.get("redirect") ?? "/dashboard";
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, loading, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTarget);
    }
  }, [loading, redirectTarget, router, user]);

  const handleGoogleLogin = async () => {
    setSubmitting(true);

    try {
      await signInWithGoogle();
      router.push(redirectTarget);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Google sign-in failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (mode === "login") {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(name, email, password);
      }

      router.push(redirectTarget);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-hero-grid px-4 py-8 dark:bg-night">
      <div className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr,0.95fr]">
        <Card className="hidden min-h-[640px] overflow-hidden bg-gradient-to-br from-ink via-comet to-ember text-white lg:block">
          <div className="space-y-6 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-white/70">StudyOS</p>
            <h1 className="font-display text-5xl font-bold leading-tight">
              You are not behind because the work is impossible.
            </h1>
            <p className="max-w-xl text-sm text-white/80">
              You are behind because your system keeps letting you off the hook. This one won&apos;t.
            </p>
          </div>
        </Card>

        <Card className="mx-auto w-full max-w-xl space-y-6">
          <SectionHeading
            eyebrow="Authentication"
            title={mode === "login" ? "Sign in to StudyOS" : "Create your StudyOS account"}
            description="Create your profile and start using StudyOS with Google or email/password."
          />

          <div className="flex gap-3">
            <Button className="flex-1" disabled={submitting} onClick={() => void handleGoogleLogin()}>
              {submitting ? "Please wait..." : "Continue with Google"}
            </Button>
            <Button
              className="flex-1"
              disabled={submitting}
              variant="ghost"
              onClick={() => setMode((current) => (current === "login" ? "signup" : "login"))}
            >
              {mode === "login" ? "Need an account?" : "Have an account?"}
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
            ) : null}
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type="password"
            />
            <Button className="w-full" disabled={submitting || !email.trim() || !password.trim() || (mode === "signup" && !name.trim())} type="submit">
              {submitting ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-slate-500 dark:text-slate-400">
            New here? <Link className="font-semibold text-comet" href="/onboarding">After sign-in, you can set up your profile and first study plan.</Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
