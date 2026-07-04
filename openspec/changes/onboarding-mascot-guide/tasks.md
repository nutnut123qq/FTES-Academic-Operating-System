# Tasks — onboarding-mascot-guide

## 1. Asset & component linh vật
- [ ] 1.1 Tách 4 tư thế từ ảnh nguồn linh vật → `public/mascot/{greeting,explain,point,cheer}.webp` (+ `@2x`), nền trong suốt
- [ ] 1.2 `FtesMascot` (pose/size/animated, `aria-hidden`, nhún idle tắt khi reduced-motion, preload `greeting`)
- [ ] 1.3 i18n `mascot.name` (vi/en, mặc định đề xuất "Tesu" — marketing chốt)

## 2. Tour engine
- [ ] 2.1 Kiểu `Tour`/`TourStep` + `registerTour` registry; suy pose/layout từ `intent`
- [ ] 2.2 `SpotlightOverlay` (portal, dim + khoét lỗ theo bounding-rect target + padding/bo góc, `scrollIntoView`, reposition khi resize/scroll/route; `allowInteract` cho click xuyên)
- [ ] 2.3 `MascotCoachMark` (bong bóng auto-flip + mũi nhọn, mascot + tiêu đề + thân + tiến độ n/N + Trước/Tiếp/Bỏ qua + confirm bỏ qua)
- [ ] 2.4 `TourProvider` + `useProductTour` (start/next/prev/skip/resume); hàng đợi 1 tour/lúc; target mất >1.5s → skip step; route mismatch → điều hướng trước

## 3. Trigger & lưu tiến độ
- [ ] 3.1 first-login: đọc cờ `justRegistered` từ luồng `auth-login-popup` (fallback authenticated-first-visit-ever theo localStorage)
- [ ] 3.2 first-visit:{surface}: hook đăng ký tip khi surface mount (chạy 1 lần)
- [ ] 3.3 Persistence localStorage `ftes:tour:{principal}:*` (principal = userId | device uuid): completed / resume step / optOut

## 4. Nội dung tour + anchor
- [ ] 4.1 Welcome tour: 4 module header → global search → CTA học khóa đầu → AI tutor → bước `cheer`
- [ ] 4.2 Gắn `data-tour` vào surface có sẵn: 4 link header + ô search Ctrl/K (app-shell), course card CTA, nút AI tutor, chip XP/streak (contract điều hướng KHÔNG đổi)
- [ ] 4.3 Đăng ký ≥1 tip theo ngữ cảnh (vd Workplace) làm mẫu cho các surface khác

## 5. Helper & a11y
- [ ] 5.1 `MascotHelperFab` + sheet trợ giúp (chạy lại welcome, danh sách tip, link docs, ẩn FAB nhớ localStorage; ẩn khi tour overlay đang chạy)
- [ ] 5.2 a11y: focus trap coach-mark, Esc bỏ qua, ←/→/Enter, aria-live nội dung bước, AA contrast trên dim
- [ ] 5.3 (tùy chọn) emit `onboarding.completed` khi xong welcome nếu endpoint activity có sẵn

## 6. Verify
- [ ] 6.1 i18n `mascot.*` + `onboarding.*` (vi/en); tsc/eslint/build xanh
- [ ] 6.2 Test luồng: welcome auto-start người mới + không lặp người cũ, skip, resume, target mất → skip, keyboard, reduced-motion; `openspec validate onboarding-mascot-guide` PASS
