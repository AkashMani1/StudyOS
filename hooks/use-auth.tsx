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
      setUser(nextUser);

      if (unsubscribeProfile && (!nextUser || nextUser.uid !== profileListenerUid)) {
        unsubscribeProfile();
        unsubscribeProfile = undefined;
        profileListenerUid = null;
      }

      if (!nextUser) {
        setLoading(true);
        const nextSession = await syncSession(null);
        commitSession(nextSession);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Skip re-sync if the existing session is for the same user and hasn't expired.
      // This prevents burning the session-bootstrap rate limit on tab-focus events.
      const existingSession = sessionRef.current;
      const sessionStillValid =
        existingSession?.uid === nextUser.uid &&
        existingSession.exp > Date.now() + 60_000; // 1min buffer

      if (sessionStillValid) {
        // Session is fine — just ensure profile listener is running
        if (!unsubscribeProfile) {
          setLoading(true);
          const profileRef = doc(db, "users", nextUser.uid);
          setLoading(false);
          unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
            const nextProfile = snapshot.data() as AppUserProfile | undefined;
            setProfile(nextProfile ?? createFallbackProfile(nextUser, existingSession));
          });
          profileListenerUid = nextUser.uid;
        }
        return;
      }

      // Full session bootstrap needed
      setLoading(true);
      const nextSession = await syncSession(nextUser);
      commitSession(nextSession);

      if (!nextSession) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile((current) => current ?? createFallbackProfile(nextUser, nextSession));

      const profileRef = doc(db, "users", nextUser.uid);
      
      // Setup the profile listener first
      unsubscribeProfile = onSnapshot(profileRef, async (snapshot) => {
        const nextProfile = snapshot.data() as AppUserProfile | undefined;
        
        // If profile doesn't exist in Firestore, initialize it
        if (!nextProfile) {
          await fetch("/api/profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              displayName: nextUser.displayName ?? "Focused Student",
              email: nextUser.email ?? "",
              fcmToken: null
            })
          }).catch(() => null);

          // Use fallback while waiting for initialization
          setProfile(createFallbackProfile(nextUser, nextSession));
        } else {
          // Merge with fallback to ensure nested properties like wallet/preferences always exist
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
      setLoading(false);
      return;
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) {
        unsubscribeProfile();
      }
    };
  }, []);

  const signInWithGoogle = useCallback(async () => {
    const credential = await signInWithPopup(auth, new GoogleAuthProvider());
    const nextSession = await ensureSession(credential.user);
    commitSession(nextSession);
    await trackEvent("screen_view", { source: "google_login" });
  }, [commitSession]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const nextSession = await ensureSession(credential.user);
    commitSession(nextSession);
    await trackEvent("screen_view", { source: "email_login" });
  }, [commitSession]);

  const signUpWithEmail = useCallback(async (name: string, email: string, password: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    const nextSession = await ensureSession(credential.user);
    commitSession(nextSession);
    await trackEvent("screen_view", { source: "email_signup" });
  }, [commitSession]);

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
