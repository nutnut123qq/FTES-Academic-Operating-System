# Design — community-de-mock

Mapping cụ thể mock → nguồn thật. Quy ước 3 tầng: client (`src/modules/api/{rest,graphql}`) →
SWR hook → component. GraphQL chỉ QUERY (read-gateway); mọi write đi REST
(`https://apitest.ftes.vn/api/v1`).

## 1. Community

| Bề mặt | File hiện tại (mock) | Nguồn thật | Ghi chú wire |
|---|---|---|---|
| Poll read | `features/community/hooks/useQueryPollSwr.ts` (`fetchPollMock`) | REST `GET /community/posts/{postId}/poll` (BE `community-engagement-reads`) | Hook nhận `postId`; thêm `getPoll(postId)` vào `modules/api/rest/community/community.ts` + types `PollResponse{postId,question,closesAt,options[{id,label,voteCount}],myOptionId}`; map `voteCount→votes`; key SWR `["poll", postId]` |
| Poll vote | `useMutatePollVoteSwr.ts` (local-only) | REST `POST /community/posts/{id}/poll-votes` (`votePoll` ĐÃ CÓ trong client) | Optimistic chọn option + tăng votes, rollback khi lỗi, revalidate `["poll", postId]` |
| Contributors | `useQueryContributorsSwr.ts` (`fetchContributorsMock`) | REST `GET /community/leaderboard?page=&size=` | Thêm `getLeaderboard` + types `LeaderboardResponse{items[{userId,score,upvotesReceived,acceptedAnswers,postsCount,rank}],total,page,size}`; map `upvotesReceived→upvotes`, `acceptedAnswers→accepted`, downvotes=0; `name` hiển thị: dùng hovercard profile theo `userId` (pattern sẵn có), fallback ẩn tên |
| Promo rail | `useQueryCommunityPromoSwr.ts` (`fetchCommunityPromoMock`) | GraphQL `activeAdvertisement(placement: COMMUNITY_RAIL)` qua `useQueryActiveAdvertisementSwr` (ĐÃ TỒN TẠI `src/hooks/swr/api/graphql/queries/useQueryActiveAdvertisementSwr.ts`) | Thêm `CommunityRail` vào enum `AdvertisementPlacement` (`modules/api/graphql/queries/types/active-advertisement.ts`); map ad→`CommunityPromo{imageUrl,title,ctaText,linkUrl,sponsorName}`; ad null → ẩn panel |
| Campus tab | `query-community-feed.ts` ("CAMPUS needs a campus arg...") + `app/[locale]/community/campus/page.tsx` (`CommunityScopePlaceholder`) | GraphQL `feed(tab, page, campus)` (BE `community-completion-v2`) | Thêm `campus` vào document + variables; `useQueryCommunityFeedSwr(tab, campus?)`; bật `Campus` trong `toFeedTab` của hook; page render `<CommunityFeed tab="campus" />`; campus không truyền → BE fallback profile |
| Saved page (MỚI) | — chưa có UI | REST `GET /community/bookmarks/posts?cursor=&limit=` + `DELETE /community/bookmarks/{postId}` (client `unbookmarkPost` ĐÃ CÓ) | `app/[locale]/community/saved/page.tsx` + `features/community/CommunitySaved/index.tsx`; hook `useQueryBookmarkedPostsSwr` (cursor infinite scroll pattern như feed); nút bỏ lưu optimistic remove; link vào nav CommunityShell; i18n `communityHub.saved.*` (vi+en) |
| Trending author | `useQueryTrendingSwr.ts` (giấu dòng tác giả — chỉ có UUID) | field `author{userId,username,displayName,avatarUrl}` mới trên `PostResponse` (BE `community-completion-v2`) | Thêm `author?` vào `PostResponse` types; `TrendingPost` thêm `authorName?/authorAvatarUrl?`; `CommunityTrending/index.tsx` khôi phục dòng tác giả khi có |
| Composer docstring | `CommunityComposer/index.tsx` "ponytail: submit is a no-op mock (no BE)" | — | Sửa docstring theo thực tế (submit thật qua `createPost`); không đổi hành vi |

## 2. Group (theo BE `group-social-engagement` + `group-identity-media-rules-rsvp`)

