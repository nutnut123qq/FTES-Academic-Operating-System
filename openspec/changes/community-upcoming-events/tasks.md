# Tasks

## 1. Múi giờ + type

- [ ] 1.1 `src/modules/dayjs/index.ts`: `import timezone from "dayjs/plugin/timezone"` + `dayjs.extend(timezone)` (sau `utc` — plugin timezone phụ thuộc utc)
- [ ] 1.2 Tạo `src/components/features/event/eventTime.ts`: `EVENT_TIMEZONE = "Asia/Ho_Chi_Minh"`, `formatEventDateTime(iso, locale)` (ngày + giờ) và `formatEventDayLabel(iso, locale)` (Hôm nay / Ngày mai / `ddd, DD/MM`, dùng khoá `eventSystem.dayLabels.*` cho hai nhãn đầu); ISO hỏng → trả `null`
- [ ] 1.3 `src/modules/api/rest/event/types.ts`: `EventView` thêm `venue?: string` (optional — BE chỉ trả sau change `event-write-path-repair`)
- [ ] 1.4 `useQueryEventsSwr.ts`: bỏ `Intl.DateTimeFormat("vi-VN")` dựng ở module scope, dùng `formatEventDateTime`; hook nhận locale từ `useLocale()` và đưa locale vào SWR key

## 2. Hook sự kiện sắp tới

- [ ] 2.1 Tạo `src/components/features/community/hooks/useQueryUpcomingEventsSwr.ts` theo khuôn `useQueryGroupEventsSwr` (locale trong SWR key), bọc `getEvents()`
- [ ] 2.2 Lọc `startAt > now` + `status ∈ {PUBLISHED, ONGOING}` (so sánh chữ HOA), sort `startAt` tăng dần, `slice(0, 3)`
- [ ] 2.3 Map ra hàng gọn: `{ slug, title, type, dayLabel, timeLabel, locationType }` — không mang field mà card không dùng
- [ ] 2.4 Tạo `src/components/features/event/hooks/useMutateRegisterEventSwr.ts` theo khuôn `useMutatePollVoteSwr`: `requireAuth("auth.context.registerEvent")` → `registerEvent(id)` → revalidate key catalog + key chi tiết; trả `false` cho khách

## 3. Trang chi tiết `/events/[slug]`

- [ ] 3.1 Tạo `src/app/[locale]/events/[slug]/page.tsx`: server component mỏng, đọc `slug` từ `params`, render `<EventDetail slug={slug} />`
- [ ] 3.2 Tạo `src/components/features/event/EventDetail/index.tsx` (client) + hook `useQueryEventDetailSwr(slug)` bọc `getEventDetail`; `AsyncContent` cho loading/error/không tìm thấy, có nút quay lại `/events`
- [ ] 3.3 Thân trang: icon loại + tiêu đề + chip loại + chip trạng thái; hàng "Thời gian" (`startAt`–`endAt`, hậu tố giờ VN); hàng "Nơi diễn ra" (nhãn hình thức + `venue`); số chỗ còn lại khi `seatsLeft != null`; mô tả
- [ ] 3.4 `venue` khớp `^https?://` → link "Vào phòng họp" (`target="_blank" rel="noopener noreferrer"`); ngược lại render chữ; `venue` rỗng/thiếu → ẩn cả hàng phụ, chỉ giữ nhãn hình thức
- [ ] 3.5 CTA đăng ký: chưa đăng ký → "Đăng ký" (gọi hook 2.4); `myRegistrationStatus` chứa `WAITLIST` → chip "Trong danh sách chờ"; có giá trị khác (≠ `CANCELLED`) → chip "Đã đăng ký"; `status ∈ {ENDED, CANCELLED}` → CTA disabled kèm lý do
- [ ] 3.6 Đăng ký xong revalidate rồi mới đổi nhãn (không optimistic); lỗi → toast, giữ nguyên trạng thái cũ
- [ ] 3.7 Skeleton mirror đúng bố cục thật (theo lối `EventCardSkeleton` đang có)

