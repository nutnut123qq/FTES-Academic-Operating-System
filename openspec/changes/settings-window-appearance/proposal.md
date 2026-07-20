## Why

Menu tài khoản đã có mục "Cài đặt" (`GearIcon` → `pathConfig().locale().profile().settings()`) và `pathConfig` đã khai báo cả cây `/profile/settings/*` (edit, security, sessions, ai-settings, ai-subscription, membership, bookmarks, learning, …), **nhưng không tồn tại route nào trong `src/app`** — bấm vào là 404. Trong khi đó cài đặt giao diện (Chế độ / Màu chủ đạo / Hiệu ứng nền) lại bị phơi thành **một nút icon palette đứng trần trên navbar**, mở modal riêng.

Sếp yêu cầu: bỏ icon palette khỏi navbar, gom vào cửa sổ Cài đặt — và "chưa có cửa sổ setting" thì phải dựng.

## What Changes

- **MỚI:** route `/[locale]/profile/settings` — trang hub Cài đặt, nằm trong `ProfileShell` như các trang profile khác. Link "Cài đặt" trong menu tài khoản hết 404.
- Trang hub chứa **đúng một mục: "Giao diện"**, tái dùng nguyên 3 section sẵn có (`ModeSection`, `AccentSection`, `EffectSection`) — không viết lại logic theme/accent/effect.
- **GỠ:** nút `PaletteIcon` ở cụm phải navbar desktop (`features/navbar/Navbar/index.tsx`) và hàng "Giao diện" trong mobile drawer.
- **GỠ:** `AppearanceModal` + overlay key `appearance` (`useAppearanceOverlayState`) + đăng ký ở `ModalContainer`. 3 section con được chuyển sang cây `features/profile/Settings`.
- i18n vi + en cho tiêu đề trang / mục Giao diện (tái dùng `profileSettings.title` đã có).
- Không đụng backend, không đụng store `appearance` (Zustand persist + script chống flash ở layout giữ nguyên).

Không phải **BREAKING** với người dùng: mọi lựa chọn giao diện đã lưu vẫn còn nguyên, chỉ đổi chỗ vào.

## Capabilities

### New Capabilities
- `profile-settings-page`: trang hub `/profile/settings` — điểm đến thật của mục "Cài đặt" trong menu tài khoản, khung chứa các mục cài đặt tài khoản (lần này chỉ có Giao diện).

### Modified Capabilities
- `appearance-settings`: điểm vào đổi từ **nút navbar mở modal** sang **mục Giao diện trong trang `/profile/settings`**. Các yêu cầu về hành vi Chế độ / Màu chủ đạo / Hiệu ứng nền giữ nguyên, chỉ đổi surface chứa chúng.

## Impact

- `src/app/[locale]/profile/settings/page.tsx` (mới).
- `src/components/features/profile/Settings/` (mới) — nhận 3 section chuyển từ `modals/AppearanceModal/`.
- `src/components/features/navbar/Navbar/index.tsx` — gỡ import `PaletteIcon`, `useAppearanceOverlayState`, 2 chỗ render nút.
- `src/components/modals/AppearanceModal/` — xoá `index.tsx`; `src/components/modals/ModalContainer.tsx` — gỡ đăng ký.
- `src/hooks/zustand/overlay/{store,hooks}.ts` — gỡ overlay key `appearance`.
- `src/messages/{vi,en}.json`.
- KHÔNG đụng: `hooks/zustand/appearance/store.ts`, `app/globals.css` (`data-accent`), script pre-paint ở `app/[locale]/layout.tsx`, cây `layouts/shell/Navbar` (navbar legacy, không mount).
- Phần còn lại của cây `pathConfig` settings (security/sessions/ai-settings/…) vẫn 404 sau change này — ngoài phạm vi, ghi nhận là nợ.
