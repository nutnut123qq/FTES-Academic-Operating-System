# challenge-testcase-results — Học viên xem kết quả từng test case (verdict AC/WA/TLE/…)

## Why

BE đang đổi cách chấm challenge CODE inline: **test case chấm điểm tất định**, AI hạ xuống
**feedback-only** (change `challenge-testcase-judge` ở `FTES-AOS-Backend`). Nhưng FE hiện **không
render mảng `results` per-test-case ở đâu cả**:

- `ChallengeSubmission/index.tsx` gọi `useQueryChallengeSubmissionResultsSwr(...)` rồi **chỉ đọc
  `resultsSwr.data?.aiFeedback`**; `isEmpty={Boolean(resultsSwr.data) && !aiFeedback}`.
- ⚠️ Hệ quả trực tiếp: bài nộp được chấm bằng test case **không có `aiFeedback`** ⇒ học viên bấm
  "Xem kết quả" sẽ thấy **trạng thái rỗng**, dù đã có điểm và có kết quả từng case. Đây là regression
  phải vá **cùng đợt** với BE.
- `TestResultView` (`src/modules/api/rest/challenges/types.ts`) chưa có `verdict`/`timeMs` — học viên
  không phân biệt được **sai đáp án** với **quá thời gian / tràn bộ nhớ / lỗi biên dịch**, đúng thứ
  cần thấy khi code chạy vô hạn.

## What Changes

- `TestResultView` thêm `verdict` (`AC|WA|TLE|MLE|RE|CE|SKIPPED`) và `timeMs` (BE contract §6).
- Component mới hiển thị **bảng kết quả từng test case**: tên case, chip verdict có màu, thời gian
  chạy, điểm; case ẩn hiện verdict nhưng **không lộ** input/expected/output.
- `ChallengeSubmission` render bảng này khi có `results`, **song song** với `GradeResultCard` khi có
  `aiFeedback` (một bài có thể vừa có điểm test case vừa có nhận xét AI). Sửa điều kiện rỗng để
  không còn coi "không có aiFeedback" là rỗng.
- Tóm tắt ngắn phía trên bảng: *"Qua X/Y test case"* + cảnh báo khi lượt chấm bị **dừng sớm**
  (có case `SKIPPED`) để học viên hiểu vì sao chưa chạy hết.

## Capabilities

### New Capabilities
- `challenge-testcase-results`: xem kết quả từng test case kèm verdict cho bài nộp chấm tự động.

## Impact

- `src/modules/api/rest/challenges/types.ts` (`TestResultView`).
- `src/components/features/learn/ChallengeSubmission/index.tsx` (nhánh render + điều kiện rỗng).
- Component mới `TestCaseResultTable` (đặt cạnh `ChallengeSubmission`).
- i18n `vi` + `en` cho nhãn verdict và tóm tắt.
- Không đổi endpoint (dùng lại `useQueryChallengeSubmissionResultsSwr`); phụ thuộc BE trả field mới.
