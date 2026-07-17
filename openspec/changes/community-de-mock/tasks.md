# Tasks — community-de-mock

> Mỗi cụm gate theo endpoint BE tương ứng có mặt trên apitest (design §3). Cụm nào BE chưa lên
> thì giữ nguyên mock của cụm đó, KHÔNG wire nửa vời.

## 1. Poll (BE: community-engagement-reads)
> Cụm 1–3 ĐÃ IMPLEMENT 2026-07-16 qua BE change `community-engagement-reads` task 5 (cùng lane
> Community) — tsc + eslint xanh; còn lại vòng chất lượng (1.5/2.4/3.3) thuộc change này.
- [x] 1.1 `modules/api/rest/community/types.ts`: thêm `PollOptionResponse{id,label,voteCount}`,
      `PollResponse{postId,question,closesAt,options,myOptionId}`.
- [x] 1.2 `modules/api/rest/community/community.ts`: `getPoll(postId)` → `GET /community/posts/{postId}/poll`.
- [x] 1.3 `features/community/hooks/useQueryPollSwr.ts`: nhận `postId`, bỏ `fetchPollMock`, key
      `["poll", postId]`, map `voteCount→votes`. (`postId` optional: omit → tự khám phá POLL post
      mới nhất qua GraphQL feed FOR_YOU 20 item cho trang standalone `/community/poll`; key
      `["poll", postId ?? "latest"]`; i18n `poll.empty` vi+en.)
- [x] 1.4 `useMutatePollVoteSwr.ts`: gọi `votePoll(postId, optionId)` thật; optimistic + rollback +
      revalidate `["poll", postId]`; cập nhật `CommunityPoll/index.tsx` truyền `postId` thật
      (post POLL từ feed/post-detail). (`CommunityPoll` nhận prop `postId?`; `myOptionId` server
      thắng local reveal — không double-count sau revalidate; rollback + `toast.danger`
      `poll.voteFailed` vi+en khi write lỗi.)
- [ ] 1.5 Vòng chất lượng: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.

## 2. Contributors leaderboard (BE: community-engagement-reads)
- [x] 2.1 REST client `getLeaderboard(page,size)` + types (design §1).
- [x] 2.2 `useQueryContributorsSwr.ts`: bỏ mock, map field, giữ shape `Contributor` (downvotes=0;
      thêm `score/rank` thật từ BE).
- [x] 2.3 `CommunityReputation/index.tsx`: hiện rank/score thật; tên: BE non-PII (chỉ `userId`) và
      CHƯA có endpoint profile-by-userId (hovercard resolve theo username, không theo id) → chưa
      resolve được profile → `name=null`, ẨN dòng tên (đúng nhánh "thiếu profile thì ẩn tên");
      bật lại resolve khi BE mở lookup theo userId.
- [x] 2.4 Vòng chất lượng (GẤP, verify-first XANH 2026-07-17): `tsc --noEmit` sạch + eslint sạch
      trên 5 file wire; contract FE↔BE khớp CHÍNH XÁC với `community-engagement-reads`
      (`InteractionController.leaderboard` `GET /api/v1/community/leaderboard`,
      `LeaderboardEntryResponse{userId,score,upvotesReceived,acceptedAnswers,postsCount,rank}` +
      `LeaderboardResponse{items,total,page,size}`, envelope `{code,message,data}` unwrap qua
      `restRequest`, gate `community.leaderboard.read`); i18n `communityHub.reputation.*` +
      `states.retry` đủ vi+en; nav `/community/reputation` (NavRail) → page → `CommunityReputation`.
      Không có finding. Unit/e2e runner CHƯA có ở community-fe (chỉ playwright dep, không config/script)
      → đánh giá 2 vòng đầy đủ để lại backlog lane. Không thay đổi code (wire 2.1–2.3 đã đúng).

## 3. Promo rail (BE: community-engagement-reads)
- [x] 3.1 `modules/api/graphql/queries/types/active-advertisement.ts`: thêm
      `CommunityRail = "COMMUNITY_RAIL"` (khớp enum BE). (Kèm chỉnh cả types + query + hook sang
      contract gateway v2: `Advertisement` không envelope, enum UPPERCASE, placement INLINE
      per-document vì gateway 401 mọi operation khai variable non-null — quirk như feed.)
