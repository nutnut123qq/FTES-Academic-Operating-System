# ux-feedback-2026-08-round3 — Đợt góp ý #3: đăng lại không ra bài, trang bình chọn chỉ mở được một, quên mật khẩu không thoát ra được

## Why

Đợt góp ý thứ BA, nguồn là `Feedback FTES System.docx` (8 mục kèm ảnh chụp màn hình), tiếp sau
`ux-feedback-2026-08` (23 mục) và `ux-feedback-2026-08-round2` (3 mục). Đã đối chiếu TỪNG mục
vào code trước khi sửa — kết quả: **5 mục là lỗi thật**, 1 mục đã được vá từ đợt trước, 1 mục
là cấu hình môi trường (không có code để sửa), 1 mục là đề xuất tính năng.

### Mục 8a — "Repost bài viết thì cái Repost nó xuất hiện ở đâu vậy? Tìm không thấy."

Không tìm thấy vì **nó không tồn tại**. FE gửi `shareType: "SHARE"` khi ô bình luận để trống
(`CommunityComposerForm.tsx:166` ở HEAD), và BE nhận `"SHARE"` thì chỉ ghi một dòng
`community.shares` + `incrementShareCount` — **không tạo Post nào**
(`InteractionService.java:256` ở HEAD). Bài đăng lại không có ở bảng tin, không có ở hồ sơ,
không có ở đâu cả.

Nhánh `"QUOTE"` (có lời bình) thì tạo Post `DISCUSSION` mang **đúng phần lời bình**. Bài gốc
biến mất: `quotePostId` được lưu trên bảng `shares` nhưng `Post` không giữ tham chiếu nào,
`PostResponse` không có trường quote, GraphQL `type Post` cũng không. `QuotedPostCard` tồn tại
trong repo nhưng CHỈ được dùng để xem trước trong composer — chưa từng được render lúc đọc.
Nên bài đăng lại có lời bình hiện ra như một bài rỗng nghĩa.

**Cạm bẫy đã suýt dẫm phải, ghi lại để không ai dẫm lần nữa:** bản vá đầu tiên cho `"SHARE"`
tạo Post thật. Sai — `"SHARE"` KHÔNG phải giá trị "đăng lại không lời bình", nó đang là
**đường telemetry** của nút *Sao chép liên kết / Facebook / X / Zalo / chia sẻ hệ thống*
(`PostEngagementBar/index.tsx:256` → `CommunityPostContent.tsx:311` →
`useMutateSharePostSwr.ts:22`, fire-and-forget và nuốt lỗi). Cho nhánh đó đẻ Post nghĩa là
**mỗi lần bấm copy link là một bài rỗng đăng công khai lên bảng tin**. Lời giải: FE luôn gửi
`"QUOTE"` (lời bình rỗng cũng vậy), `"SHARE"` giữ nguyên vai telemetry.

### Mục 7 — "Nếu có 2 cái poll trở lên cùng xuất hiện thì sao?"

Thì không thấy cái thứ hai. `/community/poll` render đúng MỘT poll:
`resolveLatestPollPostId` (`useQueryPollSwr.ts` ở HEAD) kéo 20 item đầu của bảng tin *For You*
rồi `.find(item => item.kind === "POLL")`. Hai hậu quả: poll thứ hai trở đi không có lối vào
từ menu, và nếu 20 bài đầu không có POLL nào thì trang hiện RỖNG dù hệ thống đang có poll.

Ganh nặng kéo theo: `CommunityComposerForm` phải `router.push('/community/{id}')` sau khi tạo
poll — đi ngược góp ý #17 của đợt một ("về feed, đừng nhảy vào chi tiết") — kèm comment giải
thích rằng trang chi tiết là nơi DUY NHẤT bỏ phiếu được, chính vì trang bình chọn chỉ mở được
poll mới nhất.

