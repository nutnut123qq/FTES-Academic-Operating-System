# Proposal — practice-question-bank

## Why

Checklist STT 9: khu Practice của không gian môn học chưa bấm được gì; user cần quản lí
ngân hàng câu hỏi + bài code kiểu LeetCode (nền cho ngân hàng đề PE sau này).

## What Changes

- **Practice hub** (`SubjectPractice`): các card (Quiz · Flashcards · Coding challenge ·
  Leaderboard) bấm mở được sub-view (không còn nút chết).
- **Coding-challenge bank (LeetCode-style):** danh sách bài (tên · độ khó · tag · trạng
  thái đã/chưa giải · % chấp nhận) + filter (độ khó/trạng thái/tìm kiếm); trang chi tiết
  bài (đề · ví dụ · ràng buộc · editor placeholder + chọn ngôn ngữ · Run/Submit ra kết
  quả test-case mock pass/fail).
- FE-only, mock (theo pattern `useQuery*Swr` sẵn có). i18n gom vào scratch rồi merge.

## Capabilities

### Modified Capabilities

- `subject-practice`: hub Practice tương tác được + ngân hàng coding-challenge duyệt &
  thử (đọc + attempt); chưa CRUD (defer quản trị đề cho BE).

## Impact

- FE-only, thư mục `features/subject/SubjectPractice` + hooks. Không BE thật (mock),
  không dependency mới.