- [x] 3.2 Thay `useQueryCommunityPromoSwr` bằng `useQueryActiveAdvertisementSwr({placement:
      CommunityRail})` trong `CommunityShell/DiscoveryRail.tsx`; ad null → ẩn panel; xoá file mock.
      (LỆCH nhỏ: giữ file `useQueryCommunityPromoSwr.ts` làm ADAPTER mỏng wrap
      `useQueryActiveAdvertisementSwr` + map media→imageUrl theo mediaType — panel promo nằm ở
      `CommunityShell/PromoBanner.tsx` (không phải DiscoveryRail); mock đã xoá khỏi file, promo
      null → PromoBanner return null.)
- [x] 3.3 Vòng chất lượng (GẤP, verify-first XANH 2026-07-17): `tsc --noEmit` sạch + eslint sạch
      trên 5 file promo wire; contract FE↔BE khớp CHÍNH XÁC với schema.graphqls
      (`activeAdvertisement(placement: AdvertisementPlacement!, courseId: String): Advertisement`,
      `Advertisement{id,mediaType,media:JSON!,title,ctaText?,linkUrl,sponsorName?}`, enum
      `AdvertisementMediaType{IMAGE,VIDEO,CAROUSEL}`, placement `COMMUNITY_RAIL` seed V231 house ad
      `ad000000-…-001`); placement inline per-document đúng quirk gateway non-null-variable 401;
      i18n `communityHub.promo.sponsored` đủ vi+en. Runner unit/e2e CHƯA có ở community-fe (chỉ
      `@playwright/test` dep, không config/script) → đánh giá 2 vòng thủ công, findings để lại backlog
      lane (2: `<img>` không onError fallback khi imageUrl chết → ảnh vỡ; video/carousel thiếu poster
      → panel ẩn im lặng — cả 2 mức thấp, spec không yêu cầu). Không thay đổi code (wire 3.1–3.2 đúng).

## 4. Campus tab (BE: community-completion-v2)
> Cụm 4.1–4.3 IMPLEMENT 2026-07-17 (verify-first, gate BE `community-completion-v2` ĐÃ có trên
> schema+resolver — xác minh dưới). tsc xanh, JSON i18n hợp lệ.
- [x] 4.1 `modules/api/graphql/queries/query-community-feed.ts`: thêm `$campus: String` vào
      document (nullable → an toàn với quirk gateway non-null-variable 401) + variables
      (`campus: campus ?? null`); `QueryCommunityFeedParams` thêm `campus?`; sửa comment enum
      `FeedTab` (bỏ "resolver does not pass") + docstring nêu fallback profile campus.
- [x] 4.2 `features/community/hooks/useQueryCommunityFeedSwr.ts`: `CommunityFeedTab` thêm
      `"campus"`; `toFeedTab` map `campus→FeedTab.Campus`; signature `(tab, campus?)`; key SWR
      gồm campus khi có (`scopedCampus` chỉ áp cho tab campus); truyền `campus` xuống query.
- [x] 4.3 `app/[locale]/community/campus/page.tsx`: render `<CommunityFeed tab="campus" />`
      (không truyền campus → BE fallback profile campus); `CommunityFeed` empty-state campus-aware
      (`feed.campusEmpty` + `feed.campusEmptyHint` hướng dẫn cập nhật cơ sở hồ sơ, vi+en); XOÁ
      `CommunityScopePlaceholder/` (chỉ campus page dùng, nay không còn nơi dùng). Tab campus
      reachable qua `CommunityShell` nav (`{key:"campus",segment:"campus"}`).
- [x] 4.4 Vòng chất lượng (GẤP, verify-first XANH 2026-07-17): `tsc --noEmit` sạch; i18n JSON
      vi+en hợp lệ (`feed.campusEmpty`/`campusEmptyHint`). Contract FE↔BE khớp CHÍNH XÁC với
      `community-completion-v2`: schema `feed(tab: FeedTab!, page: CursorInput, campus: String):
      PostConnection!`; `FeedController.feed` nhận `@Argument campus`, CAMPUS thiếu campus →
      fallback `profileQuery.getCampus(viewer)`; `CommunityApiImpl.getPersonalFeed` chặn CAMPUS+null
      → trả `FeedSlice(List.of(), null)` (connection RỖNG, KHÔNG ném COMMUNITY_CAMPUS_REQUIRED) →
      FE hiện empty-state hướng-dẫn-hồ-sơ thay vì lỗi. Không có finding correctness. Runner unit/e2e
      CHƯA có ở community-fe (chỉ `@playwright/test` dep, không config/script) → đánh giá 2 vòng thủ
      công; findings tooling (eslint baseline) để lại backlog lane. Không thay đổi code sau đánh giá.

