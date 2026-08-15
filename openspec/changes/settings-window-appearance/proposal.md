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

### Modified Capabilities
- `appearance-settings`: điểm vào đổi từ **nút navbar mở modal** sang **mục Giao diện trong khu Cài đặt tài khoản**. Delta chỉ còn phần de-modal hoá (gỡ requirement nút navbar + đổi cách nói "modal" → "trang" ở Chế độ / i18n / A11y).

### Đã GỠ khỏi change này (2026-08-15) — xem "Ghi chú thứ tự archive"
- ~~`profile-settings-page` (New)~~ — capability này mô tả một trang hub **nằm trong `ProfileShell`** và **chỉ có đúng mục Giao diện, không được render mục nào khác**. Cả hai điều đó đã sai so với code: khu Cài đặt hôm nay là `SettingsShell` đứng riêng (rail nhiều nhóm, 9 màn). Nội dung còn sống của nó đã được ba capability khác bao trọn nên delta bị xoá thay vì viết lại (viết lại = capability thứ tư mô tả cùng một cái rail).
- ~~`appearance-settings` / "Chọn màu chủ đạo bằng lưới swatch preset"~~ và ~~"Điều khiển hiệu ứng nền trong modal"~~ — thuộc về `settings-shell-appearance-privacy`.

## Ghi chú thứ tự archive (BẪY ĐÃ GỠ — đọc trước khi sửa delta)

Change này viết 2026-07-20 và **đã implement** (mọi task 5/5 tick), nhưng chưa archive. Trong lúc nó
nằm chờ, hai đợt sau đã đi tiếp trên CÙNG spec `appearance-settings` và cùng bề mặt Cài đặt:

- `settings-shell-appearance-privacy` — accent thêm **color picker tự do**, hiệu ứng nền thành
  **radiogroup 10 lựa chọn** (`none` = tắt), store lên `version: 2`; rail Cài đặt nhiều nhóm
  (`profile-settings-navigation`).
- `settings-shell-and-security` (`settings-security`) — khu Cài đặt có shell điều hướng, mỗi màn một URL.
- `profile-menu-quests-and-standalone-settings` (`account-navigation`) — `/profile/settings/*` render
  **đứng riêng, KHÔNG bọc trong profile shell**.
- `appearance-follows-account` — đồng bộ lựa chọn theo tài khoản (chỉ ADDED, không đụng requirement nào ở đây).

Bản delta cũ của change này mô tả **lưới 6 swatch + công tắc boolean bật/tắt hiệu ứng** và **trang hub
trong `ProfileShell` chỉ có Giao diện** — mô tả đã chết. Nếu archive change này SAU
`settings-shell-appearance-privacy`, spec chính `appearance-settings` sẽ bị ghi đè ngược về bản cũ.

**Cách gỡ đã áp dụng:** cắt cho hai delta **rời nhau tuyệt đối theo tên requirement**. Sau khi cắt:

| Requirement trong `appearance-settings` | Do change nào ghi |
| --- | --- |
| Nút "Giao diện" trong navbar mở Appearance settings modal | `settings-window-appearance` (REMOVED) |
| Chọn chế độ sáng / tối / hệ thống | `settings-window-appearance` (MODIFIED) |
| i18n cụm khoá appearance.* (vi + en) | `settings-window-appearance` (MODIFIED) |
| A11y của modal giao diện → A11y của mục Giao diện | `settings-window-appearance` (RENAMED + MODIFIED) |
| Chọn màu chủ đạo bằng lưới swatch preset | `settings-shell-appearance-privacy` (MODIFIED) |
| Điều khiển hiệu ứng nền trong modal | `settings-shell-appearance-privacy` (MODIFIED) |
| Persist cấu hình giao diện qua localStorage, hydration-safe | `settings-shell-appearance-privacy` (MODIFIED) |
| Cấu hình giao diện đã lưu được migrate khi đổi hình dạng | `settings-shell-appearance-privacy` (ADDED) |
| Lựa chọn giao diện đi theo tài khoản, localStorage là bộ đệm | `appearance-follows-account` (ADDED) |

Không ô nào bị hai change cùng ghi ⇒ **archive thứ tự nào cũng ra cùng một spec**, và không đường nào
phục hồi lại mô tả modal / công tắc bật-tắt.

## Impact

- `src/app/[locale]/profile/settings/page.tsx` (mới).
- `src/components/features/profile/Settings/` (mới) — nhận 3 section chuyển từ `modals/AppearanceModal/`.
- `src/components/features/navbar/Navbar/index.tsx` — gỡ import `PaletteIcon`, `useAppearanceOverlayState`, 2 chỗ render nút.
- `src/components/modals/AppearanceModal/` — xoá `index.tsx`; `src/components/modals/ModalContainer.tsx` — gỡ đăng ký.
- `src/hooks/zustand/overlay/{store,hooks}.ts` — gỡ overlay key `appearance`.
- `src/messages/{vi,en}.json`.
- KHÔNG đụng: `hooks/zustand/appearance/store.ts`, `app/globals.css` (`data-accent`), script pre-paint ở `app/[locale]/layout.tsx`, cây `layouts/shell/Navbar` (navbar legacy, không mount).
- Phần còn lại của cây `pathConfig` settings (security/sessions/ai-settings/…) vẫn 404 sau change này — ngoài phạm vi, ghi nhận là nợ.
