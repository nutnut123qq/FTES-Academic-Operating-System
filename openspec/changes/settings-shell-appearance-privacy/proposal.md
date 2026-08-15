# settings-shell-appearance-privacy — khung Cài đặt nhiều nhóm, Giao diện mở rộng, và màn Riêng tư

> **Change hồi tố.** Code đã ship trong đợt 1 (2026-08-15); tài liệu viết SAU theo diff thật.
> Change này mô tả KHUNG + Giao diện + Riêng tư. Bốn màn mới (AI settings, gói AI, Thành viên,
> Lịch sử học) nằm ở change `settings-ai-membership-and-history`.

## Why

- **Rail Cài đặt chỉ có một nhóm "Account" gồm 4 dòng phẳng** (Giao diện · Bảo mật · Thiết bị ·
  Thông báo). Không có lối ra khỏi Cài đặt, không có lối vào trang sửa hồ sơ, và không phân nhóm —
  càng thêm màn thì càng thành một danh sách dài không đọc được.
- **Giao diện chỉ cho chọn 6 swatch và bật/tắt MỘT hiệu ứng.** Người dùng không đặt được màu riêng,
  và "hiệu ứng nền" là một công tắc boolean trên đúng một trường đốm sáng.
- **Riêng tư không có màn hình nào.** Tầng dữ liệu đã có sẵn (`ProfilePrivacySettings` +
  `usePostUpdatePrivacySettingsSwr`) nhưng không ai render — trong khi BE thật sự nhánh theo
  `visibility` và 7 cờ hiển thị.

## What Changes

### Khung Cài đặt (`SettingsShell`)
- Rail đổi từ một mảng phẳng thành **các nhóm có nhãn**: Account (Sửa hồ sơ · Giao diện · Bảo mật ·
  Thiết bị · Thành viên) — Learning (Lịch sử học) — FrosTES (AI settings · Gói AI) — Preferences
  (Riêng tư · Thông báo). Nhóm từ thứ hai trở đi có `divider`.
- `SettingsNavItem.segment` nhận **`null`** cho đích nằm NGOÀI cây `settings` (Sửa hồ sơ →
  `/profile/edit`): dòng đó không bao giờ được đánh dấu active, vì bấm vào là rời khỏi shell này.
- **Nút Back** phía trên nội dung: `router.back()` khi lịch sử có chỗ để lùi, ngược lại (deep link,
  F5) `push` về `/profile` — `router.back()` ở lần vào lạnh sẽ không làm gì cả.
- Rail chỉ liệt kê **đích đã tồn tại** — rail là điều hướng, không phải danh sách dự định.

### Giao diện
- **Màu chủ đạo:** giữ lưới 6 swatch preset, **thêm color picker tự do** (`ColorArea` + `ColorSlider`
  của HeroUI) và nút Reset. Màu tự do ghi **inline `--accent` / `--accent-foreground` trên `<html>`**,
  vốn thắng block `[data-accent="…"]`; chọn preset thì XOÁ màu tự do (nếu không, inline override sẽ
  âm thầm nuốt lựa chọn preset). Foreground chọn theo ngưỡng độ sáng YIQ — hàm `accentForeground()`
  phải **giữ đồng bộ với script pre-paint** trong `[locale]/layout.tsx` (script đó bắt buộc là chuỗi
  thô vì chạy trước khi React/module load). Kéo picker cập nhật biến CSS ngay (xem trước live), chỉ
  lần **ghi store** mới debounce 250ms.
- **Hiệu ứng nền:** bỏ công tắc boolean, thay bằng **radiogroup 10 lựa chọn** (`none` · ember · wave ·
  snow · rain · bubbles · fireflies · stars · aurora · circuit) — `none` chính là "tắt". Mỗi ô xem
  trước chạy hiệu ứng thật, tô theo accent hiện tại, giới hạn 12 hạt/ô (10 preview live trên một
  trang). Hai radiogroup hướng + tốc độ chỉ hiện khi chọn `ember` — chỉ hiệu ứng đó đọc chúng.
- **Store `appearance` lên `version: 2`** kèm `migrate`: v1 lưu công tắc `effectEnabled`, v2 lưu tên
  hiệu ứng → `effectEnabled === false` map sang `"none"`, còn lại map sang hiệu ứng mặc định. Không
  ai bị mất nền một cách âm thầm. `onRehydrateStorage` lọc giá trị lạ (hiệu ứng không biết, hex hỏng)
  trước khi vào store.
- `InnerLayout` truyền `effect` xuống `AmbientBackground` thay cho cờ bật/tắt; 9 hiệu ứng mới nằm ở
  `AmbientBackground/effects/*` + `useSeededParticles.ts` (hạt sinh theo seed để server và client
  khớp nhau).

### Riêng tư (`/profile/settings/privacy`)
- Ai mở được hồ sơ: 3 lựa chọn **PUBLIC / MEMBERS / PRIVATE** — đúng ba giá trị BE nhánh theo
  (`ProfileQueryService.resolveVisibility`), không bịa thêm.
- 7 công tắc theo trường: `showEmail`, `showPhone`, `showGpa`, `showAcademic`, `showProgress`,
  `showTimeline`, `showFollowers`.
- Đọc từ `getSelfProfile` (dùng chung `SELF_PROFILE_KEY`), ghi qua `usePostUpdatePrivacySettingsSwr`;
  radiogroup dùng chung `handleRadioGroupKeyDown` (roving focus) với các màn khác.

## Impact

- Affected specs: `appearance-settings` (MODIFIED màu + hiệu ứng + persist, ADDED migrate v1→v2),
  `profile-settings-navigation` (ADDED), `profile-privacy-settings` (ADDED)
- Affected code: `Settings/SettingsShell/index.tsx`, `Settings/AccentSection/index.tsx`,
  `Settings/EffectSection/index.tsx`, `Settings/PrivacySection/` (mới),
  `app/[locale]/profile/settings/privacy/page.tsx` (mới), `hooks/zustand/appearance/store.ts`,
  `resources/constants/appearance.ts` (+ test), `resources/path/index.ts` (builder `privacy`),
  `app/InnerLayout.tsx`, `app/[locale]/layout.tsx` (script pre-paint),
  `blocks/layout/AmbientBackground/` (index + 9 effect + `useSeededParticles`), `app/globals.css`,
  `messages/{en,vi}.json`
- Không đụng BE trong change này. Việc đồng bộ lựa chọn giao diện theo TÀI KHOẢN là change riêng
  `appearance-follows-account` (có migration BE V333).