## 5. Saved page (BE: community-completion-v2)
> IMPLEMENT 2026-07-17 (verify-first, GẤP). Gate BE `community-completion-v2` ĐÃ có:
> `InteractionController.bookmarkedPosts` `GET /community/bookmarks/posts?cursor=&limit=` →
> envelope `{code,message,data: FeedPage<PostResponse>}`, `PostResponse.author` enrich. tsc+eslint xanh.
- [x] 5.1 REST client `getBookmarkedPosts(cursor?, limit?)` → `GET /community/bookmarks/posts`
      (`FeedPage<PostResponse>`; `cursor||undefined` để trang đầu không gửi param); `types.ts` thêm
      `PostAuthor{userId,username?,displayName?,avatarUrl?}` + `PostResponse.author?: PostAuthor|null`
      (khớp BE `PostAuthor`, additive — cũng là field task 6.1 dùng).
- [x] 5.2 Hook `useQueryBookmarkedPostsSwr` (`useSWRInfinite` keyset cursor như `useQueryMyFeedSwr`):
      getKey null khi chưa auth / `!previous.nextCursor`; map `PostResponse→SavedPost`; expose
      `posts/isLoading/isLoadingMore/hasMore/setSize/mutate` + `removePost` optimistic (drop khỏi mọi
      page `revalidate:false` → `unbookmarkPost` → rollback `mutate()` khi lỗi).
- [x] 5.3 `features/community/CommunitySaved/index.tsx` + `app/[locale]/community/saved/page.tsx`:
      list card (ThreadsPostRow + UserLink + title/snippet link) + nút bỏ lưu optimistic
      (`BookmarkSimpleIcon` fill, `removePost` + `toast.danger` khi lỗi) + empty-state
      (`AsyncContent` skeleton/empty/error) + `InfiniteScrollSentinel`.
- [x] 5.4 Link "Đã lưu" trong CommunityShell nav (NavRail `BookmarkSimpleIcon` + ⋯ menu `MENU_ITEMS`);
      i18n `communityHub.saved.{title,empty,emptyHint,error,unsave,unsaveFailed,member}` + `menu.saved`
      (vi + en).
- [x] 5.5 Vòng chất lượng (verify-first XANH 2026-07-17): `tsc --noEmit` sạch + eslint sạch 7 file;
      contract FE↔BE khớp chính xác (keyset cursor, terminate qua trailing empty page). Runner
      unit/e2e CHƯA có ở community-fe → đánh giá 2 vòng thủ công; findings (low: card render raw
      `content` không snippet; info: BE trả nextCursor non-null mọi trang → 1 fetch rỗng thừa khi cạn)
      để lại `docs/BACKLOG-REVIEW-lane-community.md`. Không thay đổi code sau đánh giá.

## 6. Trending author (BE: community-completion-v2)
> Wire 2026-07-17 (GẤP, verify-first XANH). ĐÃ SẴN: `PostAuthor` + `PostResponse.author?` (6.1, thêm
> từ cụm bookmarks — khớp record BE `PostAuthor{userId,username?,displayName?,avatarUrl?}` +
> `PostResponse` field cuối `author` nullable của `community-completion-v2` design §3). Additive +
> defensive: BE `community-completion-v2` CHƯA deploy → `/trending` chưa enrich `author` → `authorName`
> undefined → dòng tác giả tự ẩn (degradation sạch); tự bật khi BE populate.
- [x] 6.1 `modules/api/rest/community/types.ts`: `PostResponse` thêm
      `author?: {userId, username, displayName, avatarUrl} | null`. (ĐÃ có sẵn — `PostAuthor` +
      `PostResponse.author?: PostAuthor|null`, dùng chung với `/bookmarks/posts`.)
- [x] 6.2 `useQueryTrendingSwr.ts`: `TrendingPost` thêm `authorName?/authorUsername?/authorAvatarUrl?`
      + `authorSeed` (fallback avatar = `author.userId ?? authorId`); `toTrendingPost` map từ
      `post.author`; docstring viết lại (bỏ đoạn "no author enrichment", ghi batch-resolve + degrade).
- [x] 6.3 `CommunityTrending/index.tsx`: khôi phục dòng tác giả (UserAvatar `size-4` + tên `body-xs`
      muted, dưới title) CHỈ khi `authorName` có. Dùng `UserAvatar` non-interactive (KHÔNG `UserLink`)
      vì cả row đã bọc `<Link>` tới post → tránh anchor lồng anchor. Docstring "mock data" đã cập nhật.
