# Proposal — journey-stepper-round-corners

## Why

Checklist STT 11: ô step đang active của stage-stepper ở hero landing "hơi vuông"
(ảnh mẫu image32 — box "Home" viền accent bo góc quá ít). Box dùng `rounded-large`
(~14px) đọc ra hơi cứng so với ngôn ngữ card mềm của app.

## What Changes

- **`JourneyHero`:** đổi radius của nút stage-stepper từ `rounded-large` → `rounded-2xl`
  (16px) cho mềm hơn. Không đụng token global `--radius` (tránh đổi diện rộng), chỉ
  ô mà user chỉ đích danh.

## Capabilities

### Modified Capabilities

- `home-landing`: stage-stepper item bo góc mềm (`rounded-2xl`) đồng bộ ngôn ngữ card.

## Impact

- FE-only, 1 file (`JourneyHero.tsx`), 1 class. Không BE, không i18n, không dependency.
