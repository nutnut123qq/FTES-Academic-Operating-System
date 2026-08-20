# Tasks — ux-feedback-2026-08-round2

Đánh số theo đúng 3 mục của đợt góp ý #2 để đối chiếu ngược được.
`- [ ]` = CHƯA làm / NGOÀI TẦM repo FE, có ghi lý do — không tick khống.

## 1. Cú bấm đầu tiên sau khi tải trang bị nuốt (mục 1: "join khoá học phải bấm nhiều lần")

- [x] 1.1 `src/modules/auth/auth-ready.ts` (MỚI, 96 dòng): tín hiệu một-lần "phiên đã ngã ngũ
      chưa" — `isAuthReady()` thăm dò đồng bộ, `authReady()` promise settle, `markAuthReady()`
      idempotent, `__resetAuthReadyForTests()` cho test. Không dính React/redux: module trả lời
      "đã biết chưa", không trả lời "là ai"
- [x] 1.2 `useRequireAuth`: thêm `requireAuthAsync` (chờ hydration rồi mới kết luận) — dùng ở
      nơi gọi vốn đã `async`
- [x] 1.3 `useRequireAuth.guard`: `isAuthReady()` → chạy ĐỒNG BỘ y như cũ; chưa ngã ngũ → xếp
      hàng chờ. Giữ đường đồng bộ là bắt buộc, nếu không mọi cú bấm bị đẩy sang microtask và
      chuỗi cử chỉ trình duyệt (`preventDefault`, mở tab, focus) mất
- [x] 1.4 `useRequireAuth.requireAuth`: đọc `store.getState()` thay vì biến closure — closure
      đã cũ ngay sau `await`; phụ phẩm: callback ổn định định danh
- [x] 1.5 Dedupe cú bấm trùng trong cửa sổ chờ bám **tham chiếu `action`**, không bám hook
      instance — một `useRequireAuth()` sinh nhiều CTA (`onEnroll`/`onAddToCart`/`onTryLearning`),
      cờ dùng chung sẽ làm nút THỨ HAI chết câm. Kèm `mountedRef` gán lại khi mount (StrictMode
      mount → cleanup → mount lại)
- [x] 1.6 `useQueryUserSwr`: bọc fetcher `try/finally` → `markAuthReady()` chạy ở CẢ ba đường ra
      (khách không token / `me` không trả user / lỗi mạng). Thiếu một đường thì cơ chế chờ phải
      sống nhờ net timeout, tức CTA đứng im vài giây
- [x] 1.7 33 nơi gọi đổi chốt-trước-mutation `requireAuth` → `requireAuthAsync`/`guard`:
      community (`useMutateAcceptAnswerSwr`, `useMutateCommentActionsSwr`,
      `useMutatePostOwnerActionsSwr`, `useMutateReportContentSwr`, `useMutateCreatePostCommentSwr`,
      `useMutatePollVoteSwr`, `useMutateReactPostSwr`, `CommunityComposerForm`), group (13 file:
      `GroupAnnouncement`, `GroupCreate`, `GroupDiscussion`, `GroupEvents`, `GroupFeedComposer`,
      `GroupInvitationResponder`, `GroupInviteDialog`, `GroupResources` + 5 hook mutate), subject
      (5 file), blog (`BlogEngagement`), resource (`ResourceComments`, `ResourceRating`), event
      (`useMutateEventRegistrationSwr`), identity (`useMutateFollowUserSwr`), challenge
      (`ChallengePaperCommentThread`), dùng chung (`PostCommentThread`)
- [x] 1.8 16 file test cập nhật mock `useRequireAuth` cho khớp hợp đồng mới (thêm
      `requireAuthAsync`) — mock cũ thiếu hàm này thì component ném lỗi chứ không im
