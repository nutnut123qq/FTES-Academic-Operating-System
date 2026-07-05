## Context

The user hovercard UI and SWR wiring are already implemented and working. The only issue in demo/local mode is that `useQueryUserHovercardSwr` still calls the real GraphQL backend, which is not running. The community feed is already mocked via `fetchPostDetailMock`, so the hovercard should follow the same pattern.

## Goals / Non-Goals

**Goals:**
- Show a populated hovercard for any hovered username in demo/local.
- Derive deterministic display info from the username (or props already known in `UserLink`).
- Keep the SWR key unchanged so optimistic follow updates still propagate.
- Mark the real query file as the future swap point for backend integration.

**Non-Goals:**
- Changing hovercard UI, follow logic, `UserLink` props, or other community features.
- Removing the real GraphQL query.
- Archiving the change or committing to git.

## Decisions

- **Mock inside the SWR hook, not in the query file**: `query-user-hovercard.ts` stays a real Apollo query. The hook `useQueryUserHovercardSwr` swaps its fetcher to a mock function. This keeps the backend reconnect to a single one-line fetcher swap.
- **Derive data from username**: The mock generates `id`, `displayName`, `avatar`, `bio`, and stable follower/following counts from the username string so hovering different users produces different, consistent cards.
- **Keep `isFollowedByMe: false`**: Matches the demo state where no follow relationships exist.

## Risks / Trade-offs

- [Risk] The mock `id` is synthetic, so any follow mutation using it will still hit the real backend and fail in demo.  
  → Mitigation: Demo/local only; this is expected behavior until the backend is available.
