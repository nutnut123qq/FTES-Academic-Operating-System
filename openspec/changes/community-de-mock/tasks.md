# Tasks — community-de-mock

> Mỗi cụm gate theo endpoint BE tương ứng có mặt trên apitest (design §3). Cụm nào BE chưa lên
> thì giữ nguyên mock của cụm đó, KHÔNG wire nửa vời.

## 1. Poll (BE: community-engagement-reads)
- [ ] 1.1 `modules/api/rest/community/types.ts`: thêm `PollOptionResponse{id,label,voteCount}`,
      `PollResponse{postId,question,closesAt,options,myOptionId}`.
- [ ] 1.2 `modules/api/rest/community/community.ts`: `getPoll(postId)` → `GET /community/posts/{postId}/poll`.
- [ ] 1.3 `features/community/hooks/useQueryPollSwr.ts`: nhận `postId`, bỏ `fetchPollMock`, key
      `["poll", postId]`, map `voteCount→votes`.
- [ ] 1.4 `useMutatePollVoteSwr.ts`: gọi `votePoll(postId, optionId)` thật; optimistic + rollback +
      revalidate `["poll", postId]`; cập nhật `CommunityPoll/index.tsx` truyền `postId` thật
      (post POLL từ feed/post-detail).
- [ ] 1.5 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 2. Contributors leaderboard (BE: community-engagement-reads)
- [ ] 2.1 REST client `getLeaderboard(page,size)` + types (design §1).
- [ ] 2.2 `useQueryContributorsSwr.ts`: bỏ mock, map field, giữ shape `Contributor` (downvotes=0).
- [ ] 2.3 `CommunityReputation/index.tsx`: hiện rank/score thật; tên qua profile theo `userId`
      (pattern hovercard sẵn có), thiếu profile thì ẩn tên.
- [ ] 2.4 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 3. Promo rail (BE: community-engagement-reads)
- [ ] 3.1 `modules/api/graphql/queries/types/active-advertisement.ts`: thêm
      `CommunityRail = "COMMUNITY_RAIL"` (khớp enum BE).
- [ ] 3.2 Thay `useQueryCommunityPromoSwr` bằng `useQueryActiveAdvertisementSwr({placement:
      CommunityRail})` trong `CommunityShell/DiscoveryRail.tsx`; ad null → ẩn panel; xoá file mock.
- [ ] 3.3 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 4. Campus tab (BE: community-completion-v2)
- [ ] 4.1 `modules/api/graphql/queries/query-community-feed.ts`: thêm `$campus: String` vào
      document + variables; sửa comment "resolver does not pass".
- [ ] 4.2 `features/community/hooks/useQueryCommunityFeedSwr.ts`: signature `(tab, campus?)`;
      bật `Campus` trong `toFeedTab`; key SWR gồm campus.
- [ ] 4.3 `app/[locale]/community/campus/page.tsx`: render `<CommunityFeed tab="campus" />`;
      empty-state hướng dẫn cập nhật campus hồ sơ; gỡ `CommunityScopePlaceholder` (xoá component
      nếu không còn nơi dùng).
- [ ] 4.4 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 5. Saved page (BE: community-completion-v2)
- [ ] 5.1 REST client `getBookmarkedPosts(cursor?, limit?)` → `GET /community/bookmarks/posts`.
- [ ] 5.2 Hook `useQueryBookmarkedPostsSwr` (cursor infinite pattern như feed).
- [ ] 5.3 `features/community/CommunitySaved/index.tsx` + `app/[locale]/community/saved/page.tsx`:
      list card + nút bỏ lưu optimistic (`unbookmarkPost` sẵn có) + empty-state.
- [ ] 5.4 Link "Đã lưu" trong CommunityShell nav; i18n `communityHub.saved.*` (vi + en).
- [ ] 5.5 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 6. Trending author (BE: community-completion-v2)
- [ ] 6.1 `modules/api/rest/community/types.ts`: `PostResponse` thêm
      `author?: {userId, username, displayName, avatarUrl} | null`.
