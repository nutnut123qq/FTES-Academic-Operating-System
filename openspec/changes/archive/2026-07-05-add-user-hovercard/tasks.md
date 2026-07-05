## Pha 1 — Core + Pilot (dừng lại để review)

### 1. Preparation

- [x] 1.1 Read `starci-fe-cannon-apply` skill and `.claude/cannon/CONTENT.md` to confirm conventions (HeroUI v3 compound anatomy, SWR hook patterns, block vs feature tiers, i18n).
- [x] 1.2 Verify existing types: `UserEntity`, `useQueryUserProfileSwr`, `useMutateSetFollowSwr`, `pathConfig().profile(username).build()`, and how to get current user id/authenticated state.

### 2. Lightweight Hover Query

- [x] 2.1 Create `src/modules/api/graphql/queries/query-user-hovercard.ts` with a minimal query selecting only: `id`, `username`, `displayName`, `bio`, `avatar`, `followerCount`, `followingCount`, `isFollowedByMe`.
- [x] 2.2 Create response type `src/modules/api/graphql/queries/types/user-hovercard.ts`.
- [x] 2.3 Create SWR hook `src/hooks/swr/api/graphql/queries/useQueryUserHovercardSwr.ts` following project conventions.

### 3. Core Components

- [x] 3.1 Create `src/components/blocks/identity/UserHovercard/index.tsx` with HeroUI Popover, hover/focus delay (~400ms), grace period (~300ms), touch-device passthrough (tap navigates, no popup), lazy `useQueryUserHovercardSwr`, loading/error states, follow button with optimistic update + rollback, and `Esc`/outside-click close.
- [x] 3.2 Create `src/components/features/identity/UserLink/index.tsx` that renders `UserAvatar` + display name, wraps with `UserHovercard` (when `username` exists), and links to `/[locale]/u/[username]` using `Link` + `pathConfig`.
- [x] 3.3 Add i18n keys (`hovercard.follow`, `hovercard.unfollow`, `hovercard.followers`, `hovercard.following`, `hovercard.loading`, `hovercard.errorRetry`) to `messages/vi.json` and `messages/en.json` (or current i18n file location).

### 4. Pilot Apply (2–3 high-traffic spots)

- [x] 4.1 Refactor `src/components/features/community/CommunityFeed/index.tsx` to use `UserLink` for the post author row.
- [x] 4.2 Refactor `src/components/blocks/feed/CommunityPostCard/index.tsx` to use `UserLink` for author (if used inside CommunityFeed or standalone).
- [x] 4.3 Refactor `src/components/reuseable/Discussion/CommentItem.tsx` to use `UserLink` for comment author.

### 5. Verify Pha 1 (checkpoint — stop for review)

- [x] 5.1 Run `npx tsc --noEmit` and fix all type errors.
- [x] 5.2 Run `npm run build` (webpack) and fix build errors.
- [x] 5.3 Run `npm run lint` and fix lint errors.
- [x] 5.4 Manual smoke test: hover delay, grace period, loading/error, follow button optimistic/rollback, click → profile, touch tap → profile (devtools mobile).
- [x] 5.5 Run `starci-fe-cannon-audit` skill on the changed areas and address P0/P1 findings.
- [x] 5.6 **STOP — report pha 1 results and files changed; wait for user approval before pha 2.**

---

## Pha 2 — Sweep Remaining Locations (chỉ bắt đầu sau khi user OK pha 1)

### 6. Feed & Comments (remaining)

- [x] 6.1 Refactor `src/components/features/community/CommunityPostDetail/index.tsx` to use `UserLink` for the post author.
- [x] 6.2 Refactor `src/components/blocks/feed/CommunityCommentRow/index.tsx` to use `UserLink` for comment author.
- [x] 6.3 Refactor `src/components/reuseable/PostCommentThread/index.tsx` to use `UserLink` for comment author.
- [x] 6.4 Refactor `src/components/features/resource/ResourceDetail/ResourceComments/CommentItem/index.tsx` to use `UserLink` for comment author.

### 7. Group, Subject & Course

- [x] 7.1 Refactor `src/components/features/group/GroupMembers/index.tsx` to use `UserLink` for member rows.
- [x] 7.2 Refactor `src/components/features/group/GroupFeed/index.tsx` to use `UserLink` for post authors.
- [x] 7.3 Refactor `src/components/features/subject/SubjectMembers/index.tsx` to use `UserLink` for member rows.
- [x] 7.4 Refactor `src/components/features/subject/SubjectOverview/index.tsx` to use `UserLink` for active members and discussion authors.
- [x] 7.5 Refactor `src/components/features/subject/SubjectCommunity/index.tsx` to use `UserLink` for discussion authors.
- [ ] 7.6 Refactor `src/components/features/course/CourseDetail/index.tsx` instructor card and review authors to use `UserLink`.  
  **Blocked — API thiếu `username`:** course/instructor và review chỉ trả `displayName`/`avatar`, thiếu `username` nên link sẽ 404.

### 8. Leaderboard, Chat, Activity & Saved

- [ ] 8.1 Refactor `src/components/features/gamification/LeaderboardShell/index.tsx` to use `UserLink` for leaderboard entries.  
  **Blocked — API thiếu `username`:** leaderboard entries chỉ trả `userId` + display name, không có `username`.
- [ ] 8.2 Refactor `src/components/reuseable/LeagueRow/index.tsx` to use `UserLink` instead of its inline avatar + link.  
  **Blocked — API thiếu `username`:** league row data không có `username`.
- [ ] 8.3 Refactor `src/components/features/chat/ChatShell/index.tsx` conversation list to use `UserLink` for conversation names/avatars (when username is available).  
  **Blocked — API thiếu `username`:** conversation list chỉ trả participant IDs/names, không có public `username`.
- [ ] 8.4 Refactor `src/components/blocks/feed/ActivityFeed/index.tsx` actor link/avatar to use `UserLink` (where actor username is available).  
  **Blocked — API thiếu `username`:** activity actor object không có `username`.
- [ ] 8.5 Refactor `src/components/features/saved/SavedLibrary/index.tsx` saved post author to use `UserLink`.  
  **Blocked — API thiếu `username`:** saved-item summaries không trả author `username`.

### 9. Final Verify

- [x] 9.1 Run `npx tsc --noEmit` and fix all type errors.
- [x] 9.2 Run `npm run build` and fix build errors.
- [x] 9.3 Run `npm run lint` and fix hovercard-introduced lint errors (repo still has ~108 pre-existing lint problems).
- [ ] 9.4 Run `starci-fe-cannon-audit` skill on all changed areas and address P0/P1 findings.
- [ ] 9.5 Final manual review of representative screens.
