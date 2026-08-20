# ux-feedback-2026-08-round2 — Đợt góp ý #2: cú bấm đầu bị nuốt, rơi locale, quest cộng đồng

## Why

Đợt góp ý thứ HAI, tiếp sau `ux-feedback-2026-08` (23 mục, `test01.docx`). Lần này chỉ có
**3 mục**, nhưng cả ba đều là lỗi CÂM — không có gì đỏ, không có gì ném lỗi, người dùng chỉ
thấy sản phẩm "hơi dở" — và hai trong ba đã hỏng từ trước khi ai kịp nhìn.

### Mục 1 — "join khoá học phải bấm nhiều lần mới ăn"

Redux ở app này **không persist**. `state.keycloak.authenticated` là `false` ở MỌI lần tải
trang, kể cả với người đang đăng nhập; nó chỉ bật `true` sau khi fetcher của
`useQueryUserSwr` chạy xong — mà đó là HAI chặng mạng nối tiếp (GraphQL `me` rồi REST
`/profiles/me`), chưa kể chặng refresh token trước đó.

`useRequireAuth` cũ coi `false` trong cửa sổ đó là **"khách"** (`src/hooks/useRequireAuth.ts:36`
ở HEAD): `guard()` (`:52-57`) mở modal đăng nhập rồi **vứt luôn hành động**. Cú bấm đầu tiên
sau khi tải trang biến mất, người dùng bấm lại lần hai — lúc đó phiên đã ngã ngũ — thì ăn.
Đúng triệu chứng được báo, và nó áp cho MỌI chốt auth trong app chứ không riêng nút ghi danh.

Cửa sổ đó lẽ ra đã có cờ để chờ: `keycloak.initialized`. Truy tiếp thì phát hiện **cờ này
chưa từng được dispatch** — `setInitialized` chỉ tồn tại trong chính slice
(`src/redux/slices/keycloak.ts:56`), không một dòng nào trong `src/` gọi nó. Hệ quả:

- **Mục #23 của đợt trước (`ux-feedback-2026-08/tasks.md` 7.1) đã ship nhưng CHẾT NGAY.**
  `HomeLanding` chốt redirect bằng `signedIn = initialized && authenticated`
  (HEAD `HomeLanding/index.tsx:52-54`); `initialized` kẹt `false` vĩnh viễn ⇒ biểu thức luôn
  `false` ⇒ **chưa từng chuyển hướng một ai**. Vá "đăng nhập rồi vẫn thấy landing page" của
  đợt trước là code chết kể từ lúc merge; đợt này mới thực sự làm nó chạy.
- `AccountMenuDropdown` (HEAD `:49-52`) đã BIẾT điều đó — comment trong file ghi thẳng
  *"the `initialized` flag is never set, so it would skeleton forever"* — và tự chế heuristic
  riêng `isLoading && !user`. Một cờ chết đứng giữa hệ, mỗi nơi đọc nó tự xoay một kiểu.

### Mục 2 — rơi locale

Người dùng chỉ vào MỘT chỗ. Rà lại thì đó không phải một chỗ, mà là **cả một lớp**: mọi nơi
đẩy một đường dẫn **locale-LESS** qua router của `next/navigation` (router này KHÔNG tự thêm
locale; chỉ router của `@/i18n/navigation` mới thêm). Kết quả là người đang đọc `/en/...` bị
đá về đường không có locale và rơi ngược về `vi`.

Quét toàn `src/` ở HEAD: **13 điểm, 6 file**.

| File (HEAD) | Điểm | Cái gì bị đẩy |
| --- | --- | --- |
| `navbar/Navbar/AccountMenuDropdown/AccountMenuAuthed/index.tsx` | `:121 :135 :150 :159 :169` | 5 hàng menu (Bảng điều khiển, Khoá tôi dạy, Hồ sơ, Cài đặt, Ví) |
| `navbar/Navbar/AccountMenuDropdown/GamificationStatsRow/index.tsx` | `:65 :71 :77` | 3 chip gamification (tiến độ ×2, bảng xếp hạng) |
| `wallet/EarnGuideModal/index.tsx` | `:92 :96` | "Xem nhiệm vụ", "Xem học liệu" |
| `legal/LegalPage/index.tsx` | `:234` | breadcrumb "Trang chủ" |
| `learn/CourseQa/index.tsx` | `:151` | Hỏi–Đáp nhúng → trang nội dung |
| `layouts/admin/AdminMpegDashTest/Header/index.tsx` | `:20` | nút quay lại `/admin` |

