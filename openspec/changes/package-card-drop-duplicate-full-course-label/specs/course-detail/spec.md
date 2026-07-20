# package-card-drop-duplicate-full-course-label — Spec

## MODIFIED Requirements

### Requirement: Nhãn entitlement của card chọn gói

Card chọn gói ở trang chi tiết khoá SHALL gắn nhãn cố định "Trọn khóa" (en: "Full course") cho mọi gói có ít nhất một entitlement `type` bằng `COURSE` (so sánh sau khi trim, không phân biệt hoa/thường) và MUST NOT hiển thị bất kỳ con số đếm nào cho gói đó; nhưng khi nhãn đó TRÙNG tên gói thì card MUST NOT render nhãn, để cùng một chuỗi không bị in hai lần. Phép so trùng SHALL chuẩn hoá cả hai vế trước khi so: bỏ dấu tiếng Việt, trim, lowercase, gộp khoảng trắng thừa — nên "Trọn khoá", "Trọn khóa", "TRỌN KHOÁ" và "Trọn  khoá" đều được coi là trùng nhau. Gói không có entitlement `COURSE` SHALL giữ nguyên cách đếm hiện có `{count} phần` với `count` là số phần tử `entitlements`, và khi `count = 0` thì MUST NOT render annotation. Khoá i18n `detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL dùng cùng một biến thể chính tả tiếng Việt ("Trọn khóa"), và bộ khoá `vi`/`en` SHALL không lệch nhau.

#### Scenario: Gói auto-upgrade tên trùng nhãn

- **WHEN** gói có `name = "Trọn khoá"` và `entitlements = [{ type: "COURSE" }]`
- **THEN** hàng gói SHALL chỉ chứa chuỗi "Trọn kho..." ĐÚNG MỘT lần (tên gói)
- **AND** MUST NOT render thêm nhãn entitlement bên cạnh tên

#### Scenario: Gói toàn khoá tên KHÁC nhãn

- **WHEN** gói có `name = "Gói VIP"` và `entitlements = [{ type: "COURSE" }]`
- **THEN** hàng gói SHALL hiện "Gói VIP" kèm nhãn "Trọn khóa"

#### Scenario: Trùng bất kể dấu, hoa thường, khoảng trắng thừa

- **WHEN** gói có `name = "  TRỌN   KHOÁ "` và `entitlements = [{ type: "COURSE" }]`
- **THEN** nhãn entitlement MUST NOT được render (coi là trùng tên gói)

#### Scenario: Gói theo phần giữ nguyên cách đếm

- **WHEN** gói có `entitlements = [{ type: "PART" }, { type: "PART" }]` và không có `COURSE`
- **THEN** annotation SHALL là "2 phần" y như trước khi có luật dedupe
- **AND** một gói có `entitlements` rỗng hoặc thiếu SHALL không render annotation

#### Scenario: Chính tả thống nhất trên cùng một trang

- **WHEN** đọc `src/messages/vi.json`
- **THEN** `detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL cùng là "Trọn khóa"