| Bề mặt | File hiện tại | Nguồn thật | Ghi chú |
|---|---|---|---|
| Feed engagement | `features/group/hooks/useQueryGroupFeedSwr.ts` (seed likes:0/liked:false/comments:0) | DTO `GET /groups/{id}/feed` mở rộng `likeCount/commentCount/likedByMe` | Cập nhật `GroupPostSummary` trong `modules/api/rest/group/types.ts`; map thật trong `toGroupPost` |
| Like group post | `useMutateReactGroupPostSwr.ts` (local-only) | REST `PUT/DELETE /community/reactions {targetType:"POST",targetId}` (client community ĐÃ CÓ `reactToPost/unreactPost`) | Optimistic + rollback; revalidate key group feed |
| Comment group post | `useQueryGroupPostCommentsSwr.ts` (mock) | REST `GET/POST /community/posts/{postId}/comments` (client ĐÃ CÓ) | Giữ shape `PostComment`; compose trong `GroupFeed` |
| Threads | `useQueryGroupThreadsSwr.ts`, `useQueryGroupThreadCommentsSwr.ts`, `useMutateReactGroupThreadSwr.ts`, `GroupDiscussion/index.tsx` | REST `/groups/{id}/discussion/threads**` (list/create/detail/delete, comments, reactions) | Thêm types + client vào `modules/api/rest/group/group.ts`; map `replyCount→replies, likeCount→likes, likedByMe→liked`; compose thread + comment; reaction optimistic |
| Members | `useQueryGroupMembersSwr.ts` | `GET /groups/{id}/members` (ĐÃ THẬT) | Chỉ VERIFY — không còn mock, không sửa |
| Events RSVP | `useQueryGroupEventsSwr.ts` (drop attendeeCount), `GroupEvents/index.tsx` (ghi chú "no RSVP") | REST `POST/DELETE /groups/{id}/events/{eventId}/attend`; `EventDto` thêm `attendeeCount` thật + `attending` | Hook mới `useMutateAttendGroupEventSwr` optimistic count±1 + toggle attending, rollback |
| Rules | `useQueryGroupManageSwr.ts` (`MOCK_GROUP_RULES`), `GroupManagement/index.tsx` | REST `GET/PUT /groups/{id}/rules` | Xoá `MOCK_GROUP_RULES`; hook mới `useMutateGroupRulesSwr`; editor lưu thật |
| Media avatar/cover | `GroupCreate/index.tsx` (avatar.file/cover.file bị bỏ), `GroupManagement/index.tsx` (`saveIdentity` no-op), `useIdentityImagePicker.ts` | REST `POST /groups/{id}/media/presign` → upload multipart lên `uploadUrl` → `POST /groups/{id}/media/verify` | Client mới `presignGroupMedia/verifyGroupMedia`; `GroupResponse` thêm `avatarUrl/coverUrl/rules` |

## 3. Thứ tự wire & gate theo BE
Mỗi bề mặt wire ĐỘC LẬP, gate = endpoint có mặt trên apitest:
1. Trending author + saved page + comment edit/delete surface (BE `community-completion-v2`).
2. Poll + contributors + promo (BE `community-engagement-reads`).
3. Campus (BE `community-completion-v2` — GraphQL campus).
4. Group feed engagement + threads (BE `group-social-engagement`).
5. Group rules/media/RSVP (BE `group-identity-media-rules-rsvp`).
Bề mặt nào BE chưa lên thì GIỮ mock + marker của riêng nó (không wire nửa vời).

## 4. Seed data
FE không seed DB. Dữ liệu test đến từ change BE `community-dev-seed`
(`V212__community_dev_seed.sql`, idempotent): ≥6 post đủ loại (poll có options), comment 2 tầng,
2 group (1 có post+member+event+rules), bookmark sẵn cho user seed, report OPEN — mọi màn wire ở
trên có data thật trên apitest ngay sau deploy, không cần thao tác tay.

## 5. Kiểm định
`npx tsc --noEmit` sạch + `npm run build` xanh sau mỗi cụm; smoke thủ công trên apitest bằng acc
test 4 role (learner vote poll, moderator xoá comment, owner sửa rules).
