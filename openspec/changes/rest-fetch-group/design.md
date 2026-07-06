## Context

The frontend already consumes many backend domains through the shared REST module pattern (`src/modules/api/rest/<domain>/{client.ts,types.ts,index.ts}`) and SWR hooks. The backend Group module exposes `GroupController` (`/api/v1/groups`) and `InvitationController` (`/api/v1/invitations`), which are not yet wired into the frontend. This change follows the established pattern to add the missing clients and hooks.

## Goals / Non-Goals

**Goals:**
- Provide typed REST call functions for every endpoint in `GroupController` and `InvitationController`.
- Provide SWR query and mutation hooks for those endpoints.
- Prefix all exported type names with `Group*` to avoid collisions in the top-level `src/modules/api/rest/index.ts` barrel.
- Keep build green (`npx tsc --noEmit` and `npm run build -- --webpack`).

**Non-Goals:**
- No changes to backend code or GraphQL operations.
- No new runtime dependencies.
- No UI components or pages.

## Decisions

- **Single REST module**: Both `GroupController` and `InvitationController` are implemented in one `group` REST module because they share DTOs and belong to the same backend domain.
- **Type prefix**: All exported TypeScript types use the `Group*` prefix (e.g., `GroupResponse`, `GroupMember`, `GroupInvitationRequest`) because the shared barrel flattens many modules and short names like `MemberDto` or `InviteRequest` collide with other domains.
- **Date strings as ISO strings**: `Instant` from Java is represented as `string` in TypeScript DTOs, consistent with existing REST modules.
- **Community-owned types as local `Group*` types**: `GroupController` returns `CommunityApi.FeedSlice` and `PostSummary` for feed/pinned posts. They are typed locally as `GroupFeedSlice` and `GroupPostSummary` so the group module remains self-contained and prefixed.
- **No GraphQL skips**: The existing GraphQL operations contain no group or invitation queries/mutations, so no endpoints are skipped.

## Risks / Trade-offs

- **[Risk] Future backend DTO changes drift from frontend types** → Mitigation: types are colocated in one file and follow the backend record shapes closely.
- **[Risk] Exported type names still collide** → Mitigation: strict `Group*` prefix enforced for all types; build-time barrel check will catch duplicates.