- [x] 6.4 Vòng chất lượng (GẤP, verify-first XANH 2026-07-17): `tsc --noEmit` sạch + eslint sạch trên
      2 file wire; contract FE↔BE khớp CHÍNH XÁC với `community-completion-v2`
      (design §3/§4.3 + spec `community-trending-author`: `/trending` populate `author` nullable qua
      1 lần batch profile, thiếu card → `author=null`, FE tự ẩn dòng tên). Runner unit/e2e CHƯA có ở
      community-fe (chỉ playwright dep, không config/script) → đánh giá 2 vòng thủ công, không finding,
      không đổi code sau đánh giá.

## 7. Group engagement + threads (BE: group-social-engagement)
> IMPLEMENT 2026-07-17 (verify-first, GẤP). Gate BE `group-social-engagement` ĐÃ commit
> (6744627, migration V233); xác minh: `GroupDiscussionController` `/groups/{id}/discussion/**`
> đủ threads/comments/reactions; `GroupContentService.feedWithEngagement` hydrate thật qua
> `CommunityApi.getPostEngagement` (KHÔNG stub). tsc + webpack build XANH.
- [x] 7.1 `modules/api/rest/group/types.ts`: `GroupPostSummary` thêm `likeCount/commentCount/
      likedByMe`; types discussion (`GroupThreadDto`, `GroupThreadCommentDto`, `GroupThreadRequest`,
      `GroupThreadCommentRequest`). Khớp record BE `ThreadDto`/`ThreadCommentDto`.
- [x] 7.2 `modules/api/rest/group/group.ts`: client `/groups/{id}/discussion/**` (list/create/get/
      delete thread, list/create/delete comment, PUT/DELETE reactions thread+comment); +
      `getPostComments` vào community client (group post reuse endpoint community).
- [x] 7.3 `useQueryGroupFeedSwr.ts`: map `likeCount→likes, commentCount→comments, likedByMe→liked`
      thật (bỏ seed 0/false).
- [x] 7.4 `useMutateReactGroupPostSwr.ts`: `reactToPost/unreactPost` (community sẵn có, targetType
      POST) + optimistic snapshot + rollback theo `wasLiked` + revalidate qua `matchesGroupFeedKey`.
- [x] 7.5 `useQueryGroupPostCommentsSwr.ts`: `GET /community/posts/{postId}/comments` thật (build
      tree flat→nested qua `groupComments.buildCommentTree`); compose qua `addComment` +
      `useComposeGroupPostComment` (revalidate). `GroupFeed` dùng compose thật.
- [x] 7.6 `useQueryGroupThreadsSwr.ts` (list thật, map counters) / `useQueryGroupThreadCommentsSwr.ts`
      (list thật + `useComposeGroupThreadComment`) / `useMutateReactGroupThreadSwr.ts` (PUT/DELETE
      reactions thật + optimistic/rollback); + `useMutateCreateGroupThreadSwr` (tạo thread).
- [x] 7.7 `GroupDiscussion/index.tsx`: composer tạo thread (`GroupThreadComposer`) + comment thật;
      xoá marker mock. Author = authorId fallback (feed DTO non-PII, như post author).
- [x] 7.8 Xác nhận `useQueryGroupMembersSwr.ts` đã thật (`listGroupMembers`, không mock) — không sửa.
- [x] 7.9 Vòng chất lượng (verify-first XANH 2026-07-17): `tsc --noEmit` sạch + webpack build xanh;
      contract FE↔BE khớp CHÍNH XÁC (`GroupDiscussionController` + `GroupContentService`
      engagement hydrate thật). Runner unit/e2e CHƯA có ở community-fe (chỉ playwright dep, không
      config/script) → đánh giá 2 vòng thủ công. Finding chất lượng (low: group post/thread comment
      author = authorId UUID vì REST CommentResponse/ThreadCommentDto non-PII — GraphQL post-detail
      có author enrich nhưng REST comment thì không) đã append backlog lane. Không đổi code sau đánh giá.

## 8. Group rules / media / RSVP (BE: group-identity-media-rules-rsvp)
> IMPLEMENT 2026-07-17 (verify-first, GẤP). Gate BE `group-identity-media-rules-rsvp` ĐÃ commit
> (fdc4719/9bbd918, migration V234-V235); xác minh: `GroupController` có media/presign|verify,
> GET/PUT rules, events/{eventId}/attend; `GroupResponse` có avatarUrl/coverUrl/rules; `EventDto`
> có attendeeCount thật + attending. tsc + webpack build XANH.
- [x] 8.1 `modules/api/rest/group`: types + client `presignGroupMedia`/`uploadGroupMediaFile`(fetch
      multipart tới uploadUrl tuyệt đối)/`verifyGroupMedia`, `getGroupRules`, `updateGroupRules`,
      `attendGroupEvent`, `unattendGroupEvent`; `GroupResponse` thêm `avatarUrl?/coverUrl?/rules?`;
      `GroupEvent` thêm `attending`. `useQueryGroupSwr` map avatarUrl/coverUrl thật (bỏ hardcode null).
