# en-full-course-wording-parity — Spec

## MODIFIED Requirements

### Requirement: Ngữ tiếng Anh của nhãn "trọn khoá"

`detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL dùng CÙNG MỘT chuỗi "Full course" trong `src/messages/en.json`.

Hai khoá này cùng chỉ khái niệm "trọn khoá" — một dùng cho card mua khoá LEGACY, một dùng cho nhãn
entitlement `COURSE` trên card chọn gói — và hiển thị trên cùng một trang chi tiết khoá. Chuỗi
"Full course" khớp thuật ngữ entitlement `COURSE` của BE và chuỗi cùng cụm
`detail.planIncludes.fullVideo`. Quy tắc này song
song với luật đã có cho `src/messages/vi.json` ("Trọn khóa"). Việc thống nhất SHALL chỉ đụng đúng
hai khoá nói trên: các chuỗi văn xuôi khác có chứa "whole course" MUST NOT bị đổi, và bộ khoá
`vi`/`en` SHALL không lệch nhau về số lượng lẫn tên khoá.

#### Scenario: Hai khoá tiếng Anh khớp nhau

- **WHEN** đọc `src/messages/en.json`
- **THEN** `detail.wholeCourse` và `detail.package.entitlementFullCourse` SHALL cùng là "Full course"

#### Scenario: Văn xuôi giữ nguyên

- **WHEN** đối chiếu `en.json` trước/sau thay đổi
- **THEN** các chuỗi văn xuôi chứa "whole course" (ví dụ "Enroll to learn the whole course.")
  MUST NOT bị đổi
- **AND** diff của `en.json` SHALL chỉ gồm đúng một dòng giá trị

#### Scenario: Bộ khoá vi/en không lệch

- **WHEN** so bộ khoá phẳng của `vi.json` và `en.json`
- **THEN** số khoá hai bên SHALL bằng nhau
- **AND** SHALL không có khoá chỉ tồn tại ở một bên (không khoá mồ côi)
