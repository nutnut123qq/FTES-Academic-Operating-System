# Appearance Settings — settings modal thay cho nút dark/light, accent màu tuỳ chọn, điều khiển hiệu ứng nền

## Why

Người dùng hiện chỉ bật/tắt dark/light bằng một Switch trong navbar; màu chủ đạo (`--accent`) bị đóng cứng màu hồng trong `globals.css`, và hiệu ứng nền "bay bay" (AmbientBackground — đốm sáng bay lên từ đáy) luôn bật, không tắt/không đổi hướng được. Thầy muốn gom tất cả vào một nút Cài đặt giao diện: chọn chế độ sáng/tối, chọn màu chủ đạo, bật/tắt hiệu ứng và đổi hướng bay lên ↔ rơi xuống như sao băng — với mặc định mới là **màu xanh #3F51B5 + rơi xuống như sao băng**.

## What Changes

- **Thay nút dark/light bằng nút "Giao diện" (⚙/palette)** tại đúng 2 chỗ nút cũ đang sống trong navbar thật (`src/components/features/navbar/Navbar/index.tsx`): hàng inline desktop (cạnh LanguageDropdown) và hàng "Giao diện" trong mobile drawer. Nút mở **Appearance settings modal** (HeroUI Modal, mount ở global `ModalContainer`, điều khiển qua overlay store). Navbar hiển thị cho cả khách lẫn người đăng nhập → khách cũng vào được cài đặt giao diện.
- **Appearance modal** gồm 3 nhóm:
  - *Chế độ*: segmented Sáng / Tối / Hệ thống (giữ next-themes, thêm lựa chọn `system`).
  - *Màu chủ đạo*: lưới 6 swatch preset — swatch ĐẦU = xanh `#3F51B5` (mặc định, lấy từ `blue.primary` của Ftes-frontend cũ), một swatch là màu hồng hiện tại, còn lại là các màu curated; chọn swatch override token `--accent`/`--accent-foreground` toàn app cho cả light + dark.
  - *Hiệu ứng nền*: toggle bật/tắt + chọn hướng "Bay lên" (hành vi hiện tại) vs "Rơi xuống như sao băng" (rơi CHÉO từ trên-phải xuống dưới-trái, có vệt đuôi sao chổi trùng phương bay) + chọn **tốc độ** "Chậm / Vừa / Nhanh" (map hệ số nhân duration; mặc định "Vừa", áp cho cả hai hướng). Mặc định = BẬT + rơi xuống + tốc độ Vừa.
- **Persistence**: zustand store mới `appearance` có `persist` (localStorage); accent áp trước khi paint (script inline set `data-accent` trên `<html>` — không flash); reduced-motion luôn thắng (hiệu ứng ép tắt về mặt hiển thị).
- **AmbientBackground mở rộng**: prop `direction: "rise" | "fall"` + `speed: "slow" | "normal" | "fast"` (nhân duration keyframe cho cả hai hướng); keyframe mới `meteorFall` rơi CHÉO (translateX+translateY + rotate vệt trùng phương bay) + style vệt đuôi trong `globals.css`; giữ seeded deterministic layout (hydration-safe), animation thuần CSS (không rAF). `InnerLayout` đọc store để render (enabled/direction/speed).
- **Đổi mặc định hình ảnh** (không breaking API): accent mặc định hồng → xanh `#3F51B5`; hiệu ứng mặc định bay lên → rơi xuống. Người dùng cũ chưa có localStorage sẽ thấy mặc định mới.
- **i18n**: cụm khoá `appearance.*` (vi + en) cho tiêu đề modal, nhãn nhóm, tên màu, nhãn hướng, aria-labels.
- Bản copy navbar legacy (`src/components/layouts/shell/Navbar/**` — không được mount) **không sửa**; chỉ ghi chú là cây chết.

## Capabilities

### New Capabilities

- `appearance-settings`: nút mở + modal cài đặt giao diện (chế độ sáng/tối/hệ thống, màu chủ đạo, điều khiển hiệu ứng nền), store persist + cơ chế áp token accent không flash, i18n + a11y của modal.
- `ambient-background`: hành vi hiệu ứng nền ambient theo cấu hình — bật/tắt, hướng rise/fall, hình ảnh sao băng (vệt đuôi), mặc định, reduced-motion, ràng buộc hiệu năng + hydration.

### Modified Capabilities

<!-- Không có spec hiện hữu nào trong openspec/specs/ chạm tới theme/navbar-controls/ambient background — không có delta. -->

## Impact

- `src/components/features/navbar/Navbar/index.tsx` — thay `DarkLightModeSwitch` (2 chỗ) bằng nút mở modal; xoá/ngừng dùng `AccountMenuDropdown/DarkLightModeSwitch/`.
- `src/components/modals/ModalContainer.tsx` + `src/components/modals/AppearanceModal/**` (mới).
- `src/hooks/zustand/overlay/store.ts|hooks.ts` — overlay key `appearance` mới; `src/hooks/zustand/appearance/**` (store persist mới).
- `src/components/blocks/layout/AmbientBackground/index.tsx` — prop `direction`; `src/app/InnerLayout.tsx` — đọc store.
- `src/app/globals.css` — block `[data-accent="…"]` cho từng preset + keyframe `meteorFall` + guard reduced-motion; `src/app/layout.tsx` — script inline set `data-accent` trước paint.
- `src/resources/constants/appearance.ts` (mới) — bảng preset màu.
- `src/messages/vi.json` / `en.json` — khoá `appearance.*`.
- Không đụng backend; FE-only. Không đụng cây legacy `layouts/shell`.
