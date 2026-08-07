# Sự kiện lộ ra ở cộng đồng + trang chi tiết `/events/[slug]` (community upcoming events)

## Why

Hệ sự kiện đã có gần đủ ở mọi tầng — BE có module `event` hoàn chỉnh (đăng ký, waitlist, QR check-in,
chứng nhận), Admin có form tạo sự kiện — nhưng **người học gần như không chạm được vào nó**:

1. **Bấm vào một sự kiện là 404.** `EventCatalog` link sang `/events/${event.id}` (id = slug), mà
   `src/app/[locale]/events/` chỉ có `page.tsx`, không có thư mục `[slug]/`.
2. **Nút "Đăng ký" không nối dây.** `EventCatalog/index.tsx:197` — `onPress={() => {}}` kèm ghi chú
   "the list rewire leaves the CTA unwired for now". REST `registerEvent` đã có sẵn từ lâu.
3. **Cộng đồng không có một dòng nào về sự kiện.** Grep `event` trong `features/community` +
   `app/[locale]/community` chỉ còn `fireEvent` trong test và `event.key === "Enter"`. Không card,
   không mục menu — ai vào `/community` cũng không biết tuần này có hội thảo gì.
4. **Link phòng họp không đọc được.** `EventView` (FE lẫn BE) không có trường `venue`, nên dù admin
   lưu đúng link Meet thì FE cũng không bao giờ thấy.
5. **Giờ sự kiện hiển thị theo múi giờ máy người xem.** `src/modules/dayjs` mới `extend(utc)` +
   `extend(duration)`, chưa có `timezone`; `useQueryEventsSwr` thì hard-code `Intl.DateTimeFormat("vi-VN")`
   ở module scope (đúng ngôn ngữ, sai múi giờ nếu người xem ở nước ngoài).

Chốt thiết kế (SPEC lịch sự kiện cộng đồng, 2026-08-07): **A + C** — card "Sự kiện sắp tới" ở rail
phải + mục "Sự kiện" trong NavRail/⋯ menu; **danh sách gom theo ngày**, không lưới lịch tháng; **link
Meet công khai** cho mọi người xem sự kiện đã publish.

## What Changes

- **Trang chi tiết `/events/[slug]`** (mới): thời gian, nơi diễn ra (link Meet mở tab mới khi
  online), số chỗ còn lại, mô tả, và CTA đăng ký có trạng thái thật.
- **Nút "Đăng ký" ở `EventCatalog` nối vào REST thật** (`POST /event/events/{id}/registrations`),
  auth-gate cho khách bằng `AuthenticationModal` như mọi CTA khác của hệ.
- **Card "Sự kiện sắp tới" ở `DiscoveryRail`** (giữa panel Bình chọn và Live chat): 3 sự kiện gần
  nhất, mỗi dòng = icon loại + tiêu đề + `ngày · giờ · hình thức`, kèm link "Xem tất cả" → `/events`.
- **Mục "Sự kiện" trong `MENU_ITEMS` + `NavRail`** → có mặt ở cả rail trái (xl+) lẫn dropdown ⋯
  (dưới xl), trỏ sang `/events`.
- **Hook `useQueryUpcomingEventsSwr`** (mới): bọc `getEvents()`, lọc `startAt > now` +
  `status ∈ {PUBLISHED, ONGOING}`, sắp tăng dần, lấy 3 — locale nằm trong SWR key.
- **Múi giờ**: `dayjs.extend(timezone)` + một helper duy nhất định dạng mọi mốc giờ sự kiện theo giờ
  Việt Nam (`Asia/Ho_Chi_Minh`), dùng chung cho catalog · rail · trang chi tiết.
- **`EventView` (FE) thêm `venue?`** cho khớp DTO BE sau khi mở trường này.
- **i18n vi + en**: `communityHub.{menu,rail}.events`, `eventSystem.detail.*`, `eventSystem.dayLabels.*`,
  `auth.context.registerEvent`; xoá 2 khoá chết `communityHub.rail.{trending,reputation}`.

## Capabilities

### New Capabilities
- `event-detail`: trang chi tiết một sự kiện tại `/events/[slug]` — logistics, link tham dự, đăng ký.

### Modified Capabilities
- `event-catalog`: nút "Đăng ký" trên card chạy thật thay vì no-op.
- `community-side-rails`: rail phải có panel "Sự kiện sắp tới"; NavRail/⋯ menu có lối vào `/events`.
- `rest-fetch-event`: `EventView` mang thêm `venue`.

## Impact

- **Mới**: `src/app/[locale]/events/[slug]/page.tsx`, `features/event/EventDetail/`,
  `features/event/eventTime.ts`, `features/event/hooks/useMutateRegisterEventSwr.ts`,
  `features/community/hooks/useQueryUpcomingEventsSwr.ts`.
- **Sửa**: `EventCatalog/index.tsx`, `features/event/hooks/useQueryEventsSwr.ts`,
  `CommunityShell/{index,DiscoveryRail,NavRail}.tsx`, `modules/dayjs/index.ts`,
  `modules/api/rest/event/types.ts`, `src/messages/{vi,en}.json`.
- **Phụ thuộc BE**: cần bản BE trả `venue` trong `EventView` công khai (change `event-write-path-repair`,
  giai đoạn 2). Chưa có thì hàng "Nơi diễn ra" tự ẩn — không chặn phần còn lại.
- **Không đụng**: `group_events` (tab sự kiện của từng nhóm) là hệ riêng, giữ nguyên.