- [ ] 6.2 `useQueryTrendingSwr.ts`: `TrendingPost` thêm `authorName?/authorAvatarUrl?`; cập nhật
      docstring (bỏ đoạn "no author enrichment").
- [ ] 6.3 `CommunityTrending/index.tsx`: khôi phục dòng tác giả khi có author.
- [ ] 6.4 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 7. Group engagement + threads (BE: group-social-engagement)
- [ ] 7.1 `modules/api/rest/group/types.ts`: `GroupPostSummary` thêm `likeCount/commentCount/
      likedByMe`; types discussion (`GroupThread`, `GroupThreadComment`, requests).
- [ ] 7.2 `modules/api/rest/group/group.ts`: client `/groups/{id}/discussion/**` (list/create/get/
      delete thread, comments, reactions).
- [ ] 7.3 `useQueryGroupFeedSwr.ts`: bỏ seed 0/false, map DTO thật.
- [ ] 7.4 `useMutateReactGroupPostSwr.ts`: `reactToPost/unreactPost` (client community sẵn có) +
      optimistic/rollback + revalidate group feed key.
- [ ] 7.5 `useQueryGroupPostCommentsSwr.ts`: `GET /community/posts/{postId}/comments` thật;
      compose comment qua `addComment`.
- [ ] 7.6 `useQueryGroupThreadsSwr.ts` / `useQueryGroupThreadCommentsSwr.ts` /
      `useMutateReactGroupThreadSwr.ts`: wire endpoint discussion; map `replyCount→replies,
      likeCount→likes, likedByMe→liked`.
- [ ] 7.7 `GroupDiscussion/index.tsx`: compose thread + comment thật; xoá marker mock.
- [ ] 7.8 Xác nhận `useQueryGroupMembersSwr.ts` đã thật — không sửa.
- [ ] 7.9 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 8. Group rules / media / RSVP (BE: group-identity-media-rules-rsvp)
- [ ] 8.1 `modules/api/rest/group`: types + client `presignGroupMedia`, `verifyGroupMedia`,
      `getGroupRules`, `updateGroupRules`, `attendGroupEvent`, `unattendGroupEvent`;
      `GroupResponse` thêm `avatarUrl?/coverUrl?/rules?: string[]`; `GroupEvent` thêm `attending`.
- [ ] 8.2 `useQueryGroupManageSwr.ts`: XOÁ `MOCK_GROUP_RULES`, đọc rules thật; hook mới
      `useMutateGroupRulesSwr` + wire editor GroupManagement.
- [ ] 8.3 `GroupCreate/index.tsx` + `GroupManagement/index.tsx`: presign → upload → verify cho
      avatar/cover; seed `useIdentityImagePicker(group.avatarUrl/coverUrl)`.
- [ ] 8.4 `useQueryGroupEventsSwr.ts`: map `attendeeCount + attending`; hook mới
      `useMutateAttendGroupEventSwr` optimistic; `GroupEvents/index.tsx` nút Tham gia/Huỷ.
- [ ] 8.5 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 9. Dọn marker + verify tổng
- [ ] 9.1 `CommunityComposer/index.tsx`: sửa docstring stale "submit is a no-op mock" theo thực tế.
- [ ] 9.2 Grep `ponytail|mock BE|Mock` trong `features/community` + `features/group`: chỉ còn
      marker của bề mặt BE CHƯA deploy (nếu có), kèm ghi chú change BE tương ứng.
- [ ] 9.3 `npx tsc --noEmit` sạch; `npm run build` xanh.
- [ ] 9.4 Smoke trên apitest bằng acc test 4 role: vote poll, lưu/bỏ lưu, campus tab, like group
      post, tạo thread, RSVP, sửa rules, đổi avatar nhóm.
- [ ] 9.5 `openspec validate community-de-mock --strict` xanh.
- [ ] 9.6 Vòng chất lượng toàn change: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.
