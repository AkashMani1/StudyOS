"use client";

import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  type User
} from "firebase/auth";
import {
  onSnapshot,
  doc,
  type Unsubscribe
} from "firebase/firestore";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { auth, db } from "@/lib/firebase";
import { trackEvent } from "@/lib/analytics";
import type { AppUserProfile, SessionPayload } from "@/types/domain";

interface AuthContextValue {
  user: User | null;
  profile: AppUserProfile | null;
  session: SessionPayload | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function createFallbackProfile(user: User, session: SessionPayload | null): AppUserProfile {
  return {
    displayName: user.displayName ?? "Focused Student",
    email: user.email ?? "",
    role: session?.role ?? "user",
    fcmToken: null,
    subscription: {
      plan: "free",
      razorpaySubId: null,
      validUntil: null,
      status: "inactive"
    },
    wallet: {
      coins: 0,
      transactions: []
    },
    preferences: {
      preferredStartHour: 6,
      preferredEndHour: 22,
      blockedSites: [],
      notificationsEnabled: true,
      hardModeEnabled: false,
      publicFailureLogEnabled: false
    },
    createdAt: null,
    updatedAt: null
  };
}

async function syncSession(user: User | null): Promise<SessionPayload | null> {
  if (!user) {
    await fetch("/api/session/logout", { method: "POST" }).catch(() => null);
    return null;
  }

  const idToken = await user.getIdToken();
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ idToken })
  }).catch(() => null);

  if (!response || !response.ok) {
    return null;
  }

  return (await response.json()) as SessionPayload;
}

async function ensureSession(user: User): Promise<SessionPayload> {
  const session = await syncSession(user);

  if (!session) {
    throw new Error("Unable to create session.");
  }

  return session;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<AppUserProfile | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const sessionRef = useRef<SessionPayload | null>(null);

  const commitSession = useCallback((nextSession: SessionPayload | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let unsubscribeProfile: Unsubscribe | undefined;
    let profileListenerUid: string | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (nextUser) => {
      // If no user, reset and clear session
      if (!nextUser) {
        setUser(null);
        setSession(null);
        sessionRef.current = null;
        setProfile(null);
        setLoading(false);
        // Inform backend about logout
        fetch("/api/session/logout", { method: "POST" }).catch(() => null);
        return;
      }

      // Check if we already have a valid session for this user to avoid redundant bootstrap
      const existingSession = sessionRef.current;
      const isSameUser = existingSession?.uid === nextUser.uid;
      const isExpiringSoon = existingSession && existingSession.exp < Date.now() + 120_000; // 2min buffer

      if (isSameUser && !isExpiringSoon) {
        // Just ensure user state is set and profile listener is active
        setUser(nextUser);
        if (!unsubscribeProfile) {
          const profileRef = doc(db, "users", nextUser.uid);
          unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
            const nextProfile = snapshot.data() as AppUserProfile | undefined;
            if (nextProfile) setProfile(nextProfile);
          });
          profileListenerUid = nextUser.uid;
        }
        setLoading(false);
        return;
      }

      // Start bootstrap
      setLoading(true);
      try {
        const nextSession = await syncSession(nextUser);
        if (!nextSession) {
          throw new Error("Session sync failed");
        }

        commitSession(nextSession);
        setUser(nextUser);

        // Setup profile listener with auto-bootstrap for new users
        const profileRef = doc(db, "users", nextUser.uid);
        
        if (unsubscribeProfile) unsubscribeProfile();
        
        unsubscribeProfile = onSnapshot(profileRef, async (snapshot) => {
          const nextProfile = snapshot.data() as AppUserProfile | undefined;
          
          if (!nextProfile) {
            // New user detection: initialize profile via API
            await fetch("/api/profile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                displayName: nextUser.displayName ?? "Focused Student",
                email: nextUser.email ?? "",
                fcmToken: null
              })
            }).catch(() => null);
            setProfile(createFallbackProfile(nextUser, nextSession));
          } else {
            // Normal profile merge
            const fallback = createFallbackProfile(nextUser, nextSession);
            setProfile({
              ...fallback,
              ...nextProfile,
              wallet: { ...fallback.wallet, ...nextProfile.wallet },
              preferences: { ...fallback.preferences, ...nextProfile.preferences },
              subscription: { ...fallback.subscription, ...nextProfile.subscription }
            });
          }
        });

        profileListenerUid = nextUser.uid;
      } catch (error) {
        console.error("Auth bootstrap failed:", error);
        setUser(null);
        setSession(null);
        sessionRef.current = null;
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, [commitSession]);

  const signInWithGoogle = useCallback(async () => {
    // Just trigger the popup. onAuthStateChanged will handle the rest.
    await signInWithPopup(auth, new GoogleAuthProvider());
    await trackEvent("screen_view", { source: "google_login" });
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
    await trackEvent("screen_view", { source: "email_login" });
  }, []);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    await trackEvent("screen_view", { source: "email_signup" });
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await fetch("/api/session/logout", { method: "POST" });
  }, []);

  const sendPasswordReset = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
    await trackEvent("screen_view", { source: "password_reset_request" });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      session,
      loading,
      signInWithGoogle,
      signInWithEmail,
      signUpWithEmail,
      signOut,
      sendPasswordReset
    }),
    [loading, profile, session, signInWithEmail, signInWithGoogle, signOut, signUpWithEmail, user, sendPasswordReset]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider.");
  }

  return context;
}
