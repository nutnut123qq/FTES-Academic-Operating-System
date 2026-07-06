## Why

The shared REST client (`restRequest`) already serves `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, `blog`, and `career`. The event domain exposes two REST controllers in `vn.ftes.aos.event.web` — `EventController` for public events, registrations, QR check-ins, and certificates, and `EventAdminController` for event management, attendance, and manual check-ins. The frontend currently has no typed REST layer for event features, and the existing GraphQL livestream queries cover course livestream schedules rather than the event domain.

## What Changes

- Reuse `src/modules/api/rest/client/` (`restRequest`, envelope unwrap, bearer token) from previous changes.
- Add a typed REST client under `src/modules/api/rest/event/` covering:
  - `EventController` — public event list/detail, register/cancel, my registrations, QR, scan, my certificates, certificate verify.
  - `EventAdminController` — create event, submit/cancel/recording, manual check-in, attendance roster.
- Add `usePost*Swr` mutation hooks for every writing REST endpoint.
- Add `useGet*Swr` query hooks for read endpoints.
- Update `src/modules/api/rest/index.ts` to re-export `./event`.
- No new dependencies; no changes to backend or other modules.

## Capabilities

### New Capabilities
- `rest-fetch-event`: REST client + SWR wrappers for the event web controller cluster.

### Modified Capabilities
- None.

## Impact

- New files in `src/modules/api/rest/event/` and `src/hooks/swr/api/rest/mutations/` (plus query hooks in `src/hooks/swr/api/rest/queries/`).
- One-line change to `src/modules/api/rest/index.ts`.
- No runtime impact until components import the new hooks.
