# challenge-samples-and-limits — Hiện giới hạn bài + gom nhóm kết quả nhiều test case

## Why

Bài chấm bằng test case thường có **rất nhiều case** (tới 100). Hiện tại:

1. `TestCaseResultTable` **đổ hết mọi dòng** — 100 case là 100 dòng, không gom nhóm, lấn hết màn.
2. Học viên **không thấy giới hạn thời gian/bộ nhớ** của bài, dù đó là thứ quyết định cách viết
   thuật toán (HackerRank luôn ghi rõ).
3. Không biết **còn bao nhiêu lượt AI nhận xét** — BE nay giới hạn theo cấu hình của mentor.

## What Changes

- **Gom nhóm bảng kết quả**: case **mẫu** hiện chi tiết; case **ẩn** gom thành một dòng tóm tắt
  ("Test ẩn: 47/50 đạt") và **mở rộng được** để xem verdict từng case. Giữ nguyên luật không lộ
  input/expected/output của case ẩn.
- **Hiện giới hạn bài**: "Giới hạn: 2s · 256MB" ở khu vực đề (dữ liệu mới từ BE).
- **Hiện lượt AI nhận xét còn lại** cạnh nút nhờ AI, và nói rõ *điểm do test case chấm*.

## Capabilities

### New Capabilities
- `challenge-samples-and-limits`: hiện giới hạn tài nguyên, gom nhóm kết quả test case, hiện hạn mức
  AI nhận xét.

## Impact

- `TestCaseResultTable` (gom nhóm + mở rộng), `ChallengeProblemAside` (giới hạn),
  `ChallengeSubmission/index.tsx` (lượt AI), `modules/api/rest/challenges/types.ts`, i18n vi+en.
- Phụ thuộc BE change `challenge-testcase-samples`.
