# Tasks — onboarding-mascot-guide

> FE-only slice. Items marked **[deferred]** are intentionally out of scope for this
> change (see proposal Non-Goals) and are NOT part of the delta spec — they are kept
> here as a forward-looking backlog, not as unmet requirements of this change.

## 1. Asset & component linh vật
- [x] 1.1 Art tư thế linh vật qua **1 module art swappable** (`FtesMascot/art.tsx`, pose→node) — placeholder SVG/emoji, TODO thả asset thật; KHÔNG hardcode art rải rác. (Non-goal: tách 4 file `.webp` từ ảnh nguồn — làm khi có art thật.)
- [x] 1.2 `FtesMascot` (pose/size/animated, `aria-hidden`, nhún idle tắt khi reduced-motion)
- [x] 1.3 i18n `mascot.name` (vi/en)

## 2. Tour engine
- [x] 2.1 Kiểu `Tour`/`TourStep` (declarative); suy pose/layout từ `intent`
- [x] 2.2 `SpotlightOverlay` (portal, dim + khoét lỗ theo bounding-rect target + padding/bo góc, `scrollIntoView`, reposition khi resize/scroll) — [deferred] `allowInteract` click-through
- [x] 2.3 `MascotCoachMark` (bong bóng auto-flip, mascot + tiêu đề + thân + tiến độ n/N + Trước/Tiếp/Bỏ qua + **confirm bỏ qua**)
- [x] 2.4 `TourProvider` (`isActive` + `startTour`); 1 tour/lúc (start thay thế tour đang chạy, không chồng overlay); target mất >~1.5s → skip step — [deferred] route mismatch → điều hướng trước

## 3. Trigger & lưu tiến độ
- [x] 3.1 first-visit auto-start: signed-in + done-flag chưa set → chạy welcome tour (in-memory session guard + localStorage done flag) — [deferred] đọc cờ `justRegistered` từ luồng auth
- [ ] 3.2 [deferred] first-visit:{surface}: registry tip khi surface mount
- [x] 3.3 Persistence localStorage **1 key device-wide** `ftes.tour.onboarding.done` (seen = completed|skipped) — [deferred] per-principal key / resume step / optOut

## 4. Nội dung tour + anchor
- [x] 4.1 Welcome tour: 4 module header → global search → account gateway (AI tutor + gamification sau avatar) → bước `cheer`
- [x] 4.2 Gắn `data-tour` vào surface có sẵn: 4 link header + ô search + account menu (contract điều hướng KHÔNG đổi)
- [ ] 4.3 [deferred] Đăng ký ≥1 tip theo ngữ cảnh (đi cùng 3.2)

## 5. Helper & a11y
- [x] 5.1 Replay thủ công qua **mục "Xem lại hướng dẫn" trong account menu** (thay cho `MascotHelperFab` — [deferred] FAB + sheet trợ giúp + ẩn FAB)
- [x] 5.2 a11y: **focus trap** coach-mark, Esc → confirm bỏ qua, ←/→/Enter, aria-live nội dung bước, AA contrast trên dim
- [ ] 5.3 [deferred] emit `onboarding.completed` khi xong welcome

## 6. Verify
- [x] 6.1 i18n `mascot.*` + `onboarding.*` (vi/en); tsc/eslint/build xanh
- [x] 6.2 Test: welcome auto-start người mới + không lặp người cũ, skip + confirm, target mất → skip, keyboard/focus-trap, reduced-motion; `openspec validate onboarding-mascot-guide` PASS
</content>
