# Tasks — ux-feedback-2026-08-round3

Đánh số theo đúng 8 mục của `Feedback FTES System.docx` để đối chiếu ngược được.
`- [ ]` = CHƯA làm / NGOÀI TẦM repo FE, có ghi lý do — không tick khống.

## 1. Quên mật khẩu xong đăng nhập acc khác vẫn kẹt màn hình đó (mục 1)

- [x] 1.1 `src/components/layouts/auth/GuestOnlyRoute/index.tsx` (MỚI): đọc
      `state.keycloak.authenticated`, hành động MỘT CHIỀU khi `=== true` → `router.replace("/")`
      (router của `@/i18n/navigation`) + trả `null`. Docblock ghi rõ vì sao không đọc `false`:
      redux không persist nên `false` = "chưa biết", đọc nó là đá nhầm người đang hydrate
- [x] 1.2 `src/components/layouts/auth/GuestOnlyRoute/index.test.tsx` (MỚI): 3 ca — khách giữ
      nguyên trang; đã đăng nhập thì mất children + `replace("/")`; rerender `false → true`
      (đúng ca cảnh báo) thì card biến mất và `replace` gọi đúng 1 lần
- [x] 1.3 `app/[locale]/authentication/forgot-password/page.tsx`: bọc `<ForgotPasswordForm />`
- [x] 1.4 Rà 14 route con của `authentication/**`, chốt **chỉ `forgot-password`** là guest-only:
      `two-factor` cần access token, `verify-otp` chạy cả LOGIN lẫn VERIFY_PHONE,
      `reset-password` do `?token` cầm quyền, `register` đã `redirect()` server-side,
      callback/logout OAuth cần phiên. 13 route còn lại KHÔNG đụng
- [x] 1.5 `ForgotPasswordForm`: `href="/"` → `href="/?auth=signin"` — app không có route đăng
      nhập, chỉ có `AuthenticationModal` mở qua deep-link `?auth=` của `AuthQueryOpener`

## 2. "Ngôn ngữ Việt tệ quá" (mục 2)

- [x] 2.1 Xác nhận KHÔNG phải thiếu dịch: `vi.json`/`en.json` cùng 6601 key, thiếu 0 key.
      259 chuỗi trùng nhau đều là danh từ riêng (FrosTES, GitHub, F.Wallet…)
- [x] 2.2 `vi.json` — 4 sửa thuật ngữ lệch (chỉ đổi value, không đổi key):
      `composer.kinds.poll` Khảo sát→**Bình chọn**, `composer.pollHint` theo cùng,
      `composer.kinds.showcase` Khoe dự án→**Dự án**, `engagement.replyPlaceholder`
      Viết câu trả lời…→**Viết trả lời…**
- [x] 2.3 `i18n-keys.test.ts`: describe mới khoá `composer.kinds.poll === menu.poll` và
      `composer.kinds.showcase === search.types.PROJECT_SHOWCASE`
- [ ] 2.4 Văn phong tiếng Việt nói chung — CHỦ QUAN, không kiểm chứng được từ code. Cần góp ý
      chỉ đích danh màn hình/chuỗi mới xử lý được

## 3. Nút "Add image" báo lỗi upload (mục 3)

- [ ] 3.1 NGOÀI TẦM repo FE. FE (`PostImagePicker`) và BE (`CommunityMediaController`) đều
      đúng; gốc là `ImageStorageChain.java:73` — cả ba provider `PENDING_CREDENTIALS` thì ném
      `StorageUnavailableException` → 5xx. Cấu hình môi trường deploy, không có code để sửa

## 4. Icon ảnh trên toolbar bấm vào không hiện gì (mục 4)

- [x] 4.1 `RichTextEditor`: `catch` bỏ `console.error` + `eslint-disable`, thay bằng
      `toast.danger(t("uploadFailed"))`. Key đặt trong namespace `richEditor` của chính
      component — không kéo `communityHub` vào một component dùng chung
- [x] 4.2 `messages/{vi,en}.json`: thêm `richEditor.uploadFailed`
- [x] 4.3 `RichTextEditor`: thêm prop `imageButton`, `showImageButton = imageButton ?? isFull`.
      Mặc định giữ `isFull` để `AnnouncementForm`/`GroupFeedComposer`/`PostEditDialog` không âm
      thầm mất nút ảnh
