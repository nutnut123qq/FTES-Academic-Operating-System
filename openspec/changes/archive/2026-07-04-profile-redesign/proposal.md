## Why

Trang profile học viên hiện tại nhìn phẳng, thiếu nhịp điệu thị giác: identity bị nhốt trong card, tab là hàng nút rờ rợ, các tab Personal/Academic hiển thị dạng label:value đơn điệu, và một số tab chưa có skeleton/empty state chuẩn. Redesign này nâng cấp UI/UX trong phạm vi FE hiện có, không đụng backend.

## What Changes

- ProfileShell: chuyển identity card sang sidebar TRẦN (không card), avatar nổi bật với gradient ring, name/headline/campus/chips gọn gàng; tab bar đổi từ hàng `Button` sang `ExtendedTabs` (HeroUI underline tabs).
- ProfilePersonal: About + Social links được bọc trong `LabeledCard`; social links có icon brand + hover state, không còn dạng label:value.
- ProfileAcademic: chuyển từ list label:value sang grid `MetricCard`-style tiles trong `LabeledCard`.
- ProfileCommunity: dùng `MetricCard` grid cho reputation và `LabeledCard` cho recent posts; empty state dùng `EmptyContent`.
- ProfilePortfolio: giữ CRUD-lite hiện có nhưng bọc trong `LabeledCard` và cải thiện empty state.
- ProfileProgress: XP/rank/heatmap/badges/skill graph đều qua `LabeledCard`/`MetricCard`, `SkillGraph` đưa vào `AsyncContent`.
- Thêm skeletons cho Personal, Academic, Shell; cập nhật i18n keys vi/en.

## Capabilities

### New Capabilities
- `profile-visual-identity`: Quy định bố cục visual, spacing, tokens, skeleton, empty/error state cho trang profile.

### Modified Capabilities
- Không có (không thay đổi behavior/spec hiện có, chỉ cải thiện trình bày).

## Impact

- Ảnh hưởng đến các component trong `src/components/features/profile/*`.
- Thêm/cập nhật keys trong `src/messages/vi.json` và `src/messages/en.json`.
- Không thêm dependency, không thay đổi hook SWR/mock data, không thay đổi type.
