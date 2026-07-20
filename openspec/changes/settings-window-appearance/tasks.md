## 1. Dời 3 section giao diện sang cây profile

- [x] 1.1 Tạo `src/components/features/profile/Settings/` và chuyển nguyên `ModeSection/`, `AccentSection/`, `EffectSection/` từ `src/components/modals/AppearanceModal/` sang (chỉ sửa đường import, không đổi logic/markup)
- [x] 1.2 Tạo `Settings/AppearanceSection/index.tsx` — heading `appearance.title` + 3 section xếp dọc `gap-6` (thay vai trò `Modal.Body` cũ)

## 2. Dựng trang /profile/settings

- [x] 2.1 Tạo `src/app/[locale]/profile/settings/page.tsx` — tiêu đề `profileSettings.title` + mô tả `profileSettings.subtitle` + `<AppearanceSection />`, khớp cấu trúc/nhịp của `profile/edit/page.tsx` (tự ăn `profile/layout.tsx` → `ProfileShell`)
- [x] 2.2 Xác nhận mục "Cài đặt" trong `AccountMenuAuthed` điều hướng tới đúng trang (không sửa code — chỉ kiểm chứng link hết 404)

## 3. Gỡ điểm vào cũ

- [x] 3.1 `features/navbar/Navbar/index.tsx`: xoá nút palette desktop (dòng ~141-148), hàng "Giao diện" trong mobile drawer (~205-222), import `PaletteIcon` và `useAppearanceOverlayState`
- [x] 3.2 Xoá `src/components/modals/AppearanceModal/index.tsx` (thư mục rỗng thì xoá luôn) và gỡ `<AppearanceModal />` + import khỏi `ModalContainer.tsx`
- [x] 3.3 Gỡ overlay key `appearance`: `useAppearanceOverlayState` trong `hooks/zustand/overlay/hooks.ts` + entry tương ứng trong `overlay/store.ts`
- [x] 3.4 Cập nhật `Navbar.shortcut.test.tsx`: bỏ mock `useAppearanceOverlayState` và mock `PaletteIcon` nếu có

## 4. i18n

- [x] 4.1 Rà `appearance.*` trong `vi.json`/`en.json`: giữ nhãn còn dùng, xoá khoá chỉ phục vụ nút navbar/modal đã gỡ (không để khoá mồ côi)
- [x] 4.2 Bổ sung nhãn còn thiếu cho mục Giao diện ở cả hai file, JSON hợp lệ, không key thô lộ ra

## 5. Verify

- [x] 5.1 `npx tsc --noEmit` sạch + `npm run lint` sạch
- [x] 5.2 `npm run build` (webpack) xanh
- [x] 5.3 Chạy dev, kiểm bằng preview: `/vi/profile/settings` render; đổi Chế độ / Màu chủ đạo / Hiệu ứng nền áp ngay và giữ sau reload; navbar không còn icon palette; grep `PaletteIcon`/`appearance` overlay không còn tham chiếu sống
