## Context

Đường đọc sự kiện của FE đã đủ: `getEvents()` gọi alias công khai `GET /api/v1/events`,
`getEventDetail(slug)` gọi `GET /api/v1/event/events/{slug}`, `registerEvent(id)` gọi
`POST /api/v1/event/events/{id}/registrations`. Chain bảo mật riêng của module event permitAll cho
GET list/detail nên khách chưa đăng nhập vẫn đọc được; `EventService.getVisibleBySlug()` chặn mọi
status chưa publish với người ngoài, nên link Meet chỉ lộ sau khi sự kiện được publish.

Cái thiếu nằm ở lớp trên: không có route `[slug]`, CTA đăng ký để trống, cộng đồng không có lối vào,
và `EventView` chưa mang `venue`.

Vài chi tiết đọc từ file thật, quyết định cách làm bên dưới:

- `restRequest` mặc định `authenticated: true` (`client.ts:173`) nhưng chỉ gắn header khi *có* token
  → khách vãng lai gọi `getEventDetail` vẫn ra request hợp lệ, BE permitAll trả 200. Không cần thêm
  `authenticated: false` (và cũng không nên: người đã đăng nhập cần token để BE điền
  `myRegistrationStatus`).
- `DiscoveryRail` hiện chỉ còn **một** `RailPanel` (Bình chọn) + `CommunityLiveChatRail`. Hai panel
  "Xu hướng"/"Bảng uy tín" mà spec `community-side-rails` (đã archive) mô tả không còn trong code —
  đó là lý do `communityHub.rail.trending` và `rail.reputation` thành khoá chết.
- `usePostRegisterEventSwr` (lớp bọc REST thuần của `rest-fetch-event`) đã tồn tại nhưng không
  auth-gate, không revalidate cache nào.

## Goals / Non-Goals

**Goals:**
- Bấm một sự kiện ở bất kỳ đâu cũng ra trang chi tiết render thật, không 404.
- Người xem sự kiện online đã publish thấy được link tham dự, kể cả khi chưa đăng nhập.
- Đăng ký được từ card catalog và từ trang chi tiết; F5 vẫn giữ trạng thái (server là nguồn thật).
- Vào `/community` là biết sắp có sự kiện gì (desktop) và có đường sang `/events` (mọi kích thước).
- Mọi mốc giờ sự kiện hiển thị cùng một múi giờ ở cả ba bề mặt.

**Non-Goals:**
- Không làm lưới lịch tháng/tuần (chốt §7 của SPEC).
- Không làm huỷ đăng ký ở v1 — `cancelEventRegistration` đã có trong REST client nhưng không bề mặt
  nào gọi; thêm nút huỷ kéo theo xác nhận + xử lý waitlist promote, để change sau.
- Không làm QR check-in, chứng nhận, sự kiện lặp lại, xuất `.ics`, upload ảnh cover.
- Không làm tab "Sự kiện" trong tab strip cộng đồng (phương án B đã bị cắt).
- Không đụng `group_events` và tab sự kiện của nhóm.
- Không thêm `generateMetadata`/OG cho trang chi tiết ở v1 (xem Open Questions).

## Decisions

### 1. Trang chi tiết = route server mỏng + component client, KHÔNG SSR fetch như blog
`/blog/[slug]` fetch ở server để có metadata. Sự kiện thì khác: `myRegistrationStatus` phụ thuộc
token của người xem, mà token nằm ở local storage phía client — fetch trên server sẽ luôn trả về
trạng thái của khách vãng lai và render sai CTA. Nên `page.tsx` chỉ đọc `slug` từ params rồi render
`<EventDetail slug={slug} />` (client), dữ liệu về qua SWR.

*Đánh đổi:* mất SEO/OG cho trang sự kiện — đúng thứ người ta hay dán link. Ghi ở Open Questions.

### 2. Một helper duy nhất giữ múi giờ: `Asia/Ho_Chi_Minh`
`dayjs.extend(timezone)` (kèm `utc` đã có sẵn) + `features/event/eventTime.ts` xuất hai hàm:
`formatEventDateTime(iso, locale)` và `formatEventDayLabel(iso, locale)`. Cả ba bề mặt (catalog,
rail, chi tiết) gọi cùng hàm này.

Sự kiện của FTES diễn ra ở Việt Nam, "19:00" trên poster là 19:00 giờ VN. Hiển thị theo giờ máy
người xem nghĩa là một người mở máy còn để múi giờ khác (hoặc du học sinh) sẽ thấy một con số khác
với thông báo và với admin — không có cách nào biết ai đúng. Chốt giờ VN + hậu tố "giờ VN" ở trang
chi tiết để người ở múi giờ khác tự quy đổi.

*Kèm theo:* `useQueryEventsSwr` hiện format bằng `Intl.DateTimeFormat("vi-VN")` dựng ở module scope
(luôn tiếng Việt, luôn giờ máy) → chuyển sang helper chung. Đây là phần **thêm** so với mục 3.7 của
SPEC, lý do: nếu chỉ sửa hook mới thì catalog và chi tiết hiện hai giờ khác nhau cho cùng một sự
kiện với người xem ngoài VN — mâu thuẫn nhìn thấy được.

### 3. Hook rail nằm ở `community/hooks`, lọc/sắp/cắt ở client
Theo đúng mục 3.3 của SPEC: `useQueryUpcomingEventsSwr` đặt cạnh các hook cộng đồng khác, khuôn
`useQueryGroupEventsSwr` (locale nằm trong SWR key vì hàng mang nhãn ngày đã format theo locale),
**không** theo `useQueryEventsSwr`.

