# Tasks

## 1. Khung Cài đặt
- [x] 1.1 `NAV_GROUPS` thay `NAV_ITEMS`: 4 nhóm có nhãn, nhóm sau có `divider`
- [x] 1.2 `segment: string | null` — `null` cho đích ngoài cây settings (Sửa hồ sơ)
- [x] 1.3 Active state bỏ qua item `segment === null`
- [x] 1.4 Nút Back: `router.back()` khi `history.length > 1`, ngược lại push `/profile`
- [x] 1.5 `pathConfig().profile().privacy()` builder mới

## 2. Giao diện — màu chủ đạo
- [x] 2.1 `accentCustom` + `setAccentCustom` + `resetAccent` trong store
- [x] 2.2 `applyAccent`: preset qua `data-accent`, custom qua inline `--accent`/`--accent-foreground`
- [x] 2.3 Chọn preset xoá custom (tránh inline nuốt lựa chọn)
- [x] 2.4 `accentForeground()` theo ngưỡng YIQ + `isAccentHex`/`isAccentId`
- [x] 2.5 Script pre-paint ở `[locale]/layout.tsx` đọc thêm `accentCustom` (giữ đồng bộ công thức)
- [x] 2.6 `AccentSection`: ColorPicker + Reset, preview tức thì, debounce 250ms khi ghi store
- [x] 2.7 `appearance.test.ts` cho helper hằng số

## 3. Giao diện — hiệu ứng nền
- [x] 3.1 `BackgroundEffect` + `BACKGROUND_EFFECTS` (10 giá trị) + `isBackgroundEffect`
- [x] 3.2 9 component hiệu ứng trong `AmbientBackground/effects/` + `useSeededParticles`
- [x] 3.3 `AmbientBackground` nhận `effect`; `InnerLayout` truyền xuống thay cờ bật/tắt
- [x] 3.4 `EffectSection`: radiogroup 10 ô xem trước live (12 hạt/ô), hướng + tốc độ chỉ hiện với `ember`
- [x] 3.5 Store `version: 2` + `migrate` từ `effectEnabled`; `onRehydrateStorage` lọc giá trị lạ

## 4. Riêng tư
- [x] 4.1 `PrivacySection`: radiogroup PUBLIC/MEMBERS/PRIVATE + 7 công tắc
- [x] 4.2 Đọc `getSelfProfile` dùng chung `SELF_PROFILE_KEY`, ghi qua `usePostUpdatePrivacySettingsSwr`
- [x] 4.3 Route `/profile/settings/privacy`
- [x] 4.4 i18n `profileSettings.privacy.*` + `profileSettings.groups.*` (en + vi)

## 5. Verify
- [x] 5.1 `npx tsc --noEmit` sạch
- [x] 5.2 `npx vitest run src/resources/constants/appearance.test.ts`
- [ ] 5.3 Bấm thật trên trình duyệt (đổi màu, đổi hiệu ứng, lưu riêng tư) — CHƯA làm
