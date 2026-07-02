# Tasks — config-center

## 1. Nền tảng: model, mock store, seam, seed, i18n

- [ ] 1.1 Tạo `src/resources/constants/config.ts`: types (`FlagStatus`, `FeatureFlag`, `SettingType`, `SettingField`, `SettingGroup`, `ConfigScope`, `ConfigCategory`) + seed mock (vài feature flag mẫu, 6 setting-group mẫu cho general/appearance/integrations/notifications/security/limits) + key localStorage `ftesaos-config`
- [ ] 1.2 Tạo `src/hooks/zustand/config/store.ts`: zustand + `persist` giữ `flags`, `groups`, `scope`, `status`; setter cho flag/group; seed từ 1.1
- [ ] 1.3 Tạo `src/services/config/index.ts`: interface `ConfigService` (`listFlags`/`setFlag`/`getGroup`/`saveGroup`) + `mockConfigService` (đọc/ghi store, giả delay, cờ mô phỏng lỗi); ghi comment seam swap sang `httpConfigService` (GET/PUT `/config/*`, PATCH `/config/flags/:key`, envelope `data` nullable — assumption)
- [ ] 1.4 i18n: thêm cụm `admin.config.*` vào `src/messages/vi.json` + `en.json` (title, forbidden, scope, nav 7 mục, flags.*, settings.*, loading, error); JSON hợp lệ
- [ ] 1.5 Verify nền: `npx tsc --noEmit` sạch (build orchestrator-verified)

## 2. Shell + gating + nav + scope stub

- [ ] 2.1 Route `/admin/config/[category]` dưới layout khu admin; redirect `/admin/config` → `/admin/config/general`
- [ ] 2.2 `ConfigCenterLayout` + guard: đọc role mock session; `role !== "superAdmin"` → render `ConfigForbidden` (403 surface, không mount nội dung, không gọi store); breadcrumb + tiêu đề "Trung tâm cấu hình"
- [ ] 2.3 `ConfigCategoryNav`: 7 mục (desktop rail dọc, mobile dropdown/drawer), active theo segment, aria landmark + nhãn i18n
- [ ] 2.4 `ScopeSelector` (stub): Select Global/Production/Staging; env ≠ Global → panel empty-variant "sắp có", không cho lưu
- [ ] 2.5 Verify: `npx tsc --noEmit` sạch; guard chặn admin/member/guest → forbidden; superAdmin vào được (build orchestrator-verified)

## 3. Feature Flags panel

- [ ] 3.1 `FeatureFlagsPanel` + `FlagRow`: key + mô tả + `FlagStatusRadioGroup` (Off/On/Rollout) + `RolloutControl` (slider/number 0–100 khi Rollout) + caption lastChangedBy/At
- [ ] 3.2 `FlagConfirmModal`: đổi trạng thái on↔off mở confirm (HeroUI Modal); Hủy → không đổi; xác nhận → `configService.setFlag` + cập nhật lastChanged (mock)
- [ ] 3.3 Search/filter: `SearchInput` (block nhà) lọc key/mô tả + filter chip trạng thái (all/on/off/rollout); rỗng → empty state
- [ ] 3.4 Verify: `npx tsc --noEmit` sạch; toggle cần confirm, rollout% đổi được, search lọc đúng (build orchestrator-verified)

## 4. System settings: form + validate + save/reset + dirty-guard + audit

- [ ] 4.1 `SettingGroupForm` + `SettingFieldControl`: map type→control (Input text/number, Select, Switch); draft state tách với store
- [ ] 4.2 Validation: required / min-max / pattern → lỗi dưới field + chặn Lưu + announce (aria)
- [ ] 4.3 `SaveResetBar`: Lưu → `configService.saveGroup` + success toast + audit note (mock "bạn"/now); mock error → error toast, giữ draft; Đặt lại → về giá trị đã lưu
- [ ] 4.4 Dirty-state guard: draft ≠ đã lưu → chặn đổi danh mục / rời route bằng confirm ("Có thay đổi chưa lưu"); `beforeunload` + intercept chuyển danh mục nội bộ
- [ ] 4.5 `AuditNote`: dòng "Sửa lần cuối bởi {who} lúc {when}" (mock) mỗi group
- [ ] 4.6 Verify: `npx tsc --noEmit` sạch; validate chặn Lưu, save success/error, reset, dirty-guard hoạt động (build orchestrator-verified)

## 5. Trạng thái + responsive + a11y

- [ ] 5.1 `ConfigSkeleton` (mirror layout nav + panel) khi `status==="loading"`; `ConfigEmptyState` (danh mục chưa có setting); `ConfigErrorState` (load/save hỏng, nút thử lại)
- [ ] 5.2 Responsive: mobile nav collapse dropdown/drawer, panel full-width; desktop 2 cột
- [ ] 5.3 A11y pass: nav landmark, form label + lỗi announce, confirm modal focus-trap + Esc, radiogroup trạng thái flag có nhãn, scope Select có label
- [ ] 5.4 Verify: `npx tsc --noEmit` sạch; kiểm bàn phím (Tab qua nav/flag/form, confirm modal, Esc) (build orchestrator-verified)

## 6. Verify cuối

- [ ] 6.1 Chạy đủ kịch bản tay: superAdmin vào `/admin/config` thấy 7 danh mục; admin/member/guest → forbidden; toggle flag → confirm → đổi + lastChanged; search flag lọc đúng; đổi setting → dirty-guard chặn rời; Lưu success/error toast; Đặt lại; scope env ≠ Global → "sắp có"; loading skeleton + empty + error; mobile nav collapse; vi/en đủ nhãn `admin.config.*`
- [ ] 6.2 `npx tsc --noEmit` sạch lần cuối (build orchestrator-verified); `openspec validate config-center` pass