`GET /api/v1/events` không có tham số lọc/phân trang, nên lọc `startAt > now` +
`status ∈ {PUBLISHED, ONGOING}` → sort tăng dần → `slice(0, 3)` chạy ở client. Với vài chục sự kiện
thì payload không đáng kể; khi danh sách phình to thì việc phải làm là thêm tham số cho BE, không
phải cache thêm ở FE.

Hook import helper giờ từ `features/event/eventTime` (cross-feature). Chấp nhận: helper thuộc miền
sự kiện, đặt bản sao thứ hai trong community mới là sai.

### 4. Card ở rail chỉ DẪN ĐƯỜNG — không có nút Đăng ký
Phác thảo trong SPEC §3 vẽ `[Đăng ký]` trên dòng sự kiện gần nhất. Bỏ nút đó: panel rộng ~280px,
thêm CTA là kéo theo auth-gate, trạng thái pending, toast, và ô hết chỗ/waitlist — toàn bộ vòng
trạng thái nhân bản lần thứ ba. Cả dòng là link sang chi tiết, nơi CTA đã có đầy đủ ngữ cảnh
(số chỗ, thời gian, mô tả).

*Thay thế đã cân nhắc:* giữ nút cho đúng phác thảo — nhanh hơn một cú click, nhưng người dùng đăng
ký một sự kiện mà chưa đọc gì về nó cũng không phải điều đáng tối ưu.

### 5. Đăng ký: hook feature auth-gate, không gọi thẳng lớp bọc REST
`useMutateRegisterEventSwr` (mới, `features/event/hooks/`) theo khuôn `useMutatePollVoteSwr`:
`requireAuth("auth.context.registerEvent")` → khách nhận `AuthenticationModal` chứ không nhận 401 →
gọi `registerEvent(id)` → revalidate cả key catalog (`["events"]`) lẫn key chi tiết để `seatsLeft`
và `myRegistrationStatus` về từ server.

`usePostRegisterEventSwr` giữ nguyên (thuộc `rest-fetch-event`, là lớp bọc 1-1 với REST); nó không
auth-gate và không revalidate nên không dùng trực tiếp ở hai bề mặt này. Không xoá.

*Nguyên tắc:* trạng thái sau đăng ký lấy từ server, không optimistic. Đăng ký có thể rơi vào waitlist
tuỳ sức chứa — đoán trước ở client là bịa.

### 6. Link Meet: chỉ render thành link khi `venue` thật sự là URL
`venue` là cột đa nghĩa theo quy ước hiện hành: `locationType = ONLINE` → link họp; `ONSITE` → địa
chỉ. Trang chi tiết: `venue` bắt đầu bằng `http://`/`https://` → render `<a target="_blank"
rel="noopener noreferrer">` nhãn "Vào phòng họp"; ngược lại render thành chữ. Không suy diễn từ
`locationType` vì HYBRID có thể mang một trong hai, và admin có thể gõ địa chỉ vào sự kiện online.

`venue` là optional ở FE type — BE chưa deploy phần mở trường này thì hàng "Nơi diễn ra" chỉ hiện
nhãn hình thức, không hiện gì thêm. Không vỡ.

### 7. Trạng thái đăng ký đọc theo kiểu chịu được giá trị lạ
`myRegistrationStatus` là chuỗi tự do trong DTO FE, và repo FE **không** có chỗ nào liệt kê tập giá
trị của nó. Xử lý: rỗng/null/`CANCELLED` → coi như chưa đăng ký (CTA "Đăng ký"); chuỗi chứa
`WAITLIST` → nhãn "Trong danh sách chờ"; còn lại → "Đã đăng ký". Giá trị lạ rơi vào nhánh "đã đăng
ký" thay vì làm vỡ trang.

## Risks / Trade-offs

- **[BE chưa trả `venue`]** → trang chi tiết publish trước BE thì mất đúng phần link Meet — thứ đắt
  giá nhất của đợt này. Field optional nên không vỡ; nghiệm thu phải chạy sau khi
  `event-write-path-repair` lên apitest.
- **[Rail tắt hoàn toàn dưới 1280px]** → điện thoại/tablet chỉ còn mục "Sự kiện" trong ⋯ menu. Đây là
  đánh đổi đã biết của phương án A, mục C sinh ra để bù.
- **[Giờ VN cứng]** → người xem ở múi giờ khác thấy giờ khác đồng hồ của họ. Bù bằng hậu tố "giờ VN"
  ở trang chi tiết; card rail không đủ chỗ cho hậu tố, chấp nhận.
- **[Link Meet công khai]** → sức chứa/waitlist/điểm danh chỉ còn là số liệu tham khảo, không chặn
  được ai vào phòng họp. Anh đã chốt đánh đổi này; chỗ siết lại sau là `toView()` bên BE, không phải
  FE.
- **[`getEvents()` không phân trang]** → rail tải cả danh sách để lấy 3 dòng. Ghi nợ, không tối ưu sớm.
- **[Không có huỷ đăng ký]** → ai bấm nhầm phải nhờ admin. Chấp nhận ở v1, ghi vào Non-Goals.

## Open Questions

- Trang chi tiết có cần `generateMetadata`/OG không? Link sự kiện là thứ hay được dán vào chat/nhóm.
  Nếu cần thì thêm một `cache()`-fetch server song song với fetch client (chỉ để lấy title/description),
  chi phí một round-trip mỗi request.
- Tập giá trị thật của `myRegistrationStatus` là gì? Cần một lần đọc BE hoặc một lần curl để chốt,
  trước khi nghiệm thu nhãn "danh sách chờ".
- Có thêm "Sự kiện của tôi" (từ `getMyEventRegistrations`) không? Ngoài phạm vi đợt này.