Và một tầng thứ hai, nặng hơn vì nó im hoàn toàn: **cookie `LOCALE` chưa bao giờ ghi được ở
bất kỳ host nào.** `src/i18n/routing.ts` ở HEAD ghim `domain: ".academy.starci.org"` (`:23`)
— di sản của bộ khung StarCi mà app này được tách ra; FTES không chạy trên host đó, mà trình
duyệt thì **vứt thẳng** mọi `Set-Cookie` có `Domain` không phủ host đang truy cập. Cặp
`secure: true` (`:19`) + `sameSite: "none"` (`:21`) là đúng lỗi đó ở dạng thứ hai: `none` bắt
buộc phải kèm `Secure`, còn cookie `Secure` thì bị bỏ qua trên `http://localhost`. Chuyển
ngôn ngữ trông như chạy chỉ vì tiền tố URL mang locale; lựa chọn ấy **chưa từng sống sót qua
một lần vào bằng đường không có locale**.

### Mục 3 — quest cộng đồng không cộng XP

Người dùng làm đúng theo bảng "cách kiếm XP", viết bình luận, và điểm không nhúc nhích.

Phần FE sửa được đúng một thứ, và nó là thứ thật: nhãn hướng dẫn **nói dối phạm vi**.
`guide.actions.commentCreated` viết trống là "Viết 1 bình luận", trong khi hai dòng đó bám
đúng hai `rule_key` `community.*` — bình luận blog (`blog.comment.created`) không có rule nào
và bình luận challenge không phát event. Người dùng đọc nhãn, bình luận nhầm chỗ, rồi kết
luận hệ thống hỏng.

Phần còn lại **nằm ngoài repo này** và đợt này KHÔNG sửa — xem mục "Không làm / còn treo".

## What Changes

### Cú bấm đầu tiên sau khi tải trang (mục 1)

- **`src/modules/auth/auth-ready.ts` (MỚI)** — tín hiệu một-lần "phiên đã ngã ngũ chưa",
  không dính React/redux: `isAuthReady()` thăm dò ĐỒNG BỘ, `authReady()` trả promise settle,
  `markAuthReady()` idempotent. Tách hẳn câu hỏi *"đã biết chưa"* khỏi câu trả lời *"là ai"* —
  nơi gọi chờ xong thì ĐỌC LẠI store, trạng thái auth không nằm trong module này.
- **`useRequireAuth`** — thêm `requireAuthAsync` (chờ rồi mới kết luận, cho nơi gọi vốn đã
  `async`); `guard` giữ **đường đồng bộ** khi `isAuthReady()` đã `true` (99.9% cú bấm) và chỉ
  rơi sang đường chờ trong cửa sổ hydration, nên chuỗi cử chỉ trình duyệt (`preventDefault`,
  mở tab, focus) không bị mất. `requireAuth` đọc `store.getState()` thay vì biến closure —
  closure đã cũ ngay sau `await`. Dedupe cú bấm trùng bám **tham chiếu `action`**, không bám
  hook instance: hai CTA khác nhau lấy `guard` từ cùng một hook không được chặn nhau.
- **`useQueryUserSwr`** — bọc fetcher trong `try/finally` để `markAuthReady()` chạy ở CẢ ba
  đường ra (khách không token / `me` không trả user / lỗi mạng), và bật
  `setInitialized(true)` khi `authReady()` settle (`:172`, `:186`). Đây là lần đầu tiên cờ
  `keycloak.initialized` được dispatch trong lịch sử repo.
- **`src/redux/hooks.ts`** — thêm `useAppStore` (typed `useStore`) để callback đọc được state
  TƯƠI sau `await`; đi qua `<Provider>` chứ không import singleton `store`, để test vẫn tiêm
  được store riêng.
- **`AccountMenuDropdown`** — bỏ heuristic `isLoading && !user`, đọc thẳng `initialized`
  (`:47`, `:55`). Cờ này giờ bật ở cả nhánh có user, nhánh khách và nhánh lỗi, lại có net
  timeout đứng sau, nên không skeleton vĩnh viễn được.