Đường lọc theo kind **đã có sẵn**, không phải thêm gì ở BE: `communitySearch(postType:)`
(`schema.graphqls:25`) → `PostRepository.java:271-285` lọc ở DB, và `PostEnricher.java:91-93`
cho thấy GraphQL `Post.kind` CHÍNH LÀ `postType`.

### Mục 1 — quên mật khẩu xong đăng nhập bằng tài khoản khác vẫn kẹt ở màn hình cũ

Cả cây `src/app/[locale]/authentication/**` không có một chốt nào cho người ĐÃ đăng nhập, và
`ForgotPasswordForm` giữ cờ `sent` trong state cục bộ. Ảnh chụp cho thấy đúng cảnh đó: thanh
điều hướng đã là trạng thái đã-đăng-nhập (avatar, giỏ hàng, chuông) trong khi thân trang vẫn
là card *"If that email exists, a reset link is on its way"*.

Rà 14 route con thì **chỉ `forgot-password` là guest-only thật**. Chặn các route còn lại là
giết tính năng: `two-factor` bắt buộc phải có access token (chặn = không ai bật được 2FA),
`verify-otp` chạy cả `purpose=LOGIN` lẫn `purpose=VERIFY_PHONE`, `reset-password` do `?token`
trong email cầm quyền (đá về `/` = người dùng hết đường đổi mật khẩu), `register` đã
`redirect()` server-side sẵn, callback/logout OAuth cần phiên để chạy.

Phụ: link *"Back to sign in"* trỏ `href="/"` — về trang chủ, không phải màn đăng nhập.

### Mục 4 — "icon thêm hình ảnh ở thanh toolbar, click vào nhưng không hiện"

`RichTextEditor` nuốt lỗi upload: `catch` chỉ `console.error` + `eslint-disable`, không toast,
không dấu hiệu nào ra UI. Trong khi nút *"Add image"* ngay cạnh (`PostImagePicker`) thì
`toast.danger`. Cùng một sự cố, một đường báo đỏ, một đường im re.

Và đó là triệu chứng của một lỗi thứ hai nhìn thấy ngay trong ảnh: modal *"Start a discussion"*
có **hai đường thêm ảnh song song** — nút toolbar chèn `![](url)` vào markdown, nút *"Add
image"* gắn vào mảng `media[]`. Hai cơ chế khác nhau, hai chỗ lưu khác nhau, đặt cạnh nhau.

### Mục 2 — "Ngôn ngữ Việt tệ quá"

Không phải thiếu dịch: `vi.json` và `en.json` **cùng 6601 key, thiếu 0 key**. Thứ kiểm chứng
được là **thuật ngữ lệch nhau giữa hai bề mặt kề nhau**: `menu.poll` = "Bình chọn" nhưng
`composer.kinds.poll` = "Khảo sát" — cùng một khái niệm, hai từ, cách nhau một cú bấm. Rà tiếp
ra thêm 3 cặp cùng dạng. Phần còn lại của góp ý là văn phong — chủ quan, cần chỉ đích danh màn
hình mới xử lý được, đợt này không đụng.

## What Changes

### Đăng lại ra bài thật, mang theo bài gốc (mục 8a)

- **`CommunityComposerForm`** — luôn gửi `shareType: "QUOTE"`, lời bình rỗng cũng vậy; giữ
  `quoteContent: commentary || undefined`. Docblock ghi thẳng vì sao KHÔNG được gửi `"SHARE"`
  từ đây (nó đã có chủ: telemetry).
- **`QuotedPostCard`** — từ chỗ chỉ dùng để xem trước trong composer, nay render ở CẢ
  `CommunityFeed` (`:417`) lẫn `CommunityPostContent` (`:275`). Đặt NGOÀI `<Link>` bao thẻ vì
  nó chứa `UserLink` — `<a>` lồng `<a>` là HTML không hợp lệ.
