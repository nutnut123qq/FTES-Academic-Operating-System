# Tasks — appearance-settings

## 1. Nền tảng: token, store, chống flash

- [x] 1.1 Tạo `src/resources/constants/appearance.ts`: bảng 6 preset accent (`indigo` #3F51B5 đầu tiên/mặc định, `pink` = oklch(70.03% 0.2092 354.13) hiện tại, + 4 màu curated đạt contrast trắng ≥ 4.5:1), export `AccentId`, `EffectDirection`, tên localStorage key `ftesaos-appearance`
- [x] 1.2 `globals.css`: đổi `--accent` gốc ở cả block light lẫn dark sang `#3F51B5`; thêm các block `[data-accent="<id>"] { --accent; --accent-foreground }` cho đủ 6 preset (đặt sau block theme)
- [x] 1.3 Tạo `src/hooks/zustand/appearance/store.ts`: zustand + `persist` (shape `accent`/`effectEnabled`/`effectDirection` + 3 setter; default `indigo`/`true`/`"fall"`) và effect đồng bộ `document.documentElement.dataset.accent` khi `accent` đổi
- [x] 1.4 `src/app/layout.tsx`: thêm script inline pre-paint đọc `localStorage["ftesaos-appearance"]` (parse `state.accent`, try/catch) và set `data-accent` trên `<html>` trước first paint
- [x] 1.5 Verify bước nền: `npm run build` xanh + `tsc --noEmit` sạch; mở dev thấy accent xanh mặc định, đổi tay localStorage → reload không flash màu cũ (build: batch-verified by orchestrator; tsc --noEmit sạch)

## 2. AmbientBackground: hướng fall + keyframe

- [x] 2.1 `globals.css`: thêm `@keyframes meteorFall` (từ -15vh → 110vh, fade in/out, `translateX(var(--drift))`); mở rộng guard `prefers-reduced-motion` cho cả `.ambient-meteor`
- [x] 2.2 `AmbientBackground/index.tsx`: thêm prop `direction?: "rise" | "fall"` (default `"fall"`); giữ nguyên công thức seed; nhánh fall render vệt (cao `size*7`, gradient accent→transparent hướng đuôi lên trên, nghiêng theo drift, class `ambient-meteor`, animation `meteorFall`, neo `top-0`) + glow radial chuyển lên mép trên; nhánh rise giữ nguyên 100%
- [x] 2.3 `src/app/InnerLayout.tsx`: đọc `effectEnabled`/`effectDirection` từ appearance store (selector hẹp); render `AmbientBackground` với `direction` khi bật, ẩn hoàn toàn khi tắt; giữ điều kiện loại route learn
- [x] 2.4 Verify: `npm run build` xanh + `tsc --noEmit` sạch; dev thấy sao băng xanh rơi mặc định, đổi store tay → rise hoạt động như cũ, không cảnh báo hydration (build: batch-verified by orchestrator; tsc --noEmit sạch)

## 3. Modal cài đặt giao diện

- [x] 3.1 `src/hooks/zustand/overlay/store.ts` + `hooks.ts`: thêm overlay key `"appearance"` + `useAppearanceOverlayState`
- [x] 3.2 i18n: thêm cụm `appearance.*` vào `src/messages/vi.json` + `en.json` (title, mode.{label,light,dark,system}, accent.{label,default,names.*}, effect.{label,enabled,direction,rise,fall}); JSON hợp lệ
- [x] 3.3 Tạo `src/components/modals/AppearanceModal/` theo pattern `LanguageModal`: `index.tsx` + `ModeSection` (radiogroup segmented 3 chế độ, dùng `useTheme`) + `AccentSection` (radiogroup swatch từ bảng preset, aria-label tên màu, ring + check khi chọn, swatch đầu ghi "(mặc định)") + `EffectSection` (Switch bật/tắt + radiogroup rise/fall, disabled khi off); mọi control áp live, không nút lưu
- [x] 3.4 Mount `AppearanceModal` vào `src/components/modals/ModalContainer.tsx`
- [x] 3.5 Verify: `npm run build` xanh + `tsc --noEmit` sạch; modal mở được, đổi mode/màu/hiệu ứng áp ngay và giữ sau reload (build: batch-verified by orchestrator; tsc --noEmit sạch)

## 4. Thay nút navbar + dọn

- [x] 4.1 `src/components/features/navbar/Navbar/index.tsx`: thay `DarkLightModeSwitch` ở hàng inline desktop bằng Button icon palette `variant="tertiary"` `aria-label={t("appearance.title")}` mở overlay `appearance`
- [x] 4.2 Cùng file: thay `DarkLightModeSwitch` trong mobile drawer bằng nút tương tự; `onPress` đóng drawer (`setDrawerOpen(false)`) TRƯỚC rồi mở modal; bỏ import `DarkLightModeSwitch`
- [x] 4.3 Xoá `src/components/features/navbar/Navbar/AccountMenuDropdown/DarkLightModeSwitch/` (cây live hết tham chiếu); KHÔNG đụng cây legacy `src/components/layouts/shell/Navbar/**`
- [x] 4.4 Kiểm tra a11y bằng bàn phím: Tab tới nút, mở modal, mũi tên di chuyển radiogroup (mode, màu, hướng), focus ring hiện rõ, Esc đóng modal

## 5. Verify cuối

- [x] 5.1 Chạy đủ kịch bản tay: khách (chưa login) mở modal từ desktop + mobile drawer; đổi màu → reload giữ màu, không flash; tắt hiệu ứng → nền biến mất tức thì; rise ↔ fall live; bật OS reduce-motion → không spark nào hiện; xoá localStorage → mặc định xanh + rơi sao băng; chuyển vi/en đủ nhãn
- [x] 5.2 `npm run build` (webpack) xanh + `tsc --noEmit` sạch lần cuối; `openspec validate appearance-settings` pass (build: batch-verified by orchestrator; tsc --noEmit sạch)