- **`HomeLanding`** — không đổi logic, nhưng nhánh `signedIn` (`:58-64`) từ code chết thành
  code CHẠY. Docblock được sửa cho đúng sự thật, kèm cảnh báo: redirect chạy SAU lần vẽ đầu
  (không có tín hiệu phiên nào đọc được trước paint), nên người đã đăng nhập vào `/` sẽ thấy
  landing chớp một nhịp.
- **33 nơi gọi** đổi chốt-trước-mutation từ `requireAuth` sang `requireAuthAsync`/`guard`
  (community, group, subject, blog, resource, event, identity — xem `tasks.md` mục 1.7), và
  **16 file test** cập nhật mock `useRequireAuth` cho khớp hợp đồng mới.

### Rơi locale (mục 2)

- **`src/i18n/routing.ts`** — bỏ `domain` (cookie thành host-only, đúng trên MỌI host cùng
  lúc, không phải sửa lại theo từng môi trường), `sameSite: "lax"`, `secure` chỉ bật ở
  production. Kèm docblock ghi rõ **đừng ghim `domain` lại lần nữa** và vì sao.
- **6 file / 13 điểm** ở bảng trên: bốn file đổi sang router locale-aware của
  `@/i18n/navigation` (`AccountMenuAuthed`, `GamificationStatsRow`, `EarnGuideModal`,
  `AdminMpegDashTest/Header`) — `AccountMenuAuthed` đồng thời bỏ `useLocale()` vì đường
  đăng-xuất không còn phải tự ghép locale nữa. Hai file còn lại **giữ** `next/navigation` và
  tự đưa locale vào: `CourseQa` bắt buộc phải giữ (hai cú push khác trong file dựng từ
  `pathname`, vốn đã locale-full — đổi import là **double-prefix** `/vi/vi/...`), `LegalPage`
  chỉ có đúng một điểm nên truyền `locale` tường minh vào `pathConfig().locale(locale)` thay vì
  đổi cả import.
- Quét lại toàn `src/` sau khi vá: **0 điểm** còn lại. Ba chỗ duy nhất còn đẩy chuỗi tuyệt đối
  qua `next/navigation` (`NotificationCenter:143`, `ProfileOverviewTab:116`, `CourseQa:155`)
  đều nội suy `${locale}` một cách cố ý.
- **2 file test mới** (`AccountMenuAuthed/index.test.tsx`, `GamificationStatsRow/index.test.tsx`)
  khẳng định **router NÀO** nhận cú push, chứ không khẳng định chuỗi URL cuối: test nào mock
  `@/i18n/navigation` thì vĩnh viễn không nhìn thấy tiền tố locale (xem docblock
  `src/i18n/navigation.ts`), nên assert vào URL là assert khống. Thêm `src/i18n/routing.test.ts`
  khoá cấu hình cookie.

### Nhãn XP nói dối phạm vi (mục 3, phần FE làm được)

- **`src/messages/{vi,en}.json`** — `guide.actions.commentCreated`: "Viết 1 bình luận" →
  "Viết 1 bình luận **cộng đồng**" (en: "Write a **community** comment").
- **`guide-claims.test.ts`** — khoá hình dạng: `postCreated`/`commentCreated` phải nêu phạm vi
  cộng đồng ở CẢ hai catalog. Test cố ý KHÔNG khoá câu chữ, và cố ý không cho phép viết ngược
  lại ("chỉ bình luận cộng đồng mới có EXP") — bình luận học liệu (`resource.commented`) cũng
  trả 10 EXP thật; nói dối chiều nào cũng là nói dối.

## Không làm / còn treo