- [x] 4.4 `SubjectCommunity` + `CommunityComposerForm`: `imageButton={false}` — đúng 2 chỗ vừa
      có `toolbar="full"` vừa có `PostImagePicker`
- [x] 4.5 KHÔNG đụng `buildEditorExtensions`: extension `Image` phải giữ để bài cũ có
      `![](url)` trong body vẫn render được
- [x] 4.6 `ExamContribute.tsx` xác nhận KHÔNG dính — nó không dùng `RichTextEditor` cũng không
      dùng `PostImagePicker` (có `AlbumImagePicker` riêng, comment tại `:60`)
- [x] 4.7 `RichTextEditor/index.test.tsx` (MỚI): 4 ca — upload lỗi → `toast.danger` và
      `setImage` KHÔNG gọi; upload xong → `setImage({src, alt})`; `imageButton={false}` → mất cả
      nút lẫn `input[type=file]`; `toolbar="comment"` vẫn không có nút ảnh

## 5. Preview sẵn 1 comment mỗi bài (mục 5)

- [ ] 5.1 KHÔNG làm đợt này. Đề xuất tính năng, không phải lỗi. Quy tắc người góp ý nêu
      ("nhiều tym > nhiều reply > mới nhất") cần trường `topComment` mới xuyên Contracts →
      Community → gateway, và `reply_count` hôm nay chưa denormalize

## 6. Bấm Blog thì văng khỏi trang community (mục 6)

