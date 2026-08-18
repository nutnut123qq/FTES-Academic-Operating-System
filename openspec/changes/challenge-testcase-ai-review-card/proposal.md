# Nhận xét AI của bài test case không được hiện như một điểm thứ hai

## Why

BE change `challenge-testcase-ai-review` bỏ điều kiện "phải khai tiêu chí" nên **mọi** bài chấm bằng
test case nay đều có nhận xét AI. Thẻ nhận xét (`GradeResultCard`) dựng cho đường AI-CHẤM-ĐIỂM: nó
mở đầu bằng dòng `40/100 điểm` cỡ h5 kèm chip verdict.

Ghép hai thứ đó lại: học viên pass 21/21 test case đọc ngay bên dưới bảng kết quả một con số 40/100
và một chip FAIL, không có gì nói con số nào mới là điểm. Trước đây ca này hiếm (chỉ đề có khai tiêu
chí mới gọi AI); sau change BE nó thành mặc định.

## What Changes

- `GradeResultCard` nhận cờ `scoreOwnedByTests`: thay dòng điểm + chip verdict bằng tiêu đề
  "Nhận xét của FrosTES" và một dòng nói rõ điểm đến từ bộ test.
- `ChallengeSubmission` bật cờ đó khi bài nộp CÓ kết quả test case.
- Phần nhận xét, tiêu chí, gợi ý cải thiện giữ nguyên — đó là thứ học viên vào đây để đọc.

## Impact

- Affected specs: `challenge-submission`
- Affected code: `components/features/challenge/ChallengeView/GradeCodePanel/GradeResultCard.tsx`,
  `components/features/learn/ChallengeSubmission/index.tsx`, `messages/{vi,en}.json`
