# StudyOS Security Operations

## Secret rotation

Rotate these on a regular cadence and immediately after any suspected leak:

- `SESSION_SECRET`
- `FIREBASE_PRIVATE_KEY`
- `GEMINI_API_KEY`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`

### Rotation sequence

1. Create the new secret in the upstream provider first.
2. Update the value in Vercel environment variables.
3. Update the GitHub Actions secret if CI/CD uses it.
4. Redeploy the affected surface.
5. Verify login, AI, notifications, and logging.
6. Revoke the old secret only after the new one is confirmed live.

## Sentry

Required env:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

## Rate limiting

Server-side rate limiting is enforced in Firestore under `system/rateLimits/...`.
These documents are blocked from client access by Firestore rules.

Current protected routes include:

- `/api/session`
- `/api/goals`
- `/api/generate-plan`
- `/api/daily-plan`
- `/api/leaderboard`
- `/api/planner/session`
- `/api/preferences`
- `/api/profile`
- `/api/reschedule`
- `/api/weekly-insight`
- `/api/send-nudge`
- `/api/coach`
- `/api/admin/add-student`

## Backend trust model

Sensitive writes now go through server routes:

- goal creation and task generation
- planner session start / complete / miss
- preference updates
- FCM token updates
- auth profile bootstrap

## Recommended next hardening

- move RTDB room writes behind a callable or server layer if you need moderation or audit trails
- add Firebase App Check for web clients
- replace document-read admin checks in Firestore rules with custom claims if admin usage grows
- add Vercel project-level environment scoping for preview vs production