## 4. Nút Đăng ký ở catalog

- [ ] 4.1 `EventCatalog/index.tsx`: `EventCard` gọi `useMutateRegisterEventSwr`, bỏ `onPress={() => {}}` và ghi chú "leaves the CTA unwired"
- [ ] 4.2 Nút hiện trạng thái pending khi đang gửi; thành công → toast + nhãn "Đã đăng ký" (từ dữ liệu server sau revalidate); lỗi → toast
- [ ] 4.3 Khách chưa đăng nhập → `AuthenticationModal` mở với ngữ cảnh `auth.context.registerEvent`, KHÔNG gọi REST

## 5. Cộng đồng: card rail + lối vào

- [ ] 5.1 `CommunityShell/DiscoveryRail.tsx`: thêm `RailPanel` "Sự kiện sắp tới" **giữa** panel Bình chọn và `CommunityLiveChatRail`, `seeAllHref="/events"` + `seeAllLabel={t("rail.seeAll")}`
- [ ] 5.2 Mỗi dòng = icon theo loại + tiêu đề (truncate) + meta `dayLabel · timeLabel · nhãn hình thức`, cả dòng là `Link` sang `/events/{slug}`; danh sách rỗng → dòng trống nhẹ (`rail.eventsEmpty`), không render panel rỗng trơ
- [ ] 5.3 `CommunityShell/index.tsx`: thêm `{ key: "events", href: "/events" }` vào `MENU_ITEMS`
- [ ] 5.4 `CommunityShell/NavRail.tsx`: thêm hàng "Sự kiện" (`CalendarIcon` của phosphor) trỏ `/events`, cùng `ROW_CLASS` với các hàng khác

## 6. i18n (vi + en)

- [ ] 6.1 `communityHub.menu.events` + `communityHub.rail.events` + `communityHub.rail.eventsEmpty`
- [ ] 6.2 Xoá khoá chết `communityHub.rail.trending` và `communityHub.rail.reputation` (không component nào dùng — hai panel tương ứng đã bị gỡ khỏi `DiscoveryRail`)
- [ ] 6.3 `eventSystem.dayLabels.{today,tomorrow}`
- [ ] 6.4 `eventSystem.detail.*`: `when`, `where`, `about`, `joinLink`, `timezoneNote`, `seatsLeft`, `full`, `registered`, `waitlisted`, `registerSuccess`, `registerFailed`, `notFound`, `backToCatalog`, `loadError`, `ended`
- [ ] 6.5 `eventSystem.statuses.{published,ongoing,ended,cancelled}`
- [ ] 6.6 `auth.context.registerEvent` trong cả hai catalog
- [ ] 6.7 Sửa đúng **cả hai** file `src/messages/vi.json` và `en.json` — `messages.icu.test.ts` bắt buộc mọi message parse được ICU và hai catalog cùng hình dạng

## 7. Verify

- [ ] 7.1 `npx tsc --noEmit` sạch
- [ ] 7.2 `npm run lint` sạch ở vùng đã sửa
- [ ] 7.3 Unit test `useQueryUpcomingEventsSwr`: bỏ sự kiện đã qua, bỏ status khác `PUBLISHED|ONGOING`, sắp tăng dần, cắt đúng 3; và test `formatEventDayLabel` cho hôm nay / ngày mai / ngày khác
- [ ] 7.4 `npm run build` (webpack) xanh
- [ ] 7.5 E2E trình duyệt trên apitest: `/vi/community` ở ≥1280px hiện card "Sự kiện sắp tới" đúng sự kiện vừa tạo → bấm sang `/vi/events/{slug}` render (không 404) → thấy link Meet khi đăng xuất → đăng nhập bấm "Đăng ký" đổi trạng thái thật, F5 vẫn giữ
- [ ] 7.6 Dưới 1280px: mục "Sự kiện" có trong dropdown ⋯ và trỏ đúng `/events`
- [ ] 7.7 `openspec validate community-upcoming-events --strict`
