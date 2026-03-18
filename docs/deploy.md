# StudyOS Deployment

## 1. Prepare environment

Copy `.env.example` to `.env.local` and fill the remaining blank secrets.

The repo already includes your public Firebase project values for `studyos-4d50d`.
Do not commit `.env.local`.

Rotate any secret that has already been pasted into chat before using it in production.

## 2. Install tooling

```bash
npm install
firebase login
firebase use studyos-4d50d
```

## 3. Deploy Firebase data layer

For Spark-friendly launch, Firebase only hosts Auth, Firestore, RTDB, and messaging data.

```bash
firebase deploy --only firestore:rules,firestore:indexes,database
```

## 4. Deploy the web app to Vercel

Use Vercel for the Next.js runtime and API routes.

```bash
vercel
```

For production deploys:

```bash
vercel --prod
```

Add these environment variables in Vercel project settings:

- `SESSION_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## 5. Optional Firebase-only deploy helper

```bash
./scripts/deploy-prod.sh
```

This pushes Firestore rules, indexes, and RTDB rules for `studyos-4d50d`.

## 6. Final production setup

- Add your live domain to Firebase Authentication authorized domains.
- Enable Google sign-in and Email/Password in Firebase Auth.
- Verify FCM web push with the current VAPID key.
- Set `NEXT_PUBLIC_SENTRY_DSN` in Vercel if you want browser-side Sentry reporting.
- Add GitHub Actions secret `FIREBASE_SERVICE_ACCOUNT_STUDYOS_4D50D` for CI/CD deploys.
- Keep the app in free launch mode until you intentionally reintroduce payments.
- Daily plans and leaderboard refresh are manual/on-demand in this Spark-compatible version.

## 7. Smoke test after deploy

- Sign in with Google
- Complete onboarding
- Generate AI tasks
- Generate a daily plan from the planner
- Start and complete a planner session
- Mark a session missed and verify rescheduling
- Join a room
- Load analytics and refresh leaderboard
- Trigger the weekly insight endpoint
