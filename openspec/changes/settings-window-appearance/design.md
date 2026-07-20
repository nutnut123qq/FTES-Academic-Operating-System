## Context

- Cài đặt giao diện hiện sống trong `components/modals/AppearanceModal/` (3 section con: `ModeSection` / `AccentSection` / `EffectSection`), mount global ở `ModalContainer`, mở bằng overlay key `appearance`.
- Điểm vào là nút `PaletteIcon` đứng trần ở navbar: `features/navbar/Navbar/index.tsx:141-148` (desktop) và `:211-221` (mobile drawer).
- `pathConfig().locale().profile().settings()` = `/profile/settings` đã được `AccountMenuAuthed` link tới, i18n `profileSettings.title/subtitle` đã có — **route thì chưa tồn tại** (`src/app/[locale]/profile/` chỉ có academic/certificates/community/edit/portfolio/progress).
- Cây `layouts/shell/Navbar/**` (có `AppearanceRow` switch dark/light) là navbar **legacy không mount** — navbar live là `features/navbar`.
- Trạng thái/persist đã đúng và không cần đụng: zustand `ftesaos-appearance`, script pre-paint `data-accent` ở root layout, block CSS `[data-accent=…]` trong `globals.css`, next-themes cho mode.

## Goals / Non-Goals

**Goals:**
- Có cửa sổ Cài đặt thật tại `/profile/settings`; link "Cài đặt" trong menu tài khoản hết 404.
- Cài đặt giao diện chỉ còn **một** điểm vào, nằm trong Cài đặt.
- Navbar sạch: không còn icon palette.
- Diff nhỏ nhất: **di chuyển** 3 section, không viết lại.

**Non-Goals:**
- Không dựng 11 sub-page còn lại của cây `pathConfig` settings (security, sessions, ai-settings, ai-subscription, membership, bookmarks, learning, submissions, attempts, feedback, ai-usage) — vẫn 404 sau change này.
- Không gom `LanguageDropdown` khỏi navbar vào Cài đặt (sếp chốt chỉ Giao diện).
- Không đụng backend, không thêm sidebar nav riêng cho settings, không đụng cây navbar legacy.

## Decisions

**1. Trang, không phải modal.**
Sếp nói "cửa sổ setting"; chọn **trang** vì link + i18n + path builder đã có sẵn và đang chết — dựng trang là vừa làm đúng yêu cầu vừa vá link 404 bằng cùng một diff. Modal thì `/profile/settings` vẫn 404 và cây `pathConfig` vẫn mồ côi.
*Đã cân nhắc:* giữ modal đổi tên thành `SettingsModal` (rẻ hơn ~30 dòng nhưng để lại link chết); làm cả hai (2 nguồn sự thật cho cùng một thứ — loại).

**2. Trang nằm trong `ProfileShell`, không tự dựng layout.**
`src/app/[locale]/profile/settings/page.tsx` tự động ăn `profile/layout.tsx` → cùng khung identity + tabs như `/profile/edit`. Không thêm tab "Cài đặt" vào `SECTIONS` của `ProfileShell`: Cài đặt không phải một section hồ sơ công khai, và `/profile/edit` hôm nay cũng đã sống ngoài tab-set (tab rơi về "personal"). Nhất quán với hiện trạng, 0 dòng thêm.
*Đã cân nhắc:* route group riêng `(settings)` với sidebar nav trái kiểu `starci-academy` — thừa khi chỉ có một mục.

**3. Di chuyển 3 section, xoá vỏ modal.**
`ModeSection` / `AccentSection` / `EffectSection` chuyển nguyên trạng sang `components/features/profile/Settings/` (chỉ đổi đường import). Vỏ `AppearanceModal/index.tsx` xoá hẳn cùng đăng ký ở `ModalContainer` và overlay key `appearance` (`store` + `useAppearanceOverlayState`) — để lại thì thành dead code không ai mở được.
*Đã cân nhắc:* giữ modal như lối tắt thứ hai — vi phạm "một điểm vào", và là thứ chính sếp bảo bỏ.

**4. Live preview vẫn đúng "miễn phí".**
Cả 3 nhóm ghi thẳng vào next-themes / zustand store toàn cục, nên khi ở trang, đổi gì áp ngay lên chính trang đó — không cần thêm cơ chế preview nào. Hiệu ứng nền còn dễ thấy hơn modal cũ (không bị backdrop che).

## Risks / Trade-offs

- **Đổi giao diện giờ tốn nhiều thao tác hơn** (menu tài khoản → Cài đặt → cuộn) so với 1 click ở navbar → đúng ý sếp (navbar gọn), và đây là hành vi đặt-một-lần, không phải thao tác hằng ngày.
- **Khách chưa đăng nhập mất lối vào giao diện**: nút navbar cũ hiện cho cả guest, còn `/profile/settings` là surface tài khoản và mục "Cài đặt" chỉ có trong `AccountMenuAuthed`. → Chấp nhận trong phạm vi này; guest vẫn có mặc định tử tế + theo hệ thống. Nếu sếp cần guest chỉnh được, mở thêm mục Giao diện trong `AccountMenuGuest` sau (1 dòng link).
- **Trang Cài đặt chỉ có một mục trông hơi trống** → chấp nhận: phần còn lại chưa có contract BE, thà trống thật còn hơn một rừng link 404.
- **Gỡ overlay key `appearance`** có thể còn chỗ khác import → grep `useAppearanceOverlayState` toàn repo trước khi xoá; test `Navbar.shortcut.test.tsx` có mock `PaletteIcon`, phải cập nhật.

## Migration Plan

FE-only, không migration dữ liệu: store `ftesaos-appearance` giữ nguyên key và shape nên mọi lựa chọn đã lưu vẫn áp bình thường. Rollback = revert commit.

## Open Questions

- Có cần lối vào giao diện cho khách (chưa đăng nhập) không? Mặc định lần này: **không**.
