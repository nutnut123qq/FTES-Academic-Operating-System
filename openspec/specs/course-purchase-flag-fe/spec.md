# course-purchase-flag-fe Specification

## Purpose
TBD - created by archiving change learn-engagement-wire. Update Purpose after archive.
## Requirements
### Requirement: Course detail reflects real purchase state
`useQueryCourseDetailSwr` SHALL map `enrollment.isPurchased` từ `EnrollmentView.isPurchased` (BE mới) thay vì hardcode `false`; khi có token mà không có enrollment khớp, hook SHALL fallback `GET /courses/{courseId}/me/access` để lấy `purchased`/`enrolled` (mua package không kèm enrollment vẫn nhận diện đúng).

#### Scenario: Người đã mua package
- **WHEN** account test đã seed purchase mở course detail `[DEMO] Java nâng cao`
- **THEN** `course.enrollment.isPurchased === true` và UI bán hàng nhường chỗ cho trạng thái đã sở hữu

#### Scenario: Người free-enroll
- **WHEN** user chỉ enroll course free
- **THEN** `isEnrolled: true, isPurchased: false`

#### Scenario: Anonymous
- **WHEN** không có token
- **THEN** không gọi me/access, giữ sales card mặc định (degrade im lặng như hiện tại)