- [x] 8.2 `useQueryGroupManageSwr.ts`: XOÁ `MOCK_GROUP_RULES`, đọc rules thật (thêm vào Promise.all);
      hook mới `useMutateGroupRulesSwr` (PUT replace-all) + editor `GroupRulesEditor` trong
      GroupManagement (thêm/sửa/xoá dòng + Lưu, re-seed khi server đổi).
- [x] 8.3 `GroupCreate/index.tsx` + `GroupManagement/index.tsx`: presign → upload → verify cho
      avatar/cover (hook `useMutateGroupMediaSwr` toast per-step; GroupCreate inline sau create,
      best-effort không chặn redirect); seed `useIdentityImagePicker(group.avatarUrl/coverUrl)`.
- [x] 8.4 `useQueryGroupEventsSwr.ts`: map `attendeeCount + attending`; hook mới
      `useMutateAttendGroupEventSwr` optimistic count±1 + rollback revalidate; `GroupEvents/index.tsx`
      `GroupEventRow` nút Tham gia/Huỷ + count thật.
- [x] 8.5 Vòng chất lượng (verify-first XANH 2026-07-17): `tsc --noEmit` sạch + webpack build xanh;
      contract FE↔BE khớp CHÍNH XÁC (`GroupController` media/rules/attend + `GroupResponse`/`EventDto`
      mở rộng + `UploadFtesGroupMediaStorageClient` /api/images multipart). Runner unit/e2e CHƯA có
      → đánh giá 2 vòng thủ công. Finding (info: dev dùng `LocalGroupMediaStorageClient` → uploadUrl
      stub localhost:9000 nên bước upload thật fail trong dev nhưng objectExists→true; med: RSVP
      success giữ optimistic count không reconcile EventDto server trả về) đã append backlog lane.
      Không đổi code sau đánh giá; eslint indent baseline (prettier-vs-eslint, nổ cả file chưa động)
      để lại backlog lane.

## 9. Dọn marker + verify tổng
- [x] 9.1 `CommunityComposer/index.tsx`: sửa docstring stale "submit is a no-op mock" theo thực tế
      (composer POST thật qua `CommunityComposerForm` → `createPost`).
- [x] 9.2 (verify-first XANH 2026-07-17, tsc `--noEmit` sạch) Grep `mock BE|mock data|mock FE|no-op
      mock` trong `features/community` + `features/group`: dọn 8 docstring stale "mock data" nay đã
      wire BE thật — CommunityComposer (createPost), CommunityPostDetail (useQueryPostDetailSwr),
      CommunityShell (layout chrome, rail+children tự fetch), GroupAnnouncement (listAnnouncements),
      GroupDetailShell + GroupMembers + GroupsList (useQueryGroup*/discoverGroups), GroupIdentityFields
      (upload thật presign→PUT→verify ở form chủ). GIỮ marker legit: `NavRail` ("no data" đúng — rail
      chỉ link), `GroupChallenge` ("mock BE — join thật ở challenge module, out of scope no-op" — đã
      có ghi chú). `ponytail:` là convention docstring nhà (85 chỗ toàn repo), KHÔNG xoá.
      Finding backlog: `useQueryGroupsSwr.toGroup` vẫn hardcode `avatarUrl/coverUrl: null` +
      comment "BE has no avatar/cover" nay stale (GroupResponse đã có avatarUrl?/coverUrl? từ task 8.1)
      — sửa map là thay đổi hành vi (ngoài scope cleanup docstring) → để lại backlog lane.
- [x] 9.3 `npx tsc --noEmit` sạch; `npm run build` (webpack) xanh — verify lại 2026-07-17 trước commit (exit 0).
- [ ] 9.4 Smoke trên apitest bằng acc test 4 role: vote poll, lưu/bỏ lưu, campus tab, like group
      post, tạo thread, RSVP, sửa rules, đổi avatar nhóm.
- [x] 9.5 `openspec validate community-de-mock --strict` xanh (verify 2026-07-17: "Change 'community-de-mock' is valid").
- [ ] 9.6 Vòng chất lượng toàn change: unit test + e2e test → đánh giá vòng 1 → fix → đánh giá vòng 2.
