# package-full-course-entitlement-label — Spec

## ADDED Requirements

### Requirement: Nhãn entitlement của card chọn gói

Card chọn gói ở trang chi tiết khoá SHALL gắn nhãn cố định "Trọn khoá" (en: "Full course") cho mọi gói có ít nhất một entitlement `type` bằng `COURSE` (so sánh sau khi trim, không phân biệt hoa/thường) và MUST NOT hiển thị bất kỳ con số đếm nào cho gói đó; khi một gói trộn `COURSE` với các loại entitlement khác thì `COURSE` SHALL thắng vì nó phủ toàn khoá. Gói không có entitlement `COURSE` SHALL giữ nguyên cách đếm hiện có `{count} phần` với `count` là số phần tử `entitlements`, và khi `count = 0` thì MUST NOT render annotation. Nhãn mới SHALL có đủ cặp khoá i18n `vi` và `en`, và khoá đếm cũ `detail.package.entitlementSummary` SHALL được giữ lại vì vẫn phục vụ nhóm gói theo phần.

#### Scenario: Gói trọn khoá chỉ có 1 entitlement COURSE

- **WHEN** gói "Trọn khoá" trả về `entitlements = [{ type: "COURSE" }]`
- **THEN** annotation cạnh tên gói SHALL là "Trọn khoá"
- **AND** annotation MUST NOT chứa chuỗi "1 phần"

#### Scenario: Gói trộn COURSE với entitlement khác

- **WHEN** gói có `entitlements = [{ type: "SECTION" }, { type: "COURSE" }, { type: "LESSON" }]`
- **THEN** annotation SHALL là "Trọn khoá" chứ không phải "3 phần"

#### Scenario: Gói theo phần giữ nguyên cách đếm

- **WHEN** gói có `entitlements = [{ type: "SECTION" }, { type: "SECTION" }]` và không có `COURSE`
- **THEN** annotation SHALL là "2 phần"
- **AND** một gói có `entitlements` rỗng hoặc thiếu SHALL không render annotation
