# challenge-attempt-count-excludes-failed — bài nộp FAILED không được tính là lượt đã dùng

## Why
Học viên không bấm nộp được `[HSF302]` dù BE vẫn nhận bài. Trang hiện **"2/10 submissions"** và
**"A project can be graded at most 2 times"**, nút nộp bị khoá.

Lịch sử thật của học viên đó trên challenge (đo trên apitest 2026-08-10):

| attempt | payload | status |
|---|---|---|
| 1 | FILE | SCORED |
| 2 | FILE | **FAILED** (Cloudinary 401, chấm cạn retry → DLQ) |

BE đếm lượt bằng `status <> 'FAILED'` ở CẢ HAI chỗ (`countConsumingAttempts` cho `max_submissions`
và `countByChallengeIdAndParticipantIdAndPayloadTypeIn` cho `PROJECT_GRADE_LIMIT`) — bài chết vì lỗi
hệ thống KHÔNG tiêu lượt của học viên. FE thì đếm `submissions.length` và đếm mọi payload FILE/URL,
**kể cả FAILED** → lệch một lượt → khoá nút dù BE sẵn sàng nhận.

Thêm một lệch nữa: từ `project-grade-limit-purchased` (BE #88), cap 2-lượt-chấm-project **chỉ áp cho
học viên chưa có quyền trả phí**; người đã mua / enrollment LEGACY chỉ còn `max_submissions`. FE
không biết trạng thái entitlement nên khoá cứng ở 2 là khoá nhầm đúng nhóm này.

## What Changes
- **`ChallengeSubmission`**: `usedCount` bỏ qua bài `FAILED` → chip `used/max` và `reachedMax` khớp BE.
- **`ChallengeMethodSolver`**: đếm project-grade cũng bỏ qua `FAILED`.
- **Cap project chỉ CẢNH BÁO, không khoá nút**: bỏ `projectLimitReached` khỏi mọi `canSubmit*` và khỏi
  các guard trong handler. BE là nơi phán quyết và đã trả `PROJECT_GRADE_LIMIT_REACHED`, mà FE đã dịch
  sẵn lỗi đó thành thông báo rõ ràng (`mapSubmitError`) — nên bỏ khoá không làm mất trải nghiệm, chỉ
  thôi chặn nhầm.

## Impact
- Học viên có bài FAILED lấy lại được lượt đã bị đếm oan; người có entitlement thôi bị khoá ở 2.
- Đổi lại: học viên free đã dùng hết cap giờ bấm được nút rồi mới nhận thông báo từ BE, thay vì nút mờ sẵn.
- Không đụng API, không đổi contract.
