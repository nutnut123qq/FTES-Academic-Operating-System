# config-center — Config Center: bề mặt cấu hình cấp doanh nghiệp trong admin console (Super Admin gated)

## Why

Thầy chốt: **"làm enterprise thành công ở chỗ config"** — giá trị enterprise của FTES AOS nằm ở một **Config Center** đúng nghĩa, không phải rải cấu hình khắp nơi trong code. `ftes.txt` §24 (Enterprise Infrastructure) liệt kê `Feature Flags` + `Configuration Center` là dịch vụ chia sẻ nền tảng; §22 (Admin) liệt kê `Feature Toggle` + `System Configuration`. Hôm nay muốn bật/tắt một tính năng, đổi một hằng số, hay chỉnh mặc định giao diện đều phải sửa code + build lại — không có bề mặt vận hành cho người điều hành, không có audit "ai đổi gì lúc nào", không có rollout %.

**Config-as-a-product**: cấu hình phải là một *sản phẩm* có bề mặt riêng — có danh mục, có tìm kiếm, có xác nhận, có audit, có phân quyền — chứ không phải file `.env` mồ côi. Đây là **flagship config surface** của khu admin, gated theo Super Admin. Nó là "config section" nằm TRONG admin console (`admin-moderator-console`), là nơi hội tụ: feature flags (bật/tắt/rollout), system settings dạng key-value có validate, và các mặc định như appearance (`appearance-settings` — accent/effect mặc định có thể quản ở đây thay vì hard-code). Làm đúng chỗ này = phần "enterprise" thành công.

FE-only ở giai đoạn này: mock persistence (zustand + localStorage) với **seam swap sang BE config-service** được ghi rõ. Contract của BE config-service là **giả định tường minh** (assumption), không bịa API đã tồn tại.

## What Changes

- **Config Center shell** tại `/admin/config` — **Super Admin gated** (role `superAdmin`). Layout 2 cột: nav danh mục bên trái + panel nội dung bên phải. 7 danh mục: `general`, `feature-flags`, `appearance`, `integrations`, `notifications`, `security`, `limits`. Người không phải Super Admin (admin/moderator/member/guest) → **forbidden** (không phải 404 — cho biết là bị chặn quyền). Route đọc/ghi qua mock store; header có breadcrumb + tiêu đề "Config Center".
- **Feature Flags** — danh mục `feature-flags`: danh sách cờ, mỗi cờ có `key` · mô tả · trạng thái `on`/`off`/`rollout` + `rolloutPercent` (0–100) · `lastChangedAt` + `lastChangedBy` (mock). Toggle on↔off **cần xác nhận** (modal confirm — thao tác vận hành có hệ quả). Có **search/filter** theo key/mô tả + lọc theo trạng thái. Store mock (zustand + `persist` localStorage); **seam swap remote-config** (LaunchDarkly-style / BE `/config/flags`) ghi rõ trong design.
- **Key-value / system settings** — các danh mục còn lại (`general`, `appearance`, `integrations`, `notifications`, `security`, `limits`) render **form nhóm** các setting: kiểu `text` / `number` / `select` / `toggle`. Có **validation** (required, min/max, pattern), **Lưu** / **Đặt lại**, **dirty-state guard** (chặn rời trang khi có thay đổi chưa lưu), và **audit note** (ai/khi — mock) hiển thị lần đổi cuối mỗi nhóm. Lưu → success/error toast (mock có thể mô phỏng lỗi).
- **Environment / scoping (stub, DEFERRED)** — một **scope selector** ở đầu shell (Global vs Environment: `production` / `staging`) làm **stub hướng tới tương lai**: hiển thị + đọc được, nhưng ở giai đoạn này **chỉ Global có dữ liệu thực**; chọn environment khác hiện trạng thái "chưa cấu hình per-env (sắp có)". Đánh dấu **deferred** vì tách store per-env là việc nặng thuộc BE config-service.
- **Trạng thái + responsive + i18n + a11y**: loading skeleton (mirror layout), empty state (danh mục chưa có setting nào), error state khi load/save hỏng; responsive (mobile: nav danh mục collapse thành dropdown/drawer, panel full-width); i18n vi/en dưới namespace `admin.config.*`; a11y (nav là landmark, form field có label + lỗi announce, confirm modal focus-trap, radiogroup trạng thái flag có nhãn).

## Capabilities

### New Capabilities

- `config-center`: bề mặt Config Center trong admin console — shell + nav danh mục (Super Admin gated), quản lý feature flags (on/off/rollout + confirm + search), system settings dạng key-value có validate + save/reset + dirty-guard + audit note (mock), scope selector stub (deferred), cùng các trạng thái loading/empty/error, responsive, i18n `admin.config.*`, a11y, và mock store + seam swap sang BE config-service.

### Modified Capabilities

<!-- Chưa có spec hiện hữu nào trong openspec/specs/ định nghĩa admin config / feature flags / system settings — không có delta sửa. rbac-roles (/admin/roles) là bề mặt admin láng giềng nhưng độc lập; Config Center chỉ THAM CHIẾU role superAdmin của nó để gate, không sửa spec đó. -->

## Impact

- **Route mới** `/admin/config` (+ `/admin/config/[category]` hoặc query `?category=`) trong khu admin — sống cạnh `/admin/roles` (rbac-roles) như "config section" của admin console (`admin-moderator-console`).
- **Gating**: tái dùng cơ chế role của khu admin; chỉ `superAdmin` vào được, các role khác → forbidden surface.
- **Store mock mới** `src/hooks/zustand/config/**` (flags + settings + scope, `persist` localStorage) — seam swap BE config-service ghi trong design; **giả định**: BE cung cấp `GET/PUT /config/*`, `GET/PATCH /config/flags` với envelope `data` nullable (theo canon nhà) — chưa tồn tại, là assumption.
- **i18n** `src/messages/vi.json` + `en.json`: cụm `admin.config.*` (tiêu đề, tên 7 danh mục, nhãn flag/rollout, nhãn setting-group, nút Lưu/Đặt lại, thông điệp dirty-guard/confirm/toast, nhãn scope, forbidden).
- **Appearance seam**: mặc định accent/effect của `appearance-settings` có thể được đọc từ danh mục `appearance` của Config Center (forward-looking) — ghi chú non-breaking, không bắt buộc rewire trong change này.
- Không đụng backend thật; FE-only. Không sửa spec `rbac-roles`.