- [x] 6.1 Xác nhận ĐÃ VÁ ở đợt trước — `CommunityNavShell` bọc `/blog`, `/groups`, `/events`
      bằng chính `NavRail`, rail đã có dòng "Community" để về bảng tin + trạng thái active
      (góp ý #21). Ảnh trong doc chụp bản cũ. Không sửa gì thêm

## 7. Có 2 poll trở lên thì sao (mục 7)

- [x] 7.1 Xác nhận đường lọc theo kind ĐÃ CÓ ở BE, không thêm gì: `communitySearch(postType:)`
      (`schema.graphqls:25`), `PostRepository.java:271-285` lọc ở DB, và `PostEnricher.java:91-93`
      cho thấy GraphQL `Post.kind` chính là `postType`
- [x] 7.2 `CommunityPoll/PollList.tsx` (MỚI): `CommunityPollList` — mọi bài POLL, mới nhất
      trước, `useQueryCommunitySearchSwr({q:"", sort:Newest, postType:"POLL"})` +
      `InfiniteScrollSentinel`; mỗi hàng render thẳng `<CommunityPoll postId>` nên bỏ phiếu tại
      chỗ. Theo khuôn `CommunitySaved`
- [x] 7.3 `app/[locale]/community/poll/page.tsx`: `<CommunityPoll />` → `<CommunityPollList />`
- [x] 7.4 `useQueryPollSwr`: xoá `resolveLatestPollPostId` + `POLL_DISCOVERY_LIMIT` + import
      `query-community-feed`; `postId` thành bắt buộc; `pollSwrKey` bỏ nhánh `"latest"`
- [x] 7.5 `useMutatePollVoteSwr`: bỏ `Promise.all` mutate kép, còn `mutate(pollSwrKey(postId))`
- [x] 7.6 `CommunityPoll`: `postId` bắt buộc, export `PollSkeleton`, xoá `isEmpty`/`emptyContent`
      (code chết khi `postId` bắt buộc — 404 đi vào nhánh `error`), viết lại comment `useEffect`
- [x] 7.7 `messages/{vi,en}.json`: thêm `communityHub.poll.title`; `poll.empty` bỏ mệnh đề nói
      dối "trong bảng tin của bạn"
- [x] 7.8 Sửa 3 comment có tiền đề chết sau thay đổi này: `CommunityComposerForm` (lý do mới là
      lý do THẬT — hàng bảng tin không render phương án), `CommunityPostContent:272-276`,
      `e2e/community-de-mock.spec.ts`
- [x] 7.9 `e2e/community-de-mock.spec.ts`: test 2 thu `.first()` từ cấp TRANG vào `widget` theo
      heading (giống test 1) — với N poll trên trang thì `.first()` có thể trúng poll khác
- [x] 7.10 `CommunityPoll/index.test.tsx`: xoá ca `"shows the empty state when no poll is
      discoverable"` (ca duy nhất render không `postId`), mock `AsyncContent` bỏ nhánh `isEmpty`
- [x] 7.11 `PollList.test.tsx` (MỚI): 4 ca — 3 poll ⇒ 3 thẻ đúng thứ tự (chính là bug cũ: 3 ra
      1); ghim tham số `{q:"", sort:"DESC", postType:"POLL"}` (ai đổi lại thành quét feed là
      đỏ); empty; phân trang
- [ ] 7.12 `/community/poll` giờ 1+N request — mỗi hàng tự gọi `GET /posts/{id}/poll`. KHÔNG vá:
      cần `getPolls(Collection<UUID>)` xuyên ba repo. Trang cũ mở được đúng MỘT poll nên đây
      không phải hồi quy so với thứ dùng được
- [ ] 7.13 Poll về bảng tin như mọi bài khác (đúng tinh thần góp ý #17 hơn) — cần hàng bảng tin
      render được phương án, ngoài phạm vi đợt này

## 8a. Đăng lại bài viết rồi không tìm thấy nó ở đâu (mục 8, vế 1)

- [x] 8a.1 **BẪY, ghi lại để không ai dẫm lần nữa:** `shareType:"SHARE"` KHÔNG phải "đăng lại
      không lời bình" — nó là telemetry của nút Sao chép liên kết / Facebook / X / Zalo
      (`PostEngagementBar:256` → `CommunityPostContent:311` → `useMutateSharePostSwr:22`).
      Cho nhánh đó tạo Post = mỗi lần copy link đẻ một bài rỗng lên bảng tin
- [x] 8a.2 `CommunityComposerForm:166`: luôn gửi `shareType: "QUOTE"` kể cả lời bình rỗng, giữ
      `quoteContent: commentary || undefined`. Docblock ghi vì sao không được gửi `"SHARE"`
- [x] 8a.3 `useMutateSharePostSwr`: docblock ghi rõ nó SỞ HỮU `"SHARE"` và đó là telemetry
- [x] 8a.4 `query-community-feed.ts` + `query-community-post.ts`: chọn thêm `quotedPost`
- [x] 8a.5 `useQueryCommunityFeedSwr`: `toQuotedPost` map `QuotedPost`, chạy
      `splitBodyImages(unwrapAutolinks(...))` y hệt `toCommunityPost` — không thì cùng một bài
      in sạch ở hàng gốc mà lộ `![Ảnh](...)` ở card lồng
- [x] 8a.6 `CommunityFeed/index.tsx:417`: render `<QuotedPostCard>`, đặt NGOÀI `<Link>` bao thẻ
      (card lồng chứa `UserLink`, `<a>` lồng `<a>` là HTML không hợp lệ)
- [x] 8a.7 `CommunityPostDetail/CommunityPostContent.tsx:275`: render `<QuotedPostCard>`
- [x] 8a.8 `QuotedPostCard`: bỏ trường `id` khỏi type — kéo qua 6 lớp mà không nơi nào đọc
      (composer đọc `quote.id` nhưng vật thể đó do `openQuote(...)` dựng tại chỗ từ
      `CommunityQuoteContext`, không đến từ BE)
- [x] 8a.9 Bài gốc bị gỡ sau khi đã bị đăng lại → card lồng xuống `available: false`, không vỡ,
      không lộ nội dung
- [x] 8a.10 `useQueryCommunityFeedSwr.test.ts` + `CommunityFeed/index.test.tsx`: ca mới cho
      `quotedPost` (map, và so `toQuotedPost` với chính output của `toCommunityPost` trên cùng
      một body)

## 8b. Trả ô chat về trang chính + nút mở rộng popup (mục 8, vế 2)

- [ ] 8b.1 CHƯA LÀM — **sót do lỗi lập kế hoạch**, không phải quyết định có cân nhắc.
      `CommunityLiveChatRail` vẫn chỉ là khung đọc + dòng `expandHint` "Click to open the full
      chat"; chưa có ô nhập inline, chưa có nút mở rộng ở góc phải trên

## 9. Cổng kiểm tra

- [x] 9.1 `npx vitest run` — 249 file / 1849 test, 0 đỏ (mốc trước khi sửa: 239 / 1781)
- [x] 9.2 `npx tsc --noEmit` — exit 0, sạch toàn repo
- [x] 9.3 `npx eslint` trên các file đã sửa — sạch, trừ 17 lỗi rule `quotes` ở hai file `gql`
      (bắt backtick của template literal, đã vi phạm 16 lần từ trước; dòng `quotedPost` mới chỉ
      theo đúng khuôn có sẵn)
