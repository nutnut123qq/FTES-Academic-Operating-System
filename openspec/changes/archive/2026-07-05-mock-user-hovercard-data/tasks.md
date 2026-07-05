## 1. Swap hovercard fetcher to mock

- [x] 1.1 Implement `fetchUserHovercardMock(username)` returning deterministic `UserHovercardData` with derived display name, avatar, bio, and stable counts.
- [x] 1.2 Replace the `queryUserHovercard` fetcher in `useQueryUserHovercardSwr` with the mock fetcher while keeping the SWR key `["QUERY_USER_HOVERCARD_SWR", username]` unchanged.

## 2. Document backend reconnect point

- [x] 2.1 Add `// ponytail: mock BE` comment to `query-user-hovercard.ts` indicating where to swap the fetcher back when the backend has `userProfile`.

## 3. Verify

- [x] 3.1 Run `npx tsc --noEmit` and confirm no type errors.
- [x] 3.2 Run `npm run build` and confirm a clean build.
- [x] 3.3 Start `next dev`, open `/vi/community`, hover author names and commenters, and confirm the hovercard shows name, avatar, bio, and follower/following counts instead of the error state.
