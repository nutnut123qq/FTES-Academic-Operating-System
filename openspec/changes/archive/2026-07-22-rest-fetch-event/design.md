## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, `notification`, `profile`, `wallet`, `blog`, and `career`. The backend event domain in `vn.ftes.aos.event.web` exposes two REST controllers:

- `EventController` — `/api/v1/event/**` (public event reads, user registrations, QR, certificates).
- `EventAdminController` — `/api/v1/event/admin/**` (event management, attendance, manual check-in).

The frontend has GraphQL livestream queries (`queryMyUpcomingLivestreams`, `queryLivestreamSessions`), but those cover course livestream schedules, not the event domain. Therefore every event endpoint is implemented via REST.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/event/` for all event endpoints.
- Add SWR mutation wrappers for every writing REST endpoint.
- Add SWR query wrappers for every read REST endpoint.
- Update `src/modules/api/rest/index.ts` to re-export `./event`.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.
- Do not duplicate GraphQL-covered course livestream reads.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap (`code === 200`), and error mapping. Event needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/event/`
**Rationale:** Mirrors the backend package `event.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Implement every event endpoint
**Rationale:** No GraphQL operations overlap with the event surface. All reads and writes are exposed via REST.

### 4. Types inferred from `EventViews.java`
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps.

### 5. Prefix response types with `Event` where generic
**Rationale:** Names like `EventView`, `RegistrationView`, `CertificateView`, and `AttendanceView` are likely to collide with other modules. Prefixing keeps the root barrel safe.

## Risks / Trade-offs

- **[Risk]** Admin endpoints require `event.manage` or `event.checkin.operate`; callers must ensure admin UIs hold the appropriate permission.
- **[Risk]** `EventAdminController.create` returns only the event `UUID`, not a full view; the caller may need to refetch detail.
- **[Trade-off]** We expose both public event reads and authenticated user/admin actions as separate functions to keep the audience explicit.

## Affected Files / Modules

- `src/modules/api/rest/event/types.ts`
- `src/modules/api/rest/event/event.ts`
- `src/modules/api/rest/event/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