- **Quest cộng đồng (mục 3, phần chính) — KHÔNG sửa đợt này.** Đã rà hết đường ống
  community → Kafka → gamification và **không bịa thêm lỗi nào**: tên event khớp seed V221
  chính xác (`community.post.created` `PostService.java:213,:436`, `community.comment.created`
  `CommentService.java:163`, `community.reaction.added` `InteractionService.java:90`), envelope
  đủ 4 field bắt buộc, `occurredAt` ra ISO-8601 (không phải epoch) nhờ `JacksonConfig`, cùng
  một topic `ftes.activity.events` ở hai đầu, jar hợp đồng hai repo **giống nhau từng byte** ở
  cả 265 class, serializer ĐÚNG (`CommunityRpcConfig.java:187` inject
  `KafkaTemplate<String,String>` → `stringKafkaTemplate` ép `StringSerializer`, nên payload
  KHÔNG bị bọc thành chuỗi JSON), dedupe/DLQ không nuốt, và V221 vẫn là migration DUY NHẤT ghi
  `gamification.quests`.

  Chỉ còn **một** lỗi cấu hình đủ sức làm chết quest, và nó nằm trong repo:
  `CommunityOutboxRelay` (`FTES-AOS-Community/.../event/CommunityOutboxRelay.java:23`) đòi
  profile Spring `worker`, mà **không file nào trong cả 4 repo bật profile đó** cho service
  Community. Cổng thứ hai (`ftes.runtime.consumers-enabled`, dòng 34) mặc định TRUE
  (`application.yml:102`) nên không phân biệt được api/worker ⇒ `@Profile("worker")` là cổng
  duy nhất còn tác dụng — mà nó không được nhắc trong javadoc của chính class (dòng 25), không
  được nhắc trong commit tạo ra nó (`a150dc5`), không có `application-worker.yml`, không có
  trong Dockerfile, không có trong runbook, và bản tham chiếu được viện dẫn (Workspace) hoàn
  toàn không dùng `@Profile`. Container `svc-community-worker` có thật
  (`deploy-apitest.yml:31`, commit `1dbef79`) nhưng chỉ được định nghĩa trong
  `docker-compose.local.yml` — bị gitignore (`FTES-AOS-Backend/.gitignore:17`) — nên **repo
  không chứng minh được host có set profile hay không**.

  Nói thẳng: đây chắc chắn là lỗi thiết kế cấu hình (một cổng bắt buộc, câm, mâu thuẫn tài
  liệu, không kích hoạt được từ git). Còn "nó ĐANG chặn quest hay không" phải chốt bằng lệnh
  runtime — **xem `RUNBOOK-quest-community.md` trong chính thư mục này**, có đủ lệnh
  docker/psql/Kafka và cây quyết định "thấy X thì kết luận Y". Sửa mù ở FE không giải quyết
  được gì.
- **Chớp landing.** Người đã đăng nhập vào `/` vẫn thấy landing một nhịp trước khi sang
  `/dashboard`: không có tín hiệu phiên nào đọc được TRƯỚC paint (cờ edge `session_hint` chưa
  từng được set — đã ghi trong đợt trước). Hết chớp thì cần session hint đồng bộ ở tầng edge,
  không phải việc của bản vá này.
- **Trần chờ 8 giây là con số CỨNG**, chọn theo cảm tính chứ không đo
  (`auth-ready.ts:33`). Nó chỉ tồn tại để không CTA nào treo vĩnh viễn khi backend chết; hết
  trần thì rơi về nhánh khách, tức người đang đăng nhập gặp mạng cực chậm vẫn có thể thấy
  modal sai. Đường nâng cấp: treo vào `AbortSignal`/timeout thật của tầng transport và cho CTA
  một trạng thái "đang xác thực phiên".
- **Dedupe bám tham chiếu `action`** nên một lần re-render xen giữa hai cú bấm sẽ đổi tham
  chiếu và cú bấm thứ hai lọt. Chấp nhận: đúng bằng mức bảo vệ của đường đồng bộ hôm nay
  (không dedupe gì cả), tức không tệ hơn trạng thái ổn định.
- **`requireAuth` (đồng bộ) vẫn kết luận "khách" trong cửa sổ hydration** — đó là HỢP ĐỒNG của
  nó, không phải bug còn sót: nó chỉ dành cho nút nhãn "Đăng nhập để …" và cho predicate đồng
  bộ không await được. Mọi chốt TRƯỚC mutation đã chuyển sang `requireAuthAsync`/`guard`.
- **`@Profile("worker")` ở repo Community** và mọi thay đổi BE khác: ngoài phạm vi repo FE.

## Capabilities

Không thêm capability mới. Đây là đợt sửa lỗi trên các bề mặt đã có.
