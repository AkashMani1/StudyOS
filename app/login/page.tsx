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
  const { signInWithEmail, signInWithGoogle, signUpWithEmail, sendPasswordReset, loading, user } = useAuth();
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
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
    } catch (error: any) {
      if (error?.code !== "auth/popup-closed-by-user" && error?.code !== "auth/cancelled-popup-request") {
        toast.error("Google sign-in failed. Please try again.");
      }
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
      } else if (mode === "reset") {
        await sendPasswordReset(email);
        toast.success("Password reset email sent! Check your inbox.");
        setMode("login");
        return;
      } else {
        try {
          await signUpWithEmail(name, email, password);
        } catch (error: any) {
          // Fast authentication flow: if the user tries to sign up but the email exists,
          // automatically attempt to log them in to save effort.
          if (error?.code === "auth/email-already-in-use" || error?.message?.includes("email-already-in-use")) {
            try {
              // Try to log them in with the password they just provided
              await signInWithEmail(email, password);
              toast.success("Welcome back! You already had an account.");
              router.push(redirectTarget);
              return;
            } catch (signInError: any) {
              const errCode = signInError?.code || "";
              const errMsg = signInError?.message || "";
              
              // If the password was wrong for the existing account
              if (errCode === "auth/wrong-password" || errCode === "auth/invalid-credential" || errMsg.includes("invalid-credential")) {
                setMode("login");
                throw new Error("This email is already registered, but the password was incorrect. Please sign in.");
              }
              
              setMode("login");
              throw new Error("This email is already registered. Please sign in instead.");
            }
          }
          throw error;
        }
      }

      router.push(redirectTarget);
    } catch (error: any) {
      const code = error?.code || "";
      const message = error?.message || "";
      let friendlyMessage = "Authentication failed.";
      
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || message.includes("invalid-credential")) {
        friendlyMessage = mode === "login" ? "Invalid email or password." : "Incorrect password for this existing account.";
      } else if (code === "auth/user-not-found" || message.includes("user-not-found")) {
        friendlyMessage = "No account found. Please switch to create account.";
      } else if (code === "auth/weak-password" || message.includes("weak-password")) {
        friendlyMessage = "Password should be at least 6 characters.";
      } else if (code === "auth/too-many-requests" || message.includes("too-many-requests")) {
        friendlyMessage = "Too many attempts. Please try again later.";
      } else if (error instanceof Error) {
        friendlyMessage = error.message.replace(/^Firebase:\s*(Error\s*)?(\(auth\/[a-z-]+\)\.)?\s*/i, "").trim();
      }
      
      toast.error(friendlyMessage);
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
            title={
              mode === "login" 
                ? "Sign in to StudyOS" 
                : mode === "signup"
                ? "Create your StudyOS account"
                : "Reset your password"
            }
            description={
              mode === "reset"
                ? "Enter your email address and we'll send you a link to reset your password."
                : "Create your profile and start using StudyOS with Google or email/password."
            }
          />

          <div className="flex gap-3">
            <Button className="flex-1" disabled={submitting} onClick={() => void handleGoogleLogin()}>
              {submitting ? "Please wait..." : "Continue with Google"}
            </Button>
            <Button
              className="flex-1"
              disabled={submitting}
              variant="ghost"
              onClick={() => {
                if (mode === "reset") {
                  setMode("login");
                } else {
                  setMode((current) => (current === "login" ? "signup" : "login"));
                }
              }}
            >
              {mode === "login" ? "Need an account?" : mode === "signup" ? "Have an account?" : "Back to Sign In"}
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {mode === "signup" ? (
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
            ) : null}
            <Input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email" type="email" />
            
            {mode !== "reset" ? (
              <div className="space-y-2">
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Password"
                  type="password"
                />
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setMode("reset")}
                    className="text-xs font-medium text-slate-500 hover:text-comet transition-colors dark:text-slate-400"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
            ) : null}

            <Button className="w-full" disabled={submitting || !email.trim() || (mode !== "reset" && !password.trim()) || (mode === "signup" && !name.trim())} type="submit">
              {submitting ? "Please wait..." : mode === "login" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
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

