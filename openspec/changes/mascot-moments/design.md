# Design — mascot-moments

## Context
Nối tiếp `onboarding-mascot-guide` (linh vật + engine tour). Change này đưa linh vật ra ngoài
tour, xuất hiện đúng ngữ cảnh trên các surface có sẵn. Nguyên tắc tối cao: **chống nag** —
linh vật là gia vị, không phải tiếng ồn.

## Goals / Non-Goals
**Goals:** primitive moment tái sử dụng (celebration/nudge) với luật tần suất khoá bằng
localStorage; empty-state có linh vật thống nhất; celebration lên cấp; a11y + reduced-motion +
i18n. FE-only, không đụng BE.
**Non-Goals:** moment do BE đẩy realtime (badge/streak socket) — tái dùng primitive khi diff đó
land; A/B tần suất; cá nhân hoá copy theo hành vi.

## Decisions

### 1. Luật chống nag (STRICT — áp cho MỌI moment)
- **1 linh vật/trang.** Empty-state và celebration/nudge trên cùng một trang phải loại trừ
  nhau (vd QuestBoard: `allClaimed` celebration và empty-state là hai nhánh loại trừ).
- **Dismissible.** Celebration + nudge luôn có nút `×` đóng.
- **KHÔNG đè tour.** Celebration + nudge ẩn khi `useTour().isActive` (một linh vật đang dẫn
  tour thì không có linh vật thứ hai). Celebration bị hoãn vì tour **không đốt** lượt trong
  ngày → hiện lại khi tour xong.
- **Tần suất khoá bằng localStorage** (xem §3), không nag mỗi lần mount.
- **Reduced-motion** tắt nhún; copy nằm trong bong bóng `aria-live`; linh vật `aria-hidden`.

### 2. Hai primitive moment
- `MascotCelebration({ id, title, body })` — banner `bg-success/5` + `MascotBubble` pose
  `cheer`. Hiện tối đa 1 lần/ngày/thiết bị (day-stamp). SSR-safe: render null tới khi effect
  client quyết định.
- `MascotProfileNudge()` — `MascotBubble` pose `point`, CTA "hoàn thiện hồ sơ" + dismiss. Chỉ
  hiện khi: đã đăng nhập, hồ sơ sơ sài (thiếu avatar / bio / tên hiển thị riêng), chưa dismiss,
  không đang tour. Dismiss vĩnh viễn/thiết bị.

### 3. Persistence (`ftes.mascot.*`)
- `celebration.<id>` = `YYYY-MM-DD` (device-local) → so với hôm nay để khoá 1 lần/ngày.
- `nudge.<id>` = `"1"` khi đã dismiss → khoá vĩnh viễn/thiết bị.
- Mọi truy cập bọc try/catch: SSR (không `window`) / private mode → đọc là "chưa hiện / chưa
  dismiss", không crash.

### 4. Danh mục moment (surface · file cắm · pose · trigger · copy key · frequency)

| Surface | File cắm | Pose | Trigger | Copy key | Frequency |
|---|---|---|---|---|---|
| Lên cấp (modal) | `gamification/GamificationEventHost/index.tsx` | `cheer` | `useLevelUpMoment()` bắn level | `gamification.moment.levelUpTitle/Body` | mỗi lần lên cấp |
| Nhiệm vụ ngày đã dọn sạch | `gamification/QuestBoard/index.tsx` (`MascotCelebration`) | `cheer` | mọi quest đạt giới hạn ngày | `gamification.celebrateAllClaimedTitle/Body` | 1 lần/ngày/thiết bị |
| Hoàn thiện hồ sơ | `course/MyCourses/index.tsx` (`MascotProfileNudge`) | `point` | hồ sơ sơ sài + đã đăng nhập + không tour | `mascot.nudge.completeProfile.title/body/cta/dismiss` | 1 lần/thiết bị (dismiss) |
| Bảng nhiệm vụ trống | `gamification/QuestBoard/index.tsx` | `explain` | không có quest | `gamification.empty` | empty-state |
| Bảng nhiệm vụ — gate khách | `gamification/QuestBoard/index.tsx` | `greeting` | chưa đăng nhập | (sign-in gate) | empty-state |
| "Khoá học của tôi" trống | `course/MyCourses/index.tsx` | `explain` | không có enrollment | `courses.mine.empty/emptyHint` | empty-state |
| Giỏ hàng trống | `cart/CartShell/index.tsx` | `explain` | giỏ trống | `cart.empty/emptyHint/emptyBrowse` | empty-state |
| Feed cộng đồng trống | `community/CommunityFeed/index.tsx` | `explain` | feed trống (thường thiếu campus) | `feed.empty/emptyHint/emptyCompose` | empty-state |
| Thư viện đã lưu — gate khách | `saved/SavedLibrary/index.tsx` | `greeting` | chưa đăng nhập | (sign-in gate) | empty-state |
| Thư viện đã lưu — tab trống | `saved/SavedLibrary/index.tsx` | `explain` | tab không có mục | `savedItems.empty.{tab}.title/hint/cta` | empty-state |
| Tìm kiếm không kết quả | `search/SearchResults/index.tsx` | `point` | 0 kết quả | `searchPage.empty` | mỗi truy vấn rỗng |

### 5. Empty-state có linh vật
- Dùng `FtesMascot` làm `icon` trong slot `emptyContent` của `AsyncContent` (không tự chế
  layout). Pose theo sắc thái: `greeting` (mời đăng nhập), `explain` (giải thích/mời hành
  động), `point` (không tìm thấy → thử khác). Linh vật `aria-hidden`; tiêu đề/mô tả mang
  nghĩa.

## Risks / Trade-offs
- **Nag** = rủi ro chính → chặn bằng §1 (1 linh vật/trang, dismissible, không đè tour, khoá
  tần suất). Nếu sau này thấy vẫn phiền: hạ tần suất hoặc thêm opt-out chung.
- **Đồng bộ đa thiết bị**: tần suất khoá ở localStorage nên lệch giữa thiết bị — chấp nhận ở
  giai đoạn FE-only (giống `onboarding-mascot-guide`).
- **Art placeholder**: linh vật dùng module art swappable của `onboarding-mascot-guide` — thay
  art thật một chỗ, mọi moment cập nhật theo.
</content>