- **`query-community-feed.ts` / `query-community-post.ts`** — chọn thêm trường `quotedPost`.
- **`useQueryCommunityFeedSwr.toQuotedPost`** — chạy `splitBodyImages(unwrapAutolinks(...))`
  y hệt `toCommunityPost`, không thì cùng một bài in sạch ở hàng gốc mà lộ `![Ảnh](...)` ở card
  lồng.
- **`useMutateSharePostSwr`** — docblock ghi rõ nó sở hữu `"SHARE"` và đó là telemetry, để lần
  sau không ai lại tưởng đó là "đăng lại rỗng".
- Bài gốc bị gỡ sau khi đã bị đăng lại: card lồng xuống trạng thái `available: false` — không
  vỡ, không lộ nội dung.

### Trang bình chọn liệt kê mọi poll (mục 7)

- **`CommunityPoll/PollList.tsx` (MỚI)** — `CommunityPollList`: mọi bài POLL, mới nhất trước,
  qua `useQueryCommunitySearchSwr({q:"", sort:Newest, postType:"POLL"})` + `InfiniteScrollSentinel`.
  Mỗi hàng render thẳng `<CommunityPoll postId>` nên bỏ phiếu tại chỗ. Theo đúng khuôn
  `CommunitySaved`.
- **`useQueryPollSwr`** — xoá `resolveLatestPollPostId` + `POLL_DISCOVERY_LIMIT`; `postId`
  thành **bắt buộc**, khoá SWR bỏ nhánh `"latest"`. `useMutatePollVoteSwr` bỏ theo cú
  `mutate` kép.
- **`CommunityPoll`** — `postId` bắt buộc, xoá nhánh `isEmpty`/`emptyContent` (thành code chết
  khi `postId` bắt buộc: 404 đi vào nhánh `error`), export `PollSkeleton`.
- **3 comment nói dối** được sửa cho khớp sự thật mới (`CommunityComposerForm`,
  `CommunityPostContent`, `e2e/community-de-mock.spec.ts`) — tiền đề "chỉ mở được poll mới
  nhất" chết sau thay đổi này.
- **`e2e/community-de-mock.spec.ts`** — test 2 dùng `.first()` ở cấp TRANG; với N poll trên
  trang thì nó có thể trúng poll khác. Thu phạm vi vào `widget` theo heading, giống test 1.

### Chốt guest-only cho quên mật khẩu (mục 1)

- **`src/components/layouts/auth/GuestOnlyRoute/index.tsx` (MỚI)** — đọc
  `state.keycloak.authenticated`, chỉ hành động một chiều khi `=== true` (redux không persist,
  `false` nghĩa là *"chưa biết"* chứ không phải *"là khách"* — cùng cái bẫy mà đợt round2 đã
  trả giá), `router.replace("/")` bằng router locale-aware của `@/i18n/navigation`, trả `null`
  để card cũ không nháy.
- **`forgot-password/page.tsx`** — bọc form. **13 route còn lại KHÔNG đụng**, lý do từng cái
  ghi trong docblock của `GuestOnlyRoute`.
- **`ForgotPasswordForm`** — `href="/"` → `href="/?auth=signin"` (app không có route đăng nhập,
  chỉ có `AuthenticationModal`; `?auth=` là đường deep-link `AuthQueryOpener` đã dùng thật).

### Một lối thêm ảnh, và lỗi upload phải nhìn thấy được (mục 4)

- **`RichTextEditor`** — `catch` bỏ `console.error`, thay bằng `toast.danger(t("uploadFailed"))`
  với key nằm trong namespace `richEditor` của chính component, không kéo `communityHub` vào
  một component dùng chung.
- **`RichTextEditor`** — thêm prop `imageButton`, `showImageButton = imageButton ?? isFull`.
  Mặc định giữ nguyên `isFull` để `AnnouncementForm` / `GroupFeedComposer` / `PostEditDialog`
  không âm thầm mất nút.