- [x] 1.9 `useRequireAuth.test.tsx` (MỚI, 8 ca): ca 1 fail với code cũ đúng vì lý do được báo.
      Redux KHÔNG mock (dùng store thật — thứ đang test chính là "đọc lại state tươi sau khi
      chờ"); `__resetAuthReadyForTests` chạy mỗi ca vì tín hiệu settle là singleton

### 1b. Cờ `keycloak.initialized` — phát hiện trên đường truy nguyên

- [x] 1.10 `setInitialized` chưa từng được dispatch ở BẤT KỲ đâu trong `src/` (chỉ tồn tại ở
      `redux/slices/keycloak.ts:56`). `useQueryUserSwr` bật nó khi `authReady()` settle
      (`:186`) — treo vào `authReady` chứ không dispatch thẳng trong fetcher, để net timeout
      cũng bật được cờ (backend không trả lời ⇒ fetcher không có đường ra ⇒ cờ kẹt `false` ⇒
      skeleton vĩnh viễn)
- [x] 1.11 Hệ quả: **mục #23 của `ux-feedback-2026-08` (tasks.md 7.1) ship xong là chết ngay** —
      `HomeLanding` chốt bằng `signedIn = initialized && authenticated`, mà `initialized` kẹt
      `false` ⇒ chưa từng chuyển hướng ai. Đợt này mới thực sự làm nó chạy; docblock được sửa
      cho đúng sự thật
- [x] 1.12 `AccountMenuDropdown`: bỏ heuristic tự chế `isLoading && !user`, đọc thẳng
      `initialized`. Comment cũ trong chính file đã thừa nhận *"the `initialized` flag is never
      set"* — cờ chết đứng giữa hệ, mỗi nơi đọc tự xoay một kiểu
- [x] 1.13 `redux/hooks.ts`: thêm `useAppStore` (typed `useStore`) — đi qua `<Provider>` nên
      test vẫn tiêm được store riêng, khác với import singleton `store`
- [x] 1.14 `useQueryUserSwr.test.tsx` (MỚI, 3 ca): cờ phải bật ở CẢ nhánh có user LẪN nhánh
      khách/lỗi; SWR được cấp cache riêng mỗi ca, nếu không ca hai bị dedup và fetcher không chạy
- [ ] 1.15 CHƯA LÀM — chớp landing: người đã đăng nhập vào `/` vẫn thấy landing một nhịp rồi mới
      sang `/dashboard`. Không có tín hiệu phiên nào đọc được TRƯỚC paint (cờ edge
      `session_hint` chưa từng được set). Cần session hint đồng bộ ở tầng edge
- [ ] 1.16 CHƯA LÀM — trần chờ 8 giây (`auth-ready.ts:33`) là số CỨNG chọn theo cảm tính, không
      đo. Hết trần thì rơi về nhánh khách ⇒ mạng cực chậm vẫn có thể thấy modal sai. Nâng cấp:
      treo vào `AbortSignal`/timeout thật của transport + trạng thái "đang xác thực phiên" cho CTA

## 2. Rơi locale (mục 2)

- [x] 2.1 `src/i18n/routing.ts`: bỏ `domain: ".academy.starci.org"` (di sản khung StarCi — trình
      duyệt VỨT `Set-Cookie` có `Domain` không phủ host, nên cookie `LOCALE` chưa bao giờ ghi
      được ở BẤT KỲ đâu: localhost, preview Vercel, production). `sameSite: "none"` → `"lax"`,
      `secure` chỉ bật ở production (`none` bắt buộc kèm `Secure`, mà `Secure` chết trên
      `http://localhost`). Docblock ghi rõ: **đừng ghim `domain` lại**
- [x] 2.2 `src/i18n/routing.test.ts` (MỚI, 3 ca): khoá "không có `domain`", `sameSite: "lax"`,
      và tên + max-age mà middleware/server đang trông đợi
- [x] 2.3 Lỗi này là cả một LỚP, không phải một chỗ: quét `src/` ở HEAD ra **13 điểm / 6 file**
      đẩy đường dẫn locale-LESS qua router `next/navigation` (router này không thêm locale)
- [x] 2.4 `AccountMenuAuthed` (5 điểm: dashboard, teaching, profile, settings, wallet) → router
      của `@/i18n/navigation`; bỏ luôn `useLocale()` ở đường đăng xuất vì không còn phải tự ghép
- [x] 2.5 `GamificationStatsRow` (3 điểm: tiến độ ×2, bảng xếp hạng) → router locale-aware
- [x] 2.6 `EarnGuideModal` (2 điểm) và `AdminMpegDashTest/Header` (1 điểm, `"/admin"`) → router
      locale-aware
- [x] 2.7 `CourseQa` (1 điểm): GIỮ `next/navigation` và tự nội suy `/${locale}` — hai cú push
      khác trong file dựng từ `pathname` vốn đã locale-full, đổi import là double-prefix
      `/vi/vi/...`
- [x] 2.8 `LegalPage` (1 điểm, breadcrumb "Trang chủ"): truyền `locale` tường minh vào
      `pathConfig().locale(locale)` — file chỉ có đúng một điểm, không cần đổi import
- [x] 2.9 `AccountMenuAuthed/index.test.tsx` + `GamificationStatsRow/index.test.tsx` (MỚI, 6+3
      ca): mock CẢ HAI router cạnh nhau và khẳng định **router nào** nhận cú push. Không khẳng
      định URL cuối: test mock `@/i18n/navigation` vĩnh viễn không thấy tiền tố locale (docblock
      `src/i18n/navigation.ts`), assert vào URL là assert khống theo cả hai chiều
- [x] 2.10 Quét lại sau khi vá: **0 điểm** còn lại. Ba chỗ còn đẩy chuỗi tuyệt đối qua
      `next/navigation` (`NotificationCenter:143`, `ProfileOverviewTab:116`, `CourseQa:155`) đều
      nội suy `${locale}` cố ý

## 3. Quest cộng đồng không cộng XP (mục 3)

- [x] 3.1 `src/messages/{vi,en}.json`: `guide.actions.commentCreated` "Viết 1 bình luận" → "Viết
      1 bình luận **cộng đồng**" (en: "Write a **community** comment"). Nhãn trống phạm vi đọc
      thành "mọi bình luận đều có EXP", trong khi dòng đó bám đúng `rule_key` `community.*` —
      bình luận blog không có rule nào, bình luận challenge không phát event
- [x] 3.2 `guide-claims.test.ts`: khoá hình dạng (`postCreated`/`commentCreated` phải nêu phạm vi
      cộng đồng ở CẢ hai catalog), KHÔNG khoá câu chữ. Cũng không cho phép viết ngược lại "chỉ
      bình luận cộng đồng mới có EXP" — bình luận học liệu (`resource.commented`) cũng trả 10 EXP
      thật
- [ ] 3.3 NGOÀI REPO FE — quest cộng đồng thật sự không nhích: ứng viên duy nhất là
      `CommunityOutboxRelay.java:23` (`FTES-AOS-Community`) đòi profile Spring `worker` mà không
      file nào trong 4 repo bật profile đó cho service Community; cổng thứ hai
      `ftes.runtime.consumers-enabled` mặc định TRUE nên không phân biệt api/worker. Phần còn lại
      của đường ống ĐÃ KIỂM, SẠCH (tên event khớp seed V221, envelope đủ field, cùng topic, jar
      hợp đồng giống nhau từng byte ở 265 class, serializer đúng, dedupe/DLQ không nuốt)
- [ ] 3.4 PHẢI CHỐT BẰNG RUNTIME — `docker-compose.local.yml` bị gitignore
      (`FTES-AOS-Backend/.gitignore:17`) nên repo không chứng minh được host có set profile hay
      không. Lệnh + cây quyết định ở `RUNBOOK-quest-community.md` (cùng thư mục này). Người có
      tay trên hạ tầng chạy, đừng vá mù ở FE
- [ ] 3.5 CHƯA ĐIỀU TRA — góp ý còn kèm "học xong 1 bài ở phần học thử vẫn tính là hết môn và
      cộng 5000 XP". Không có bằng chứng nào trong repo FE cho mục này; nó nằm ở quy tắc
      gamification phía BE, chưa truy nguyên đợt này

## 4. Verify

Chạy trên working tree **có kèm change song song** `course-term-filter-and-my-courses-entry`
(hai lane cùng dirty một cây), nên số dưới đây phủ cả hai — không tách riêng được.

- [x] 4.1 `npx tsc --noEmit` — **sạch**, exit 0, không một dòng output
- [x] 4.2 `npx vitest run` — **248 file / 1838 test, xanh toàn bộ**, 146.44s. Trong đó 5 file test
      MỚI của đợt này: `useRequireAuth.test.tsx` (8), `AccountMenuAuthed/index.test.tsx` (6),
      `useQueryUserSwr.test.tsx` (3), `GamificationStatsRow/index.test.tsx` (3),
      `i18n/routing.test.ts` (3) = 23 ca
- [x] 4.3 `npx eslint` trên 67 đường dẫn đợt này đụng tới (51 file có `requireAuthAsync` + 16
      file locale/phiên): còn **74 lỗi ở 5 file, TẤT CẢ nằm ngoài
      hunk của đợt này** (baseline `indent`/`no-unused-vars` có sẵn, đúng kiểu 484 lỗi nền mà
      `npx eslint src` toàn repo vẫn báo). Đã đối chiếu từng dòng:
      `searchWiring.integration.test.tsx` lỗi `:88,:91` / hunk `@76`;
      `GroupCreate` lỗi `:36-45` / hunk `@79,92,133,146`;
      `useMutateAttendGroupEventSwr` lỗi `:76-79` / hunk `@24,29,85`;
      `ResourceRating` lỗi `:175-236` / hunk `@114,161`;
      `useMutateSubjectMembershipSwr` lỗi `:63-65` / hunk `@46,78,97,102,118`.
      Không file nào đợt này TẠO ra lỗi lint mới
- [x] 4.4 Quét hồi quy locale (script tạm, không commit): `next/navigation` + đường dẫn
      locale-LESS = **13 điểm / 6 file ở HEAD → 0 ở working tree**
- [ ] 4.5 `npm run build` — CHƯA chạy (6 phút trên máy này, và cây đang chứa hai change). Người
      dùng chạy trước khi deploy
- [ ] 4.6 CHƯA kiểm bằng tay trên trình duyệt: (a) tải trang rồi bấm NGAY một CTA auth-gated —
      phải chạy, không được bật modal; (b) đổi sang `en`, đóng tab, mở lại đường không có locale
      — phải còn `en` (cookie `LOCALE` giờ mới ghi được); (c) 13 điểm ở mục 2 bấm từ `/en/...`
      phải ở lại `/en/...`
