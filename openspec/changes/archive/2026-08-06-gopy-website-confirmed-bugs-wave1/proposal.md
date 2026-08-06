# gopy-website-confirmed-bugs-wave1 — 4 lỗi đã nghiệm thu E2E từ file "Góp ý website"

## Why
File góp ý của đội (24 ảnh + 24 nhận xét, 2026-07-26) được đối chiếu bằng E2E thật
(FE local :3000 → BE apitest, tài khoản student/ctv/instructor). 4 lỗi tái hiện được và
đã truy ra nguyên nhân — đây là nhóm chặn người học, sửa trước:

1. `/leaderboard` **chết trắng trang**: `Typography` (react-aria `Text`) render TRỰC TIẾP
   trong `TextField` của `GoalsCard` → RAC `TextContext` bắt buộc `slot` → throw
   `A slot prop is required. Valid slot names are "description" and "errorMessage"`.
2. **Pager Bài trước/Bài sau reload cả trang + mất tiếng Việt**: `blocks/cards/PressableCard`
   render `<a href>` thuần (không phải next-intl `Link`), còn `readerHref` trả path
   KHÔNG có prefix locale → điều hướng cứng → middleware đá về locale mặc định (en).
3. **Bình chọn "bị lỗi"**: BE trả `400 COMMUNITY_POLL_CLOSED` khi poll hết hạn, FE không có
   trạng thái "đã đóng" → user bấm thì im lặng/toast lỗi chung.
4. **Học thử không học được**: bài badge "Học thử" gọi `/lessons/{id}/documents` → `403
   COURSE_ACCESS_DENIED` → app đá ngược về dashboard khóa (lỗi gốc ở BE, xử lý riêng).

## What Changes
- **GoalsCard**: nhãn trong `TextField` dùng `Label` (primitive của hệ) thay `Typography`;
  bỏ `aria-label` trùng trên `Input` (Label đã cấp tên).
- **PressableCard (blocks/cards)**: `href` render bằng **next-intl `Link`** thay `<a>` thuần
  → client-side nav, giữ locale.
- **LessonReader**: `readerHref` giữ nguyên (locale do `Link` của next-intl tự prefix); pager
  không còn full reload.
- **CommunityPoll**: đọc `closedAt`/`isClosed` từ `GET /community/posts/{id}/poll`; poll đã
  đóng → khoá tương tác + hiện kết quả + nhãn "Bình chọn đã đóng"; lỗi
  `COMMUNITY_POLL_CLOSED` khi vote → revalidate + toast đúng thông điệp.
- i18n `community.poll.closed` (vi/en).

## Out of scope
- Lỗi 403 học thử: nằm ở BE (`FTES-AOS-Backend`) — sửa ở repo đó, không đụng FE.
- Nhóm góp ý thiên về thiết kế (icon, slider mentor, footer, .webp, đếm ngược thanh toán…).