- **`SubjectCommunity` + `CommunityComposerForm`** — `imageButton={false}`, đúng hai chỗ vừa có
  `toolbar="full"` vừa có `PostImagePicker`.
- Extension `Image` **giữ nguyên** — bài cũ đã có `![](url)` trong body vẫn phải render được.

### Thống nhất thuật ngữ tiếng Việt (mục 2)

| key | cũ | mới | vì sao |
| --- | --- | --- | --- |
| `communityHub.composer.kinds.poll` | Khảo sát | **Bình chọn** | `menu.poll` + cả 5 key `communityHub.poll.*` đã dùng "Bình chọn" — 1 chọi 6 |
| `communityHub.composer.pollHint` | Khảo sát cần có… | **Bình chọn cần có…** | in ngay dưới chip vừa sửa, trong cùng một panel |
| `communityHub.composer.kinds.showcase` | Khoe dự án | **Dự án** | `KIND_TO_POST_TYPE` map `showcase → PROJECT_SHOWCASE`, mà `search.types.PROJECT_SHOWCASE` = "Dự án"; hai anh em `question`/`knowledge` đều là danh từ trần |
| `communityHub.engagement.replyPlaceholder` | Viết câu trả lời… | **Viết trả lời…** | cùng EN `"Write a reply…"`; 5/6 namespace khác đã là "Viết trả lời…" |

- **`i18n-keys.test.ts`** — khoá hình dạng: `composer.kinds.poll === menu.poll` và
  `composer.kinds.showcase === search.types.PROJECT_SHOWCASE`. Ai đổi lệch lại là đỏ.
- Thêm `richEditor.uploadFailed` và `communityHub.poll.title` ở cả hai catalog;
  `poll.empty` bỏ mệnh đề nói dối "trong bảng tin của bạn".

## Không làm / còn treo

- **Mục 3 — "Add image" báo `Could not upload the image`.** FE và BE đều đúng; gốc là
  `ImageStorageChain.java:73` — Cloudinary/S3/GitHub đều `PENDING_CREDENTIALS` thì ném
  `StorageUnavailableException`. Cấu hình môi trường deploy, **không có code để sửa**.
- **Mục 5 — preview sẵn 1 comment mỗi bài** ("nhiều tym > nhiều reply > mới nhất"). Đề xuất
  tính năng, không phải lỗi. Cần trường `topComment` mới xuyên Contracts → Community →
  gateway, và thứ tự đó cần `reply_count` mà hôm nay chưa denormalize.
- **Mục 8b — trả ô chat về trang chính + nút mở rộng popup.** `CommunityLiveChatRail` hiện chỉ
  là khung đọc + dòng `expandHint`; muốn gõ phải mở modal. **Sót khỏi đợt này do lỗi lập kế
  hoạch**, không phải quyết định — còn nguyên.
- **Mục 6 — bấm Blog văng khỏi community.** Đã vá ở đợt trước (`CommunityNavShell`, góp ý #21).
  Ảnh trong doc chụp bản cũ.
- **`/community/poll` giờ 1+N request** — mỗi hàng render `CommunityPoll` với khoá SWR riêng ⇒
  `GET /posts/{id}/poll` × N. Vá đúng cần `getPolls(Collection<UUID>)` đọc theo lô, tức thêm
  API xuyên ba repo. Ghi nhận: trang cũ mở được đúng MỘT poll, nên đây là hồi quy hiệu năng
  của một trang vốn chưa dùng được.
- **Poll vẫn không render phương án ở hàng bảng tin**, nên `CommunityComposerForm` vẫn phải
  đẩy tác giả sang trang chi tiết sau khi tạo. Comment ở đó nay nói đúng lý do thật.
- **Văn phong tiếng Việt nói chung** (mục 2, phần chủ quan) — cần góp ý chỉ đích danh màn hình.

## Capabilities

Không thêm capability mới. Đây là đợt sửa lỗi trên các bề mặt đã có.
