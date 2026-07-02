# Journey camera retakes control on stage change

## Why

Trong hero 3D user-journey (`UserJourneyScene`), khi người dùng kéo xoay scene
(OrbitControls `onStart`) thì `userTookOver` được set **vĩnh viễn** — CameraRig bỏ
camera luôn. Hệ quả: sau khi xoay, click stepper (sidebar) đổi `activeIndex` nhưng
camera đứng im, không bay tới trạm được chọn — trải nghiệm guided-tour gãy đúng ở
tương tác chính của nó.

## What Changes

- `CameraRig` lấy lại quyền điều khiển camera **mỗi khi trạm active đổi** (click
  stepper HOẶC auto-advance): reset cờ takeover + `invalidate()`, để lerp sẵn có
  tween thẳng **một bước** từ góc người dùng đang xoay về góc chuẩn của trạm mới
  (không đi 2 pha "về chỗ cũ rồi mới dịch chuyển").
- Đồng bộ `OrbitControls.target` lerp theo trạm active (thay vì chỉ `camera.lookAt`)
  để lần kéo xoay tiếp theo pivot đúng quanh trạm hiện tại, không giật snap.
- Không đổi API/props của `UserJourneyScene`; caller (`JourneyHero`) giữ nguyên.

## Capabilities

### New Capabilities

_(không có)_

### Modified Capabilities

- `home-landing`: scenario "Visitor steps through the journey to the payoff" được
  siết thêm — camera transition PHẢI hoạt động **kể cả sau khi** người dùng đã orbit
  tự do (takeover chỉ kéo dài tới lần đổi trạm kế tiếp, không vĩnh viễn). Capability
  này đang nằm trong change `home-landing-redesign` (chưa archive) — delta ở đây
  bổ sung lên requirement đó.

## Impact

- FE-only, 1 file: `src/components/blocks/marketing/UserJourneyScene/index.tsx`
  (`CameraRig` + `Scene`/`OrbitControls`). Diff ~5–10 dòng.
- Không đụng BE, không đụng i18n, không đổi data `scene.json`.
