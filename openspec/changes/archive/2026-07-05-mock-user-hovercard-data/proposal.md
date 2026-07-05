## Why

In demo/local environments the community feed is fully mocked, but the user hovercard still calls the real GraphQL backend via `queryUserHovercard`. Because `localhost:3001/graphql` is unreachable, every hovercard shows "Không tải được thông tin" even though the UI mechanics (delay, grace period, Esc, positioning) work correctly. This makes the demo look broken and inconsistent with the mocked feed.

## What Changes

- Replace the real Apollo fetcher in `useQueryUserHovercardSwr` with a local mock fetcher that returns `UserHovercardData` derived from the hovered username.
- Keep the SWR key `["QUERY_USER_HOVERCARD_SWR", username]` unchanged so optimistic follow-sync continues to work.
- Add a `// ponytail: mock BE` comment to `query-user-hovercard.ts` documenting the swap point for backend integration.
- Leave follow logic, `UserLink` API, emoji/sticker features, and other swept areas untouched.

## Capabilities

### New Capabilities

- `mock-user-hovercard-data`: Provides a deterministic, per-username mock payload for the user hovercard in environments without a backend.

### Modified Capabilities

- `user-hovercard`: Implementation-only change; the hovercard UI and SWR contract remain identical, only the data source is mocked.

## Impact

- `src/hooks/swr/api/graphql/queries/useQueryUserHovercardSwr.ts`
- `src/modules/api/graphql/queries/query-user-hovercard.ts` (comment only)
