# Tasks — challenge-testcase-results

## 1. Contract
- [x] 1.1 `TestResultView` (`src/modules/api/rest/challenges/types.ts`) thêm `verdict` (`AC|WA|TLE|MLE|RE|CE|SKIPPED`,
      nullable khi đang chấm) + `timeMs` (nullable) — khớp BE `challenge-testcase-judge` design §6

## 2. Bảng kết quả test case
- [x] 2.1 Component `TestCaseResultTable` (cạnh `ChallengeSubmission`): mỗi dòng = tên case + chip verdict
      + `timeMs` + điểm; case ẩn chỉ hiện bấy nhiêu (KHÔNG render input/expected/output kể cả nếu có)
- [x] 2.2 Chip verdict dùng semantic token của hệ (AC success / WA danger / TLE·MLE warning / RE·CE muted),
      KHÔNG hard-code màu hex
- [x] 2.3 Tóm tắt "Qua X/Y test case" + dòng cảnh báo khi có case `SKIPPED` (chấm dừng sớm)

## 3. Nối vào màn xem kết quả
- [x] 3.1 `ChallengeSubmission/index.tsx`: render `TestCaseResultTable` khi `resultsSwr.data?.results?.length`,
      GIỮ `GradeResultCard` khi có `aiFeedback` (hiện được cả hai)
- [x] 3.2 **Sửa điều kiện rỗng**: hiện `isEmpty={Boolean(resultsSwr.data) && !aiFeedback}` → phải tính cả
      `results` (nếu không, bài chấm bằng test case sẽ hiện trạng thái rỗng — regression)

## 4. i18n
- [x] 4.1 Nhãn verdict + tóm tắt + cảnh báo dừng sớm cho `vi` (canonical) và `en` (parity)

## 5. Verify
- [x] 5.1 `npm run build` (webpack) + `tsc --noEmit` xanh
- [x] 5.2 Nếu có test bên cạnh component tương tự thì thêm test thuần cho hàm map verdict → nhãn/màu
