# community-de-mock — Gỡ toàn bộ mock còn lại của Community + Group trên FE

## Why

Lane Community đã có core thật (feed/post/comment/react/trending/moderation) nhưng FE vẫn còn
một lớp mock/placeholder chờ 5 change BE (`community-engagement-reads`, `community-completion-v2`,
`community-dev-seed`, `group-social-engagement`, `group-identity-media-rules-rsvp` — repo
`FTES-AOS-Backend`):

- Poll: `useQueryPollSwr.ts` mock cứng, `useMutatePollVoteSwr.ts` giữ vote LOCAL-only.
- Leaderboard: `useQueryContributorsSwr.ts` mock cứng ("Do NOT invent one").
- Promo rail: `useQueryCommunityPromoSwr.ts` mock; hook thật `useQueryActiveAdvertisementSwr`
  ĐÃ TỒN TẠI (`src/hooks/swr/api/graphql/queries/`) chỉ chờ placement `COMMUNITY_RAIL`.
- Campus: `/community/campus` render `CommunityScopePlaceholder`; `query-community-feed.ts` ghi rõ
  "CAMPUS needs a campus arg the resolver does not pass".
- Group engagement: `useQueryGroupFeedSwr` seed likes:0/comments:0; comment/reaction group post,
  threads (`useQueryGroupThreadsSwr`, `useQueryGroupThreadCommentsSwr`,
  `useMutateReactGroupThreadSwr`) mock; `useQueryGroupManageSwr` dùng `MOCK_GROUP_RULES`;
  events không có RSVP; media avatar/cover trong GroupCreate/GroupManagement là no-op.
- Saved/bookmarks: BE có write bookmark nhưng FE KHÔNG có trang "Đã lưu" nào; BE sắp có
  `GET /community/bookmarks/posts` (hydrate).
- Trending: `useQueryTrendingSwr.ts` phải giấu dòng tác giả (chỉ có authorId UUID).
- `CommunityComposer/index.tsx` docstring stale: "ponytail: submit is a no-op mock (no BE)" —
  composer đã submit thật từ lâu.

## What Changes

- **Poll live**: `useQueryPollSwr(postId)` → REST `GET /community/posts/{postId}/poll`;
  `useMutatePollVoteSwr` gọi thật `votePoll` (đã có trong `modules/api/rest/community`) +
  optimistic + revalidate.
- **Contributors live**: `useQueryContributorsSwr` → REST `GET /community/leaderboard`.
- **Promo live**: thay `useQueryCommunityPromoSwr` bằng `useQueryActiveAdvertisementSwr`
  placement `COMMUNITY_RAIL` (thêm enum member FE).
- **Campus live**: `feed(tab, page, campus)` trong GraphQL document; bật tab CAMPUS; trang
  `/community/campus` render `CommunityFeed` thật, bỏ `CommunityScopePlaceholder`.
- **Groups engagement live**: feed likes/comments/likedByMe thật; comment + reaction group post
  qua endpoint community; discussion threads/comments/reactions qua `/groups/{id}/discussion/**`;
  events RSVP attend/unattend; manage rules + media presign→upload→verify (theo 2 change BE group).
- **Saved page mới**: `/community/saved` — trang "Đã lưu" dùng
  `GET /community/bookmarks/posts` + nút bỏ lưu.
- **Trending author**: map `author` mới của BE vào dòng tác giả (khôi phục UI đã giấu).
- **Dọn docstring**: CommunityComposer bỏ ghi chú mock stale; quét sạch marker `ponytail`/`mock BE`
  trong `features/community` + `features/group` sau khi wire.

## Impact

- Affected specs: community-live-surfaces (new), group-live-surfaces (new).
- Affected code: `src/components/features/community/**`, `src/components/features/group/**`,
  `src/modules/api/rest/{community,group}/*`, `src/modules/api/graphql/queries/{query-community-feed,
  active-advertisement types}`, `src/hooks/swr/api/**`, `src/app/[locale]/community/{campus,saved}/`,
  `src/messages/{vi,en}.json`.
- Phụ thuộc BE: theo từng bề mặt — wire được ĐỘC LẬP từng phần khi endpoint tương ứng lên apitest;
  phần BE chưa deploy thì GIỮ mock của bề mặt đó (không chặn nhau).
- Data flow 3 tầng giữ nguyên: modules/api → hooks swr → component.
