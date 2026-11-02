# Feature verification — 2026-11-02

## Changes

- Await asynchronous authentication in the six community API route files. This restores resolved user IDs and roles for reads, publishing, comments, likes, and deletion.
- Use the configured application URL consistently for Google authorization, token exchange, and redirects; remove trailing slashes and provide the existing localhost development default.
- Exclude temporary verification tools from application linting and fix a test loader variable name flagged by Next.js lint rules.

## Verified

- TypeScript: `npx tsc --noEmit` passed.
- Automated tests: `node --test tests/*.test.mjs` passed all 38 tests. Coverage includes frontend community API contracts, asynchronous route authentication, Google redirect contracts, project stages, map requests, and sentiment aggregation. These use mocks; they do not prove database or external service integration.
- Lint: `npm run lint` passed after excluding `tmp/**` and fixing the test loader.
- Production build: `npm run build` exited successfully. Windows standalone tracing emitted `EINVAL` warnings when copying `node:buffer` chunks. The standalone deployment artifact has not been validated.
- CCTV component interaction verification: `node tmp/cctv-verification/check.cjs` passed search, combined filters, empty/offline states, player open/close, loading, retry, fullscreen invocation, Escape, and focus restoration. Media playback and fullscreen browser behavior are mocked.
- HTTP smoke checks against the production server covered 33 page/API paths. Auth pages, map, CCTV, community shell, crowdfunding shell, profile shell, notifications shell, and most admin shells returned 200. Root and admin root redirected. Protected endpoints rejected unauthenticated requests.

## Live integration verification

Docker Desktop and the local Compose services were started successfully. The initial database connection failures were resolved without application changes. Health, project feed, community feed, news feed, news page, and admin users page all subsequently returned 200; health reported database OK and Redis disabled in the running application configuration.

35 authenticated HTTP checks passed using temporary local citizen and agency accounts:

- Citizen and agency password login; logout.
- Profile read/update, activity, notifications read.
- Admin donation listing, agency dashboard, citizens listing, comment moderation listing, project priorities.
- Community publishing, detail, personalized like state, like/unlike, comments, replies, comment like/unlike, comment/reply deletion, post deletion.
- Project detail, edit, status change, progress update, voting and vote removal, deletion.
- News detail, edit, deletion.

An additional local storage check uploaded a PNG through `/api/upload` and fetched it through `/media/...`; both returned 200 with the correct image content type. The uploaded object was deleted afterward.

Temporary users, profiles, posts, comments, likes, projects, news, votes, and progress updates were cleaned up. No existing business records were edited.

## Remaining verification limits

- This is API integration and component testing, not a complete browser end-to-end run across every role and interaction.
- Real Google consent/token exchange, registration verification email, password reset email, payment initiation/webhooks, and production deployment remain unverified.
- Project/news creation broadcasts, citizen administration mutations, notification read toggles, and general project/news comment mutations were not covered by the live checks.
- Redis revocation and cache behavior were not exercised because Redis is disabled in the application's current environment.
- `prisma migrate status` failed with a schema engine error against the configured direct connection (`localhost:5432`). The application connection (`localhost:6432`) worked; migration readiness remains unverified. No migrations were applied.
- Standalone artifact warnings on Windows remain as described above.

Local verification artifacts: `tmp/feature-smoke-results.json` (initial smoke test before services started), `tmp/authenticated-feature-results.json` (35 passing live checks), `tmp/authenticated-feature-check.cjs`, and `tmp/upload-feature-check.cjs`.
