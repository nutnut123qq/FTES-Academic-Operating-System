## Context

The shared REST client (`restRequest`) already powers `challenges`, `course`, `subject`, `identity`, `commerce`, `community`, `resource`, `gamification`, and `notification`. The backend profile domain in `vn.ftes.aos.profile.web` exposes two REST controllers:

- `MeProfileController` — `/api/v1/profiles/me/**` (owner-scoped reads and writes).
- `PublicProfileController` — `/api/v1/profiles/**` (public profile, timeline, follow, moderation).

The frontend already has GraphQL operations that overlap with the main profile flow: `me`, `userProfile`, `updateProfile`, `setFollow`, `userFollowers`, and `userFollowing`. Those GraphQL operations are the preferred data layer for their use cases, so the corresponding REST reads/writes are skipped. The remaining profile REST surface — privacy settings, social links, portfolio, achievements, avatar/cover uploads, timeline, and moderation — has no GraphQL equivalent and gets typed REST clients.

## Goals / Non-Goals

**Goals:**
- Add typed REST clients in `src/modules/api/rest/profile/` for profile endpoints not covered by GraphQL.
- Add SWR mutation wrappers for every writing REST endpoint we expose.
- Add SWR query wrappers for read endpoints we expose.
- Update `src/modules/api/rest/index.ts` to re-export `./profile`.
- Document skipped endpoints and the GraphQL operations that cover them.
- Pass `npx tsc --noEmit` and `npm run build` (webpack).

**Non-Goals:**
- Do not recreate the shared REST client; reuse `src/modules/api/rest/client/`.
- Do not add REST clients for core profile/follow actions already covered by GraphQL.
- Do not add UI components or pages.
- Do not add new dependencies or backend changes.

## Decisions

### 1. Reuse `restRequest` without modification
**Rationale:** The wrapper already handles base URL, bearer token, envelope unwrap, and error mapping. Profile needs no special envelope handling.

### 2. Group clients in `src/modules/api/rest/profile/`
**Rationale:** Mirrors the backend package `profile.web` and keeps the module boundary clear, consistent with previous domains.

### 3. Skip GraphQL-covered profile endpoints
**Rationale:** Avoid duplicate data layers and conflicting cache semantics. Skipped:
- `GET /api/v1/profiles/me` → `me` GraphQL
- `PATCH /api/v1/profiles/me` → `updateProfile` GraphQL
- `GET /api/v1/profiles/{username}` → `userProfile` GraphQL
- `GET /api/v1/profiles/{username}/followers` → `userFollowers` GraphQL
- `GET /api/v1/profiles/{username}/following` → `userFollowing` GraphQL
- `POST /api/v1/profiles/{username}/follow` and `DELETE /api/v1/profiles/{username}/follow` → `setFollow` GraphQL

### 4. Expose profile portfolio/privacy/social/achievements via REST
**Rationale:** No GraphQL operations exist for portfolio projects/assets, privacy settings, social links, or self-declared achievements. These endpoints are implemented.

### 5. Expose avatar/cover/asset uploads via REST
**Rationale:** The current GraphQL `updateProfile` only accepts a URL string, not a file upload. The REST multipart endpoints are the canonical upload path for profile images and portfolio assets.

### 6. Expose public timeline and moderation endpoints via REST
**Rationale:** No GraphQL operations exist for the per-user timeline cursor page or the moderator profile patch.

### 7. Read endpoints get SWR query hooks
**Rationale:** `getPrivacySettings`, `getProfileTimeline`, and `listNotificationTemplates` are reads with no GraphQL equivalent. They get `useGet*Swr` query hooks.

### 8. Types inferred from `ProfileViews.java` and request DTOs
**Rationale:** These records are the backend source of truth. We mirror them using TypeScript interfaces, using `string` for UUIDs and ISO timestamps, and `number` for `BigDecimal` GPA. Colliding names (`ProgressView`, `CertificateView`) are prefixed with `Profile` to avoid barrel collisions.

## Risks / Trade-offs

- **[Risk]** Skipping `GET /api/v1/profiles/me` and `GET /api/v1/profiles/{username}` assumes GraphQL covers the same use cases. The REST `SelfProfile`/`PublicProfile` views include richer portfolio/privacy data; if a feature needs that exact shape, the read endpoints may need to be added later.
- **[Risk]** Multipart uploads (`avatar`, `cover`, `portfolio asset`) require `FormData`. We use `restRequest` with `Content-Type` cleared so axios can set the multipart boundary. If the shared client ever changes its default header handling, these uploads may need adjustment.
- **[Trade-off]** The moderator `PATCH /api/v1/profiles/{userId}/moderate` uses the same body as the owner update endpoint. We expose it as a separate mutation for clarity and to match the backend controller.

## Affected Files / Modules

- `src/modules/api/rest/profile/types.ts`
- `src/modules/api/rest/profile/profile.ts`
- `src/modules/api/rest/profile/index.ts`
- `src/modules/api/rest/index.ts`
- `src/hooks/swr/api/rest/mutations/usePost*.ts`
- `src/hooks/swr/api/rest/mutations/index.ts`
- `src/hooks/swr/api/rest/queries/useGet*.ts`
- `src/hooks/swr/api/rest/queries/index.ts`
