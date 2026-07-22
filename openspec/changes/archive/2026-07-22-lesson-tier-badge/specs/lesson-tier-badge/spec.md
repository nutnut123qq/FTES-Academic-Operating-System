# lesson-tier-badge — Spec

## ADDED Requirements

### Requirement: Badge tier bài học theo packageSlugs[0]

Mỗi hàng bài học trong syllabus trang chi tiết khóa SHALL hiển thị badge tier lấy nhãn từ tên gói (`PackageView.name`) khớp `lesson.packageSlugs[0]` (gói tối thiểu mở khóa bài, do BE sắp thấp→cao), thay cho nhãn "Premium" generic; khi `packageSlugs` RỖNG và bài đang `isLocked` thì SHALL giữ badge "Premium" cũ (`t("detail.premium")`); với tier `free` (hoặc `packageSlugs` rỗng mà bài không locked) thì MUST NOT hiển thị badge. Nhãn SHALL resolve theo thứ tự: tên gói khớp slug → map tĩnh 5 slug quen thuộc → title-case slug (không bao giờ để trống). Việc khóa/điều hướng hàng bài SHALL vẫn chỉ theo `isLocked`, KHÔNG đổi.

#### Scenario: Course PACKAGE có tier
- **WHEN** `lesson.packageSlugs = ["premium","master"]` và gói `slug=premium` có `name="PREMIUM"`
- **THEN** hàng bài SHALL hiển thị badge "PREMIUM"
- **AND** một bài `packageSlugs[0] = "free"` SHALL không có badge

#### Scenario: Course LEGACY (không packageSlugs) còn khóa
- **WHEN** `lesson.packageSlugs` rỗng và `isLocked = true`
- **THEN** hàng bài SHALL hiển thị badge "Premium" (nhãn cũ)

#### Scenario: Slug chưa có trong danh sách gói
- **WHEN** `packageSlugs[0] = "on-tap-thuc-chien"` mà `packageNameBySlug` chưa nạp
- **THEN** badge SHALL dùng nhãn fallback "Ôn tập thực chiến" (map tĩnh), không để trống
